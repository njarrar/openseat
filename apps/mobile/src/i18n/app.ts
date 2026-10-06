// Copy that only the app needs. It lives in the app section of lang/*.xml,
// next to everything the website shares, so the two never drift apart.

import type { LangData } from '../../../web/src/i18n/lang-data';
import { reader } from '../../../web/src/i18n/strings';

export function makeAppDict(data: LangData, base: LangData) {
  const { text, plural, group } = reader(data, base);
  const s = (key: string) => text(`app.${key}`);
  return {
    tabs: group('app.tabs', ['search', 'alerts', 'settings'] as const),

    search: {
      title: s('search.title'),
      androidTitle: s('search.androidTitle'),
      sub: s('search.sub'),
      androidSub: s('search.androidSub'),
      program: s('search.program'),
      // Short airline names for the program switch.
      airlines: group('app.search.airlines', ['EK', 'EY', 'QR'] as const),
      route: s('search.route'),
      trip: s('search.trip'),
      from: s('search.from'),
      to: s('search.to'),
      swap: s('search.swap'),
      returnTrip: s('search.returnTrip'),
      backAfter: s('search.backAfter'),
      weeks: (w: number) => plural('app.search.weeks', w),
      fewer: s('search.fewer'),
      more: s('search.more'),
      note: s('search.note'),
      find: s('search.find'),
      findAndroid: s('search.findAndroid'),
      live: s('search.live'),
      sentence: s('search.sentence'),
    },

    cal: {
      // Airport codes read left to right in every language, as on the website.
      route: (from: string, to: string) => text('app.cal.route', { from, to }),
      navSub: (cabin: string, pax: string, alert: boolean) => text(alert ? 'app.cal.navSubAlert' : 'app.cal.navSub', { cabin, pax }),
      back: s('cal.back'),
      open: (date: string) => text('app.cal.open', { date }),
      noReply: s('cal.noReply'),
    },

    day: {
      book: s('day.book'),
      hide: s('day.hide'),
      share: s('day.share'),
      choose: (flights: string, cabin: string) => text('app.day.choose', { flights, cabin }),
      total: (pax: string) => text('app.day.total', { pax }),
      totalValue: (miles: string, unit: string, tax: string) => text('app.day.totalValue', { miles, unit, tax }),
      shareText: (from: string, to: string, cabin: string) => text('app.day.shareText', { from, to, cabin }),
    },

    alerts: {
      title: s('alerts.title'),
      sub: s('alerts.sub'),
      empty: s('alerts.empty'),
      turnOff: (route: string) => text('app.alerts.turnOff', { route }),
      undo: s('alerts.undo'),
      to: (address: string) => text('app.alerts.to', { address }),
      telegram: s('alerts.telegram'),
    },

    settings: {
      title: s('settings.title'),
      language: s('settings.language'),
      system: s('settings.system'),
      systemSub: (name: string) => text('app.settings.systemSub', { name }),
      languageNote: s('settings.languageNote'),
      currencyNote: s('settings.currencyNote'),
      appearance: s('settings.appearance'),
      appearanceNote: s('settings.appearanceNote'),
      help: s('settings.help'),
      data: s('settings.data'),
      sample: s('settings.sample'),
      live: s('settings.live'),
      about: s('settings.about'),
    },
  };
}

export type AppDict = ReturnType<typeof makeAppDict>;
