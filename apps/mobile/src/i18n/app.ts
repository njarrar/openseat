// Copy that only the app needs, from the app group in languages/<code>.xml.
// Everything shared with the website is built in apps/web/src/i18n/dict.ts.

import type { Strings } from '../../../web/src/i18n/strings';

export function buildAppDict(s: Strings) {
  const x = s.text.bind(s);

  return {
    tabs: s.map<'search' | 'alerts' | 'settings'>('app.tabs'),

    search: {
      title: x('app.search.title'),
      androidTitle: x('app.search.androidTitle'),
      sub: x('app.search.sub'),
      androidSub: x('app.search.androidSub'),
      program: x('app.search.program'),
      // Short airline names for the program switch.
      airlines: s.map<'EK' | 'EY' | 'QR'>('app.search.airlines'),
      route: x('app.search.route'),
      trip: x('app.search.trip'),
      from: x('app.search.from'),
      to: x('app.search.to'),
      swap: x('app.search.swap'),
      returnTrip: x('app.search.returnTrip'),
      backAfter: x('app.search.backAfter'),
      weeks: (w: number) => s.plural('app.search.weeks', w),
      fewer: x('app.search.fewer'),
      more: x('app.search.more'),
      note: x('app.search.note'),
      find: x('app.search.find'),
      findAndroid: x('app.search.findAndroid'),
      live: x('app.search.live'),
      sentence: x('app.search.sentence'),
    },

    cal: {
      // Airport codes read left to right in both languages, as on the website.
      route: (from: string, to: string) => x('app.cal.route', { from, to }),
      navSub: (cabin: string, pax: string, alert: boolean) => x(alert ? 'app.cal.navSubAlert' : 'app.cal.navSub', { cabin, pax }),
      back: x('app.cal.back'),
      open: (date: string) => x('app.cal.open', { date }),
      noReply: x('app.cal.noReply'),
    },

    day: {
      book: x('app.day.book'),
      hide: x('app.day.hide'),
      share: x('app.day.share'),
      choose: (flights: string, cabin: string) => x('app.day.choose', { flights, cabin }),
      total: (pax: string) => x('app.day.total', { pax }),
      totalValue: (miles: string, unit: string, tax: string) => x('app.day.totalValue', { miles, unit, tax }),
      shareText: (from: string, to: string, cabin: string) => x('app.day.shareText', { from, to, cabin }),
    },

    alerts: {
      title: x('app.alerts.title'),
      sub: x('app.alerts.sub'),
      empty: x('app.alerts.empty'),
      turnOff: (route: string) => x('app.alerts.turnOff', { route }),
      undo: x('app.alerts.undo'),
      to: (address: string) => x('app.alerts.to', { address }),
      telegram: x('app.alerts.telegram'),
    },

    settings: {
      title: x('app.settings.title'),
      language: x('app.settings.language'),
      system: x('app.settings.system'),
      systemSub: (name: string) => x('app.settings.systemSub', { name }),
      languageNote: x('app.settings.languageNote'),
      currencyNote: x('app.settings.currencyNote'),
      appearance: x('app.settings.appearance'),
      appearanceNote: x('app.settings.appearanceNote'),
      help: x('app.settings.help'),
      data: x('app.settings.data'),
      sample: x('app.settings.sample'),
      live: x('app.settings.live'),
      about: x('app.settings.about'),
    },
  };
}

export type AppDict = ReturnType<typeof buildAppDict>;
