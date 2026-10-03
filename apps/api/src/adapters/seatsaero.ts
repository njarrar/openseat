import { CABIN_IDS, type CabinFare, type CabinId, type CarrierId, type DayResult, type Itinerary, type Leg } from '@openseat/shared';
import type { Route } from '../store/types.js';
import type { CarrierAdapter } from './types.js';

// Reads cached reward availability from the seats.aero partner API, a licensed
// data provider. One request per 15-day block (plus pages), with flight detail
// included, so we never ask once per day.
//
// Their Pro key is for personal use. Running this on a public site needs a
// commercial agreement with seats.aero first. See docs/data-sources.md.

const BASE = 'https://seats.aero/partnerapi';

/** seats.aero source name for each program. Qatar is off until they list it. */
export const DEFAULT_SOURCES: Partial<Record<CarrierId, string>> = { EK: 'emirates', EY: 'etihad' };

interface Segment {
  FlightNumber: string;
  AircraftName?: string;
  AircraftCode?: string;
  OriginAirport: string;
  DestinationAirport: string;
  DepartsAt: string;
  ArrivesAt: string;
  Distance?: number;
  Order?: number;
}

interface Trip {
  Cabin: string;
  FlightNumbers: string;
  Carriers?: string;
  Stops: number;
  TotalDuration: number;
  RemainingSeats: number;
  MileageCost: number;
  TotalTaxes: number;
  TaxesCurrency?: string;
  OriginAirport: string;
  DestinationAirport: string;
  DepartsAt: string;
  ArrivesAt: string;
  AvailabilitySegments?: Segment[];
}

interface Availability {
  Date: string;
  UpdatedAt?: string;
  Route?: { OriginAirport: string; DestinationAirport: string; Source: string };
  AvailabilityTrips?: Trip[] | null;
}

interface Page {
  data: Availability[];
  hasMore?: boolean;
  cursor?: number;
}

const CABIN: Record<string, CabinId> = { economy: 'economy', premium: 'premium', business: 'business', first: 'first' };

/** Their times are local to each airport, written with a trailing Z. Read them as they are. */
const hhmm = (s: string) => s.slice(11, 16);
const localDate = (s: string) => s.slice(0, 10);
const minutes = (s: string) => Date.parse(s.slice(0, 19) + 'Z') / 60000;

const emptyCabin = (): CabinFare => ({ seats: null, miles: null, tax: null, saver: true });

export interface SeatsAeroOptions {
  apiKey: string;
  sources?: Partial<Record<CarrierId, string>>;
  fetch?: typeof fetch;
  /** Hard cap on pages per block, so a bad cursor can never loop. */
  maxPages?: number;
}

export class SeatsAeroAdapter implements CarrierAdapter {
  readonly name = 'seatsaero';
  private sources: Partial<Record<CarrierId, string>>;
  private fetch: typeof fetch;

  constructor(private opts: SeatsAeroOptions) {
    this.sources = opts.sources ?? DEFAULT_SOURCES;
    this.fetch = opts.fetch ?? globalThis.fetch;
  }

  supports(carrier: CarrierId) {
    return Boolean(this.sources[carrier]);
  }

  async fetchDays(route: Route, dates: string[], signal: AbortSignal): Promise<DayResult[]> {
    const source = this.sources[route.carrier];
    if (!source) throw new Error(`seats.aero has no source for ${route.carrier}`);
    const rows: Availability[] = [];
    let skip = 0;
    let cursor: number | undefined;
    for (let page = 0; page < (this.opts.maxPages ?? 5); page++) {
      const q = new URLSearchParams({
        origin_airport: route.origin,
        destination_airport: route.destination,
        start_date: dates[0],
        end_date: dates[dates.length - 1],
        sources: source,
        carriers: route.carrier,
        include_trips: 'true',
        take: '500',
      });
      if (cursor !== undefined) q.set('cursor', String(cursor));
      if (skip) q.set('skip', String(skip));
      const res = await this.fetch(`${BASE}/search?${q}`, {
        headers: { 'Partner-Authorization': this.opts.apiKey, accept: 'application/json' },
        signal,
      });
      if (!res.ok) throw new Error(`seats.aero answered ${res.status}`);
      const body = (await res.json()) as Page;
      rows.push(...(body.data ?? []));
      if (!body.hasMore || !body.data?.length) break;
      cursor = body.cursor;
      skip += body.data.length;
    }
    return toDays(route, dates, rows, new Date());
  }
}

/** Turn seats.aero rows into one DayResult per requested date. Exported for tests. */
export function toDays(route: Route, dates: string[], rows: Availability[], now: Date): DayResult[] {
  const byDate = new Map<string, { its: Map<string, Itinerary>; updated: number[] }>();
  for (const d of dates) byDate.set(d, { its: new Map(), updated: [] });

  for (const row of rows) {
    const day = byDate.get(row.Date);
    if (!day) continue;
    if (row.UpdatedAt && !Number.isNaN(Date.parse(row.UpdatedAt))) day.updated.push(Date.parse(row.UpdatedAt));
    for (const t of row.AvailabilityTrips ?? []) {
      const cabin = CABIN[t.Cabin?.toLowerCase()];
      if (!cabin || t.OriginAirport !== route.origin || t.DestinationAirport !== route.destination) continue;
      const key = flightKey(t);
      if (!key || localDate(t.DepartsAt) !== row.Date) continue;
      const it = day.its.get(key) ?? newItinerary(route, row.Date, key, t);
      // They report 0 when the seat count is unknown. A listed trip has at least one.
      const seats = Math.max(1, Number(t.RemainingSeats) || 0);
      const prev = it.cabins[cabin];
      // Keep the lower price if the same cabin shows up twice.
      if (prev.miles === null || t.MileageCost < prev.miles) {
        // Taxes come in the currency's minor unit (cents).
        it.cabins[cabin] = { seats, miles: Number(t.MileageCost), tax: Math.round(Number(t.TotalTaxes) / 100), saver: true };
      }
      if (t.TaxesCurrency) it.currency = t.TaxesCurrency.toUpperCase();
      day.its.set(key, it);
    }
  }

  return dates.map((date) => {
    const day = byDate.get(date)!;
    // Show when the provider last read the airline, not when we asked the provider.
    const checked = day.updated.length ? Math.min(...day.updated) : now.getTime();
    const itineraries = [...day.its.values()].sort((a, b) => a.dep.localeCompare(b.dep));
    return { date, itineraries, checkedAt: new Date(Math.min(checked, now.getTime())).toISOString() };
  });
}

/** Flight numbers in flying order, so the same flight gets the same key in every cabin. */
function flightKey(t: Trip) {
  const segs = [...(t.AvailabilitySegments ?? [])].sort((a, b) => (a.Order ?? 0) - (b.Order ?? 0));
  const nums = segs.length ? segs.map((s) => s.FlightNumber) : (t.FlightNumbers ?? '').split(',');
  return nums.map((s) => s.trim()).filter(Boolean).join('-');
}

function newItinerary(route: Route, date: string, key: string, t: Trip): Itinerary {
  const segs = [...(t.AvailabilitySegments ?? [])].sort((a, b) => (a.Order ?? 0) - (b.Order ?? 0));
  const legs: Leg[] = segs.map((s) => ({
    flight: s.FlightNumber,
    from: s.OriginAirport,
    to: s.DestinationAirport,
    dep: hhmm(s.DepartsAt),
    arr: hhmm(s.ArrivesAt),
    aircraft: s.AircraftName || s.AircraftCode || '',
  }));
  let layoverMin = 0;
  for (let i = 1; i < segs.length; i++) {
    // Both times are at the same connecting airport, so local clocks compare directly.
    layoverMin += Math.max(0, minutes(segs[i].DepartsAt) - minutes(segs[i - 1].ArrivesAt));
  }
  const longest = segs.reduce<Segment | undefined>((a, s) => (!a || (s.Distance ?? 0) > (a.Distance ?? 0) ? s : a), undefined);
  const dayOffset = Math.round((Date.parse(localDate(t.ArrivesAt)) - Date.parse(localDate(t.DepartsAt))) / 86400000);
  const cabins = Object.fromEntries(CABIN_IDS.map((c) => [c, emptyCabin()])) as Record<CabinId, CabinFare>;
  return {
    key,
    carrier: route.carrier,
    origin: route.origin,
    destination: route.destination,
    date,
    hub: segs.length > 1 ? segs[0].DestinationAirport : null,
    dep: hhmm(t.DepartsAt),
    arr: hhmm(t.ArrivesAt),
    dayOffset,
    durationMin: Number(t.TotalDuration) || 0,
    layoverMin,
    aircraft: longest?.AircraftName || longest?.AircraftCode || '',
    legs,
    // The provider returns trips the program prices as one award.
    separateTickets: false,
    currency: 'USD',
    cabins,
  };
}
