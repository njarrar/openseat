import {
  CABIN_BY_ID, CARRIER_BY_ID, MAX_PAX, gulfToday, isAirport, isCabin, isCarrier, programName, summarise, windowDates,
  type AlertRequest, type DayResult,
} from '@openseat/shared';
import type { AlertRow, InventoryStore, Route } from '../store/types.js';
import type { Notifier } from './notifier.js';

/** The terms promise at most two emails a day per alert. */
export const MAX_PER_DAY = 2;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export class ValidationError extends Error {}

export function validateAlert(body: unknown): AlertRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  if (!isCarrier(b.carrier)) throw new ValidationError('Unknown program');
  if (!isAirport(b.origin) || !isAirport(b.destination) || b.origin === b.destination) throw new ValidationError('Pick two different airports');
  if (!isCabin(b.cabin)) throw new ValidationError('Unknown cabin');
  const pax = Number(b.pax);
  if (!Number.isInteger(pax) || pax < 1 || pax > MAX_PAX) throw new ValidationError('Travellers must be 1 to 6');
  if (b.channel !== 'email') throw new ValidationError('Only email alerts are available for now');
  const address = String(b.address ?? '').trim().toLowerCase();
  if (address.length > 254 || !EMAIL.test(address)) throw new ValidationError('Enter a valid email address');
  return { carrier: b.carrier, origin: b.origin, destination: b.destination, cabin: b.cabin, pax, channel: 'email', address };
}

export class AlertService {
  constructor(private store: InventoryStore, private notifier: Notifier, private publicUrl: string, private apiUrl: string) {}

  async create(req: AlertRequest) {
    // Start from what is open now, so the first email means "newly open".
    const days = await this.store.getDays(req, windowDates());
    const open = [...days.values()].some((d) => summarise(d, req.pax)[req.cabin].count > 0);
    return this.store.createAlert({ ...req, open });
  }

  /** Compare fresh days with each alert's last state and send what is newly open. */
  async check(route: Route, fresh: DayResult[]) {
    const alerts = await this.store.alertsForRoute(route);
    if (!alerts.length) return;
    const stored = await this.store.getDays(route, windowDates());
    for (const d of fresh) stored.set(d.date, d);
    const days = [...stored.values()].sort((a, b) => a.date.localeCompare(b.date));
    const today = gulfToday();
    for (const a of alerts) {
      const openDays = days.filter((d) => summarise(d, a.pax)[a.cabin].count > 0);
      const open = openDays.length > 0;
      let { sentToday, sentDay } = a;
      if (sentDay !== today) sentToday = 0;
      if (open && !a.open && sentToday < MAX_PER_DAY) {
        await this.notifier.send(a, this.message(a, openDays));
        sentToday += 1;
        sentDay = today;
      }
      if (open !== a.open || sentToday !== a.sentToday || sentDay !== a.sentDay) {
        await this.store.updateAlertState(a.id, { open, sentToday, sentDay });
      }
    }
  }

  private message(a: AlertRow, openDays: DayResult[]) {
    const cabin = CABIN_BY_ID[a.cabin].en;
    const carrier = CARRIER_BY_ID[a.carrier];
    const first = openDays.slice(0, 5).map((d) => d.date).join(', ');
    const link = `${this.publicUrl}/?p=${a.carrier}&o=${a.origin}&d=${a.destination}&c=${a.cabin}&n=${a.pax}`;
    return {
      subject: `${cabin} seats open: ${a.origin} to ${a.destination}`,
      text: [
        `${cabin} reward seats are open on ${programName(carrier)} from ${a.origin} to ${a.destination} for ${a.pax} traveller${a.pax > 1 ? 's' : ''}.`,
        `First days: ${first}${openDays.length > 5 ? ` and ${openDays.length - 5} more` : ''}.`,
        `See them: ${link}`,
        '',
        `Seats can go quickly. Confirm on ${carrier.site} before you move miles.`,
        `Turn this alert off: ${this.apiUrl.replace(/\/$/, '')}/api/v1/alerts/unsubscribe?token=${encodeURIComponent(a.token)}`,
      ].join('\n'),
    };
  }
}
