import { createContext } from 'preact';
import { useContext, useMemo, useState } from 'preact/hooks';
import {
  AIRPORT_BY_CODE, CABIN_BY_ID, CARRIER_BY_ID, convert, currencyForLocale, isCurrency, programName, programNameAr, toUtc,
  type CabinId, type CarrierId, type CurrencyId,
} from '@openseat/shared';
import { ar } from './ar';
import { en, type Dict } from './en';
import type { Lang } from './types';

export type { Lang } from './types';
const DICTS: Record<Lang, Dict> = { en, ar };
const KEY = 'openseat-lang';
const CURRENCY_KEY = 'openseat-currency';

/** The saved currency, else one that fits the browser's region (ar-SA gives SAR). */
export function initialCurrency(): CurrencyId {
  try {
    const saved = localStorage.getItem(CURRENCY_KEY);
    if (isCurrency(saved)) return saved;
  } catch {
    /* storage blocked */
  }
  const locales = typeof navigator === 'undefined' ? [] : [...(navigator.languages ?? []), navigator.language];
  for (const l of locales) {
    const c = currencyForLocale(l);
    if (c !== 'USD') return c;
  }
  return 'USD';
}

/** The head script has already picked a language; read it back. */
export function initialLang(): Lang {
  return document.documentElement.lang === 'ar' ? 'ar' : 'en';
}

export function applyLang(lang: Lang, title?: (t: Dict) => string) {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = DICTS[lang].dir;
  if (title) document.title = title(DICTS[lang]);
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* storage blocked */
  }
  // Keep an explicit ?lang= in step with the choice, but do not add one.
  const url = new URL(location.href);
  if (url.searchParams.has('lang')) {
    url.searchParams.set('lang', lang);
    history.replaceState(history.state, '', url);
  }
}

export function makeFormat(lang: Lang, currency: CurrencyId = 'USD') {
  const t = DICTS[lang];
  const nf = new Intl.NumberFormat(t.numberLocale);
  const date = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(t.locale, { timeZone: 'UTC', ...opts });
  const long = date({ weekday: 'long', day: 'numeric', month: 'long' });
  const short = date({ weekday: 'short', day: 'numeric', month: 'short' });
  const month = date({ month: 'long', year: 'numeric' });
  const rtf = new Intl.RelativeTimeFormat(t.locale, { numeric: 'auto' });
  return {
    num: (n: number) => nf.format(n),
    /** Shown in the chosen currency when we can convert exactly, else in the currency it came in. */
    money: (n: number, from: string) => {
      const v = convert(n, from, currency);
      const s = new Intl.NumberFormat(t.numberLocale, { style: 'currency', currency: v === null ? from : currency, maximumFractionDigits: 0 }).format(v ?? n);
      // In Arabic text, isolate the amount so "US$ 412" is not reordered.
      return lang === 'ar' ? '\u2066' + s + '\u2069' : s;
    },
    dateLong: (iso: string) => long.format(toUtc(iso)),
    dateShort: (iso: string) => short.format(toUtc(iso)),
    month: (iso: string) => month.format(toUtc(iso)),
    duration: (min: number) => {
      const m = Math.round(min / 5) * 5;
      const h = Math.floor(m / 60), r = String(m % 60).padStart(2, '0');
      return lang === 'ar' ? `${h} س ${r} د` : `${h}h ${r}m`;
    },
    ago: (iso: string, now = Date.now()) => {
      const min = Math.round((now - Date.parse(iso)) / 60000);
      if (min < 60) return rtf.format(-Math.max(0, min), 'minute');
      const h = Math.round(min / 60);
      return h < 48 ? rtf.format(-h, 'hour') : rtf.format(-Math.round(h / 24), 'day');
    },
    city: (code: string) => (lang === 'ar' ? AIRPORT_BY_CODE[code].cityAr : AIRPORT_BY_CODE[code].city),
    country: (code: string) => (lang === 'ar' ? AIRPORT_BY_CODE[code].countryAr : AIRPORT_BY_CODE[code].country),
    cabin: (id: CabinId) => (lang === 'ar' ? CABIN_BY_ID[id].ar : CABIN_BY_ID[id].en),
    cabinShort: (id: CabinId) => (lang === 'ar' ? CABIN_BY_ID[id].arShort : CABIN_BY_ID[id].short),
    program: (id: CarrierId) => (lang === 'ar' ? programNameAr(CARRIER_BY_ID[id]) : programName(CARRIER_BY_ID[id])),
    programOnly: (id: CarrierId) => (lang === 'ar' ? CARRIER_BY_ID[id].programAr : CARRIER_BY_ID[id].program),
    unit: (id: CarrierId) => (lang === 'ar' ? CARRIER_BY_ID[id].unitAr : CARRIER_BY_ID[id].unit),
    term: (id: CarrierId) => (lang === 'ar' ? CARRIER_BY_ID[id].termAr : CARRIER_BY_ID[id].term),
  };
}

export type Format = ReturnType<typeof makeFormat>;

interface LangValue {
  lang: Lang;
  t: Dict;
  f: Format;
  setLang: (l: Lang) => void;
  currency: CurrencyId;
  setCurrency: (c: CurrencyId) => void;
}

const Ctx = createContext<LangValue | null>(null);
export const LangContext = Ctx;

export function useLangState(title?: (t: Dict) => string): LangValue {
  const [lang, set] = useState<Lang>(initialLang);
  const [currency, setCur] = useState<CurrencyId>(initialCurrency);
  return useMemo(() => ({
    lang,
    t: DICTS[lang],
    f: makeFormat(lang, currency),
    setLang: (l: Lang) => {
      applyLang(l, title);
      set(l);
    },
    currency,
    setCurrency: (c: CurrencyId) => {
      try {
        localStorage.setItem(CURRENCY_KEY, c);
      } catch {
        /* storage blocked */
      }
      setCur(c);
    },
  }), [lang, currency]);
}

export function useLang() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLang outside LangContext');
  return v;
}

export { DICTS };
