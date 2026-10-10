// Turns a language file into the copy the website and the apps use. The words
// live in languages/<code>.xml; this file only says which line goes where and
// fills in the values.

import type { Strings } from './strings';
import type { Lang, Seg } from './types';

export function buildDict(s: Strings) {
  const x = s.text.bind(s);
  const p = s.plural.bind(s);
  const texts = s.texts.bind(s);

  return {
    dir: s.file.dir,
    locale: s.file.locale,
    numberLocale: s.file.numberLocale,

    meta: {
      searchTitle: x('meta.searchTitle'),
      howTitle: x('meta.howTitle'),
      termsTitle: x('meta.termsTitle'),
    },

    nav: {
      home: x('nav.home'),
      search: x('nav.search'),
      howToUse: x('nav.howToUse'),
      terms: x('nav.terms'),
      switchTo: x('nav.switchTo'),
      switchLang: x('nav.switchLang') as Lang,
      switchLabel: x('nav.switchLabel'),
      currency: x('nav.currency'),
      currencies: s.map<'USD' | 'AED' | 'SAR' | 'QAR'>('nav.currencies'),
    },

    footer: {
      disclaimer: x('footer.disclaimer'),
      sample: x('footer.sample'),
      copyright: x('footer.copyright'),
    },

    search: {
      eyebrow: x('search.eyebrow'),
      sentence: (): Seg[] => s.segments('search.sentence'),
      pax: (n: number) => p('search.pax', n),
      ret: (days: number) => (days === 0 ? x('search.retNone') : p('search.ret', days / 7)),
      sameAirport: x('search.sameAirport'),
      chipLabel: (what: string, value: string) => x('search.chipLabel', { what, value }),
    },

    picker: {
      program: x('picker.program'),
      programSub: (unit: string, hub: string) => x('picker.programSub', { unit, hub }),
      cabin: x('picker.cabin'),
      premiumSub: x('picker.premiumSub'),
      pax: x('picker.pax'),
      paxSub: (n: number) => (n > 1 ? p('picker.paxSub', n) : ''),
      ret: x('picker.ret'),
      retOption: (days: number) => (days === 0 ? x('picker.retOptionNone') : p('picker.retOption', days / 7)),
      retSub: (days: number) => (days === 0 ? x('picker.retSubNone') : x('picker.retSub', { min: days - 3, max: days + 3 })),
      from: x('picker.from'),
      to: x('picker.to'),
      airportLabel: x('picker.airportLabel'),
      airportPlaceholder: x('picker.airportPlaceholder'),
      popular: x('picker.popular'),
      all: x('picker.all'),
      routeAria: (from: string, to: string) => x('picker.routeAria', { from, to }),
      empty: x('picker.empty'),
      close: x('picker.close'),
    },

    cal: {
      outbound: x('cal.outbound'),
      return: x('cal.return'),
      tablist: x('cal.tablist'),
      title: (cabin: string, leg: 'one' | 'out' | 'ret') => x(leg === 'ret' ? 'cal.titleRet' : leg === 'out' ? 'cal.titleOut' : 'cal.titleOne', { cabin }),
      subFrom: (cabin: string, miles: string, unit: string, open: number, total: number) => x('cal.subFrom', { cabin, miles, unit, open, total }),
      subNone: (cabin: string) => x('cal.subNone', { cabin }),
      subNotOffered: (program: string, cabin: string) => x('cal.subNotOffered', { program, cabin }),
      subLoading: x('cal.subLoading'),
      legend: texts('cal.legend'),
      fits: (weeks: number) => p('cal.fits', weeks),
      weekdays: texts('cal.weekdays'),
      keys: x('cal.keys'),
      aria: (from: string, to: string, cabin: string) => x('cal.aria', { from, to, cabin }),
      seats: (n: number) => (n >= 4 ? x('cal.seatsMany') : p('cal.seats', n)),
      dayAria: (date: string, seats: string, miles: string, unit: string, fits: boolean) => x(fits ? 'cal.dayAriaFits' : 'cal.dayAria', { date, seats, miles, unit }),
      dayNone: (date: string, cabin: string) => x('cal.dayNone', { date, cabin }),
      dayPending: (date: string) => x('cal.dayPending', { date }),
      dayFailed: (date: string) => x('cal.dayFailed', { date }),
      checking: (n: number) => p('cal.checking', n),
      stop: x('cal.stop'),
      stopped: x('cal.stopped'),
      failed: x('cal.failed'),
      retry: x('cal.retry'),
    },

    day: {
      prev: x('day.prev'),
      next: x('day.next'),
      close: x('day.close'),
      sub: (count: number, total: number, from: string, to: string, cabin: string) => p('day.sub', total, { count, from, to, cabin }),
      noFlights: (from: string, to: string) => x('day.noFlights', { from, to }),
      trip: (out: string, ret: string, nights: number) => p('day.trip', nights, { out, ret }),
      alertOff: x('day.alertOff'),
      alertOn: x('day.alertOn'),
      copy: x('day.copy'),
      copied: x('day.copied'),
      updated: (time: string) => x('day.updated', { time }),
      refresh: x('day.refresh'),
      refreshing: x('day.refreshing'),
      refreshWait: x('day.refreshWait'),
      refreshFailed: x('day.refreshFailed'),
    },

    flight: {
      nonstop: x('flight.nonstop'),
      stop: (city: string, wait: string) => x('flight.stop', { city, wait }),
      taxes: (tax: string, n: number) => (n >= 9 ? x('flight.taxesMany', { tax }) : p('flight.taxes', n, { tax })),
      notOffered: (cabin: string) => x('flight.notOffered', { cabin }),
      noSeats: (cabin: string) => x('flight.noSeats', { cabin }),
      alsoOpen: x('flight.alsoOpen'),
      howToBook: x('flight.howToBook'),
      saver: x('flight.saver'),
      flex: x('flight.flex'),
      flexTitle: x('flight.flexTitle'),
      separate: x('flight.separate'),
      separateNote: x('flight.separateNote'),
      step1: (program: string, site: string) => x('flight.step1', { program, site }),
      step2: (from: string, to: string, date: string, term: string) => x('flight.step2', { from, to, date, term }),
      step3: (flights: string, cabin: string, pax: string, miles: string, unit: string, tax: string) => x('flight.step3', { flights, cabin, pax, miles, unit, tax }),
      step3None: (cabin: string, pax: string) => x('flight.step3None', { cabin, pax }),
      and: x('flight.and'),
      open: (site: string) => x('flight.open', { site }),
    },

    alert: {
      title: x('alert.title'),
      body: (cabin: string, from: string, to: string, program: string, pax: string) => x('alert.body', { cabin, from, to, program, pax }),
      email: x('alert.email'),
      help: x('alert.help'),
      invalid: x('alert.invalid'),
      submit: x('alert.submit'),
      cancel: x('alert.cancel'),
      on: (cabin: string, from: string, to: string) => x('alert.on', { cabin, from, to }),
      off: x('alert.off'),
      failed: x('alert.failed'),
      channel: x('alert.channel'),
      channels: s.map<'email' | 'telegram' | 'whatsapp'>('alert.channels'),
      phone: x('alert.phone'),
      phoneHelp: x('alert.phoneHelp'),
      phoneInvalid: x('alert.phoneInvalid'),
      telegramHelp: x('alert.telegramHelp'),
      telegramNext: x('alert.telegramNext'),
      telegramOpen: x('alert.telegramOpen'),
      onMessage: (cabin: string, from: string, to: string) => x('alert.onMessage', { cabin, from, to }),
      robot: x('alert.robot'),
    },

    how: {
      title: x('how.title'),
      intro: x('how.intro'),
      examples: x('how.examples'),
      steps: s.list('how.steps').map((_, i) => ({ title: x(`how.steps.${i}.title`), text: x(`how.steps.${i}.text`) })),
      reading: x('how.reading'),
      key: texts('how.key'),
      notesTitle: x('how.notesTitle'),
      notes: { EK: texts('how.notes.EK'), EY: texts('how.notes.EY'), QR: texts('how.notes.QR') } as Record<'EK' | 'EY' | 'QR', string[]>,
      goodTitle: x('how.goodTitle'),
      good: texts('how.good'),
      back: x('how.back'),
    },
  };
}

export type Dict = ReturnType<typeof buildDict>;
