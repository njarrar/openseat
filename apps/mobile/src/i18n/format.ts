// Number, date and name formatting, matching the website's (apps/web/src/i18n/index.ts).
// Hermes does not ship every Intl API on every platform, so each formatter
// falls back to plain English formatting instead of throwing.

import { convert, toUtc, type CabinId, type CarrierId, type CurrencyId } from '@openseat/shared';
import type { Lang } from './dicts';
import { DICTS } from './dicts';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dateFormat(locale: string, opts: Intl.DateTimeFormatOptions): (d: Date) => string {
  try {
    const df = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...opts });
    return (d) => df.format(d);
  } catch {
    return (d) => {
      const day = DAYS[d.getUTCDay()], month = MONTHS[d.getUTCMonth()];
      if (opts.year) return `${month} ${d.getUTCFullYear()}`;
      if (opts.weekday === 'short') return `${day.slice(0, 3)} ${d.getUTCDate()} ${month.slice(0, 3)}`;
      return `${day} ${d.getUTCDate()} ${month}`;
    };
  }
}

function numberFormat(locale: string, opts?: Intl.NumberFormatOptions): (n: number) => string {
  try {
    const nf = new Intl.NumberFormat(locale, opts);
    return (n) => nf.format(n);
  } catch {
    return (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

function relative(locale: string, lang: Lang): (n: number, unit: 'minute' | 'hour' | 'day') => string {
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    return (n, unit) => rtf.format(n, unit);
  } catch {
    return (n, unit) => {
      const v = Math.abs(n);
      if (lang === 'ar') return `قبل ${v} ${{ minute: 'دقيقة', hour: 'ساعة', day: 'يوم' }[unit]}`;
      if (v === 0) return unit === 'day' ? 'today' : `this ${unit}`;
      return `${v} ${unit}${v === 1 ? '' : 's'} ago`;
    };
  }
}

export function makeFormat(lang: Lang, currency: CurrencyId = 'USD') {
  const t = DICTS[lang];
  const num = numberFormat(t.numberLocale);
  const long = dateFormat(t.locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const short = dateFormat(t.locale, { weekday: 'short', day: 'numeric', month: 'short' });
  const month = dateFormat(t.locale, { month: 'long', year: 'numeric' });
  const rel = relative(t.locale, lang);
  const money: Record<string, (n: number) => string> = {};
  return {
    num,
    /** Shown in the chosen currency when we can convert exactly, else in the currency it came in. */
    money: (n: number, from: string) => {
      const v = convert(n, from, currency);
      const code = v === null ? from : currency;
      money[code] ??= numberFormat(t.numberLocale, { style: 'currency', currency: code, maximumFractionDigits: 0 });
      const s = money[code](v ?? n);
      // A bare number means the currency format is missing; add the code.
      const out = /^[\d.,\s]+$/.test(s) ? `${code} ${s}` : s;
      // In right-to-left text, isolate the amount so "US$ 412" is not reordered.
      return t.dir === 'rtl' ? '⁦' + out + '⁩' : out;
    },
    dateLong: (iso: string) => long(toUtc(iso)),
    dateShort: (iso: string) => short(toUtc(iso)),
    month: (iso: string) => month(toUtc(iso)),
    duration: (min: number) => {
      const m = Math.round(min / 5) * 5;
      const h = Math.floor(m / 60), r = String(m % 60).padStart(2, '0');
      return t.format.duration(h, r);
    },
    ago: (iso: string, now = Date.now()) => {
      const min = Math.round((now - Date.parse(iso)) / 60000);
      if (min < 60) return rel(-Math.max(0, min), 'minute');
      const h = Math.round(min / 60);
      return h < 48 ? rel(-h, 'hour') : rel(-Math.round(h / 24), 'day');
    },
    city: (code: string) => t.names.city[code],
    country: (code: string) => t.names.country[code],
    cabin: (id: CabinId) => t.names.cabin[id],
    cabinShort: (id: CabinId) => t.names.cabinShort[id],
    airline: (id: CarrierId) => t.names.airline[id],
    program: (id: CarrierId) => t.names.program[id],
    programOnly: (id: CarrierId) => t.names.programOnly[id],
    unit: (id: CarrierId) => t.names.unit[id],
    term: (id: CarrierId) => t.names.term[id],
  };
}

export type Format = ReturnType<typeof makeFormat>;
