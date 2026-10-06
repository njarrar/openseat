import { createContext } from 'preact';
import { useContext, useMemo, useState } from 'preact/hooks';
import { convert, currencyForLocale, isCurrency, toUtc, type CabinId, type CarrierId, type CurrencyId } from '@openseat/shared';
import { DICTS, isLang, type Dict, type Lang } from './dicts';

export type { Dict, Lang } from './dicts';
export { LANGS, isLang, pickLang } from './dicts';
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
  const l = document.documentElement.lang;
  return isLang(l) ? l : 'en';
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
      // In right-to-left text, isolate the amount so "US$ 412" is not reordered.
      return t.dir === 'rtl' ? '\u2066' + s + '\u2069' : s;
    },
    dateLong: (iso: string) => long.format(toUtc(iso)),
    dateShort: (iso: string) => short.format(toUtc(iso)),
    month: (iso: string) => month.format(toUtc(iso)),
    duration: (min: number) => {
      const m = Math.round(min / 5) * 5;
      const h = Math.floor(m / 60), r = String(m % 60).padStart(2, '0');
      return t.format.duration(h, r);
    },
    ago: (iso: string, now = Date.now()) => {
      const min = Math.round((now - Date.parse(iso)) / 60000);
      if (min < 60) return rtf.format(-Math.max(0, min), 'minute');
      const h = Math.round(min / 60);
      return h < 48 ? rtf.format(-h, 'hour') : rtf.format(-Math.round(h / 24), 'day');
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
