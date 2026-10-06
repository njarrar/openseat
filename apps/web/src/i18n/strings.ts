// Turns a language from lang/*.xml into the dictionary the pages use.
// The text lives in the XML; this file only says which value goes where.

import { AIRPORTS, CABIN_IDS, CARRIERS as CARRIER_LIST, type CarrierId } from '@openseat/shared';
import type { LangData, LangValue } from './lang-data';
import type { ChipId, Seg } from './types';

type Vars = Record<string, string | number>;
type Item = Record<string, LangValue>;

const fill = (s: string, vars: Vars) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

function pluralRule(locale: string): (n: number) => Intl.LDMLPluralRule {
  try {
    const r = new Intl.PluralRules(locale);
    return (n) => r.select(n);
  } catch {
    // Some phones ship without Intl.PluralRules.
    return (n) => (n === 1 ? 'one' : 'other');
  }
}

/** Reads strings from one language, falling back to English for any it leaves out. */
export function reader(data: LangData, base: LangData) {
  const rule = pluralRule(data.locale);
  const get = (key: string): LangValue => {
    const v = data.strings[key] ?? base.strings[key];
    if (v === undefined) throw new Error(`Missing string ${key} in lang/en.xml`);
    return v;
  };
  const text = (key: string, vars: Vars = {}) => {
    const v = get(key);
    return typeof v === 'string' ? fill(v, vars) : key;
  };
  const plural = (key: string, n: number, vars: Vars = {}) => {
    const v = get(key);
    if (typeof v === 'string') return fill(v, { n, ...vars });
    if (Array.isArray(v)) return key;
    return fill(v.plural[rule(n)] ?? v.plural.other, { n, ...vars });
  };
  const list = (key: string) => {
    const v = get(key);
    return Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : '')) : [];
  };
  const items = (key: string) => {
    const v = get(key);
    return Array.isArray(v) ? v.filter((x): x is Item => typeof x !== 'string') : [];
  };
  /** A section of single strings, such as names.city, keyed by what follows the dot. */
  const group = <K extends string>(prefix: string, ids: readonly K[]) => Object.fromEntries(ids.map((id) => [id, text(`${prefix}.${id}`)])) as Record<K, string>;
  return { text, plural, list, items, group };
}

const str = (v: LangValue | undefined) => (typeof v === 'string' ? v : '');
const strs = (v: LangValue | undefined) => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : '')) : []);

/** "Using {program}, show me ..." becomes words and picker buttons. */
function sentence(s: string): Seg[] {
  return s.split(/(\{\w+\})/).map((p) => p.trim()).filter(Boolean).map((p) => (/^\{\w+\}$/.test(p) ? { chip: p.slice(1, -1) as ChipId } : p));
}

const CABINS = CABIN_IDS;
const CARRIERS = CARRIER_LIST.map((c) => c.id);
const AIRPORT_CODES = AIRPORTS.map((a) => a.code);

export function makeDict(data: LangData, base: LangData) {
  const { text, plural, list, items, group } = reader(data, base);
  return {
    code: data.code,
    name: data.name,
    dir: data.dir,
    locale: data.locale,
    numberLocale: data.numbers,

    meta: {
      searchTitle: text('meta.searchTitle'),
      howTitle: text('meta.howTitle'),
      termsTitle: text('meta.termsTitle'),
    },

    nav: {
      home: text('nav.home'),
      search: text('nav.search'),
      howToUse: text('nav.howToUse'),
      terms: text('nav.terms'),
      language: text('nav.language'),
      currency: text('nav.currency'),
      currencies: group('nav.currencies', ['USD', 'AED', 'SAR', 'QAR'] as const),
    },

    footer: {
      disclaimer: text('footer.disclaimer'),
      sample: text('footer.sample'),
      copyright: text('footer.copyright'),
    },

    search: {
      eyebrow: text('search.eyebrow'),
      sentence: (): Seg[] => sentence(text('search.sentence')),
      pax: (n: number) => plural('search.pax', n),
      ret: (days: number) => (days === 0 ? text('search.oneWay') : plural('search.ret', days / 7)),
      sameAirport: text('search.sameAirport'),
      chipLabel: (what: string, value: string) => text('search.chipLabel', { what, value }),
    },

    picker: {
      program: text('picker.program'),
      programSub: (unit: string, hub: string) => text('picker.programSub', { unit, hub }),
      cabin: text('picker.cabin'),
      premiumSub: text('picker.premiumSub'),
      pax: text('picker.pax'),
      paxSub: (n: number) => (n > 1 ? plural('picker.paxSub', n) : ''),
      ret: text('picker.ret'),
      retOption: (days: number) => (days === 0 ? text('picker.oneWay') : plural('picker.retOption', days / 7)),
      retSub: (days: number) => (days === 0 ? text('picker.retSubOneWay') : text('picker.retSub', { from: days - 3, to: days + 3 })),
      from: text('picker.from'),
      to: text('picker.to'),
      airportLabel: text('picker.airportLabel'),
      airportPlaceholder: text('picker.airportPlaceholder'),
      popular: text('picker.popular'),
      all: text('picker.all'),
      routeAria: (from: string, to: string) => text('picker.routeAria', { from, to }),
      empty: text('picker.empty'),
      close: text('picker.close'),
    },

    cal: {
      outbound: text('cal.outbound'),
      return: text('cal.return'),
      tablist: text('cal.tablist'),
      title: (cabin: string, leg: 'one' | 'out' | 'ret') => text(leg === 'ret' ? 'cal.titleRet' : leg === 'out' ? 'cal.titleOut' : 'cal.titleOne', { cabin }),
      subFrom: (cabin: string, miles: string, unit: string, open: number, total: number) => text('cal.subFrom', { cabin, miles, unit, open, total }),
      subNone: (cabin: string) => text('cal.subNone', { cabin }),
      subNotOffered: (program: string, cabin: string) => text('cal.subNotOffered', { program, cabin }),
      subLoading: text('cal.subLoading'),
      legend: list('cal.legend'),
      fits: (weeks: number) => plural('cal.fits', weeks),
      weekdays: list('cal.weekdays'),
      keys: text('cal.keys'),
      aria: (from: string, to: string, cabin: string) => text('cal.aria', { from, to, cabin }),
      seats: (n: number) => (n >= 4 ? text('cal.seatsMany') : plural('cal.seats', n)),
      dayAria: (date: string, seats: string, miles: string, unit: string, fits: boolean) => text(fits ? 'cal.dayAriaFits' : 'cal.dayAria', { date, seats, miles, unit }),
      dayNone: (date: string, cabin: string) => text('cal.dayNone', { date, cabin }),
      dayPending: (date: string) => text('cal.dayPending', { date }),
      dayFailed: (date: string) => text('cal.dayFailed', { date }),
      checking: (n: number) => plural('cal.checking', n),
      stop: text('cal.stop'),
      stopped: text('cal.stopped'),
      failed: text('cal.failed'),
      retry: text('cal.retry'),
    },

    day: {
      prev: text('day.prev'),
      next: text('day.next'),
      close: text('day.close'),
      sub: (open: number, total: number, from: string, to: string, cabin: string) => plural('day.sub', total, { open, from, to, cabin }),
      noFlights: (from: string, to: string) => text('day.noFlights', { from, to }),
      trip: (out: string, ret: string, nights: number) => plural('day.trip', nights, { out, ret }),
      alertOff: text('day.alertOff'),
      alertOn: text('day.alertOn'),
      copy: text('day.copy'),
      copied: text('day.copied'),
      updated: (time: string) => text('day.updated', { time }),
      refresh: text('day.refresh'),
      refreshing: text('day.refreshing'),
      refreshWait: text('day.refreshWait'),
      refreshFailed: text('day.refreshFailed'),
    },

    flight: {
      nonstop: text('flight.nonstop'),
      stop: (city: string, wait: string) => text('flight.stop', { city, wait }),
      taxes: (tax: string, n: number) => (n >= 9 ? text('flight.taxesMany', { tax }) : plural('flight.taxes', n, { tax })),
      notOffered: (cabin: string) => text('flight.notOffered', { cabin }),
      noSeats: (cabin: string) => text('flight.noSeats', { cabin }),
      alsoOpen: text('flight.alsoOpen'),
      howToBook: text('flight.howToBook'),
      saver: text('flight.saver'),
      flex: text('flight.flex'),
      flexTitle: text('flight.flexTitle'),
      separate: text('flight.separate'),
      separateNote: text('flight.separateNote'),
      step1: (program: string, site: string) => text('flight.step1', { program, site }),
      step2: (from: string, to: string, date: string, term: string) => text('flight.step2', { from, to, date, term }),
      step3: (flights: string, cabin: string, pax: string, miles: string, unit: string, tax: string) => text('flight.step3', { flights, cabin, pax, miles, unit, tax }),
      step3None: (cabin: string, pax: string) => text('flight.step3None', { cabin, pax }),
      and: text('flight.and'),
      open: (site: string) => text('flight.open', { site }),
    },

    alert: {
      title: text('alert.title'),
      body: (cabin: string, from: string, to: string, program: string, pax: string) => text('alert.body', { cabin, from, to, program, pax }),
      email: text('alert.email'),
      help: text('alert.help'),
      invalid: text('alert.invalid'),
      submit: text('alert.submit'),
      cancel: text('alert.cancel'),
      on: (cabin: string, from: string, to: string) => text('alert.on', { cabin, from, to }),
      off: text('alert.off'),
      failed: text('alert.failed'),
      channel: text('alert.channel'),
      channels: group('alert.channels', ['email', 'telegram', 'whatsapp'] as const),
      phone: text('alert.phone'),
      phoneHelp: text('alert.phoneHelp'),
      phoneInvalid: text('alert.phoneInvalid'),
      telegramHelp: text('alert.telegramHelp'),
      telegramNext: text('alert.telegramNext'),
      telegramOpen: text('alert.telegramOpen'),
      onMessage: (cabin: string, from: string, to: string) => text('alert.onMessage', { cabin, from, to }),
      robot: text('alert.robot'),
    },

    how: {
      title: text('how.title'),
      intro: text('how.intro'),
      examples: text('how.examples'),
      steps: items('how.steps').map((s) => ({ title: str(s.title), text: str(s.text) })),
      reading: text('how.reading'),
      key: list('how.key'),
      notesTitle: text('how.notesTitle'),
      notes: Object.fromEntries(CARRIERS.map((c) => [c, list(`how.notes.${c}`)])) as Record<CarrierId, string[]>,
      goodTitle: text('how.goodTitle'),
      good: list('how.good'),
      back: text('how.back'),
    },

    /** The How to use page. */
    howPage: {
      title: text('howPage.title'),
      lede: text('howPage.lede'),
      basics: text('howPage.basics'),
      moves: items('howPage.moves').map((m) => [str(m.title), str(m.text)] as [string, string]),
      examples: text('howPage.examples'),
      tryIt: text('howPage.tryIt'),
      faqTitle: text('howPage.faqTitle'),
      faq: items('howPage.faq').map((m) => [str(m.q), str(m.a)] as [string, string]),
      start: text('howPage.start'),
    },

    /** Titles and tips for the worked examples, in the order of EXAMPLES in content/how.ts. */
    examples: items('examples.list').map((e) => ({ title: str(e.title), tips: strs(e.tips) })),

    terms: {
      title: text('terms.title'),
      updated: text('terms.updated'),
      sectionsLabel: text('terms.sectionsLabel'),
      intro: text('terms.intro'),
      sections: items('terms.sections').map((s) => [str(s.title), strs(s.body)] as [string, string[]]),
      start: text('terms.start'),
    },

    /** Names of cabins, programs and places in this language. */
    names: {
      cabin: group('names.cabin', CABINS),
      cabinShort: group('names.cabinShort', CABINS),
      airline: group('names.airline', CARRIERS),
      program: group('names.program', CARRIERS),
      programOnly: group('names.programOnly', CARRIERS),
      unit: group('names.unit', CARRIERS),
      term: group('names.term', CARRIERS),
      city: group('names.city', AIRPORT_CODES),
      country: group('names.country', AIRPORT_CODES),
    },

    format: {
      duration: (h: number, m: string) => text('format.duration', { h, m }),
    },
  };
}

export type Dict = ReturnType<typeof makeDict>;
