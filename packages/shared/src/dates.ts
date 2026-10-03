// Dates are plain YYYY-MM-DD strings. Arithmetic runs in UTC so daylight saving
// never shifts a day. The 90-day window starts on today's date in Gulf time
// (UTC+4), so a shared link shows the same days wherever it is opened.

import { WINDOW_DAYS } from './reference.js';

const GULF_OFFSET_MS = 4 * 3600 * 1000;

export const toUtc = (iso: string) => new Date(iso + 'T00:00:00Z');
export const fromUtc = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(iso: string, n: number): string {
  const d = toUtc(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUtc(d);
}

export const diffDays = (a: string, b: string) => Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / 86400000);

/** Monday = 0 ... Sunday = 6. */
export const weekday = (iso: string) => (toUtc(iso).getUTCDay() + 6) % 7;

export const gulfToday = (now: Date = new Date()) => fromUtc(new Date(now.getTime() + GULF_OFFSET_MS));

export function windowDates(now: Date = new Date(), days = WINDOW_DAYS): string[] {
  const start = gulfToday(now);
  return Array.from({ length: days }, (_, i) => addDays(start, i));
}

export const isIsoDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && fromUtc(toUtc(v)) === v;
