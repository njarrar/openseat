import { randomBytes, randomUUID } from 'node:crypto';
import pg from 'pg';
import type { CabinFare, CabinId, DayResult, Itinerary } from '@openseat/shared';
import type { AlertRow, InventoryStore, NewAlert, Route } from './types.js';

// DATE columns come back as plain strings, never shifted into a time zone.
pg.types.setTypeParser(1082, (v) => v);

const COL: Record<CabinId, string> = { economy: 'eco', premium: 'prem', business: 'biz', first: 'first' };
const CABINS = Object.keys(COL) as CabinId[];

const ITIN_COLS = [
  'carrier', 'origin', 'destination', 'flight_date', 'flight_key', 'hub', 'dep_time', 'arr_time', 'day_offset',
  'duration_min', 'layover_min', 'aircraft', 'separate_tickets', 'currency',
  ...CABINS.flatMap((c) => ['seats', 'miles', 'tax', 'saver'].map((f) => `${COL[c]}_${f}`)),
  'legs_json', 'scraped_at',
];

function rowToItinerary(r: Record<string, any>): Itinerary {
  const cabins = {} as Record<CabinId, CabinFare>;
  for (const c of CABINS) {
    cabins[c] = { seats: r[`${COL[c]}_seats`], miles: r[`${COL[c]}_miles`], tax: r[`${COL[c]}_tax`], saver: r[`${COL[c]}_saver`] };
  }
  return {
    key: r.flight_key, carrier: r.carrier, origin: r.origin, destination: r.destination, date: r.flight_date,
    hub: r.hub?.trim() || null, dep: r.dep_time, arr: r.arr_time, dayOffset: r.day_offset, durationMin: r.duration_min,
    layoverMin: r.layover_min, aircraft: r.aircraft, legs: r.legs_json, separateTickets: r.separate_tickets,
    currency: r.currency, cabins,
  };
}

function rowToAlert(r: Record<string, any>): AlertRow {
  return {
    id: r.id, carrier: r.carrier, origin: r.origin, destination: r.destination, cabin: r.cabin, pax: r.pax,
    channel: r.channel, address: r.address, token: r.token, open: r.is_open, sentToday: r.sent_today, sentDay: r.sent_day,
  };
}

export class PostgresStore implements InventoryStore {
  readonly pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString, max: 10 });
  }

  async getDays(route: Route, dates: string[]) {
    const out = new Map<string, DayResult>();
    if (!dates.length) return out;
    const args = [route.carrier, route.origin, route.destination, dates];
    const [days, its] = await Promise.all([
      this.pool.query(
        `SELECT flight_date, checked_at FROM route_days
          WHERE carrier=$1 AND origin=$2 AND destination=$3 AND flight_date = ANY($4::date[])`, args),
      this.pool.query(
        `SELECT * FROM award_itineraries
          WHERE carrier=$1 AND origin=$2 AND destination=$3 AND flight_date = ANY($4::date[])
          ORDER BY flight_date, dep_time`, args),
    ]);
    for (const r of days.rows) out.set(r.flight_date, { date: r.flight_date, checkedAt: new Date(r.checked_at).toISOString(), itineraries: [] });
    for (const r of its.rows) out.get(r.flight_date)?.itineraries.push(rowToItinerary(r));
    return out;
  }

  async putDays(route: Route, days: DayResult[]) {
    if (!days.length) return;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const dates = days.map((d) => d.date);
      await client.query(
        `DELETE FROM award_itineraries WHERE carrier=$1 AND origin=$2 AND destination=$3 AND flight_date = ANY($4::date[])`,
        [route.carrier, route.origin, route.destination, dates],
      );
      for (const day of days) {
        for (const it of day.itineraries) {
          const vals: unknown[] = [
            it.carrier, it.origin, it.destination, it.date, it.key, it.hub, it.dep, it.arr, it.dayOffset,
            it.durationMin, it.layoverMin, it.aircraft, it.separateTickets, it.currency,
            ...CABINS.flatMap((c) => [it.cabins[c].seats, it.cabins[c].miles, it.cabins[c].tax, it.cabins[c].saver]),
            JSON.stringify(it.legs), day.checkedAt,
          ];
          await client.query(
            `INSERT INTO award_itineraries (${ITIN_COLS.join(',')}) VALUES (${vals.map((_, i) => '$' + (i + 1)).join(',')})`,
            vals,
          );
        }
        await client.query(
          `INSERT INTO route_days (carrier, origin, destination, flight_date, checked_at) VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (carrier, origin, destination, flight_date) DO UPDATE SET checked_at = EXCLUDED.checked_at`,
          [route.carrier, route.origin, route.destination, day.date, day.checkedAt],
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async recordSearch(route: Route) {
    await this.pool.query(
      `INSERT INTO route_searches (carrier, origin, destination, day, searches) VALUES ($1,$2,$3,CURRENT_DATE,1)
       ON CONFLICT (carrier, origin, destination, day) DO UPDATE SET searches = route_searches.searches + 1`,
      [route.carrier, route.origin, route.destination],
    );
  }

  async popularRoutes(limit: number, sinceDays: number) {
    const r = await this.pool.query(
      `SELECT carrier, origin, destination FROM route_searches
        WHERE day >= CURRENT_DATE - $2::int
        GROUP BY carrier, origin, destination ORDER BY SUM(searches) DESC LIMIT $1`,
      [limit, sinceDays],
    );
    return r.rows as Route[];
  }

  async createAlert(a: NewAlert) {
    const r = await this.pool.query(
      `INSERT INTO alert_subscriptions (id, carrier, origin, destination, cabin, pax, channel, address, token, is_open)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [randomUUID(), a.carrier, a.origin, a.destination, a.cabin, a.pax, a.channel, a.address, randomBytes(24).toString('base64url'), a.open],
    );
    return rowToAlert(r.rows[0]);
  }

  async deleteAlert(id: string, token: string) {
    const r = await this.pool.query('DELETE FROM alert_subscriptions WHERE id=$1 AND token=$2', [id, token]);
    return (r.rowCount ?? 0) > 0;
  }

  async unsubscribe(token: string) {
    const r = await this.pool.query('DELETE FROM alert_subscriptions WHERE token=$1', [token]);
    return (r.rowCount ?? 0) > 0;
  }

  async alertsForRoute(route: Route) {
    const r = await this.pool.query(
      'SELECT * FROM alert_subscriptions WHERE carrier=$1 AND origin=$2 AND destination=$3',
      [route.carrier, route.origin, route.destination],
    );
    return r.rows.map(rowToAlert);
  }

  async alertRoutes() {
    const r = await this.pool.query('SELECT DISTINCT carrier, origin, destination FROM alert_subscriptions');
    return r.rows as Route[];
  }

  async updateAlertState(id: string, p: Pick<AlertRow, 'open' | 'sentToday' | 'sentDay'>) {
    await this.pool.query('UPDATE alert_subscriptions SET is_open=$2, sent_today=$3, sent_day=$4 WHERE id=$1', [id, p.open, p.sentToday, p.sentDay]);
  }

  async ping() {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async close() {
    await this.pool.end();
  }
}
