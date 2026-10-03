// Copy that only the app needs. Everything shared with the website comes from
// apps/web/src/i18n, so the two never drift apart.

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export const appEn = {
  tabs: { search: 'Search', alerts: 'Alerts', settings: 'Settings' },

  search: {
    title: 'Search',
    androidTitle: 'Find reward seats',
    sub: 'Reward seats on Emirates, Etihad and Qatar Airways.',
    androidSub: 'Emirates, Etihad and Qatar Airways, the next 90 days.',
    program: 'Miles program',
    // Short airline names for the program switch.
    airlines: { EK: 'Emirates', EY: 'Etihad', QR: 'Qatar Airways' },
    route: 'Route',
    trip: 'Trip',
    from: 'From',
    to: 'To',
    swap: 'Swap airports',
    returnTrip: 'Return trip',
    backAfter: 'Back after',
    weeks: (w: number) => `${w} ${plural(w, 'week', 'weeks')}`,
    fewer: 'Fewer travellers',
    more: 'More travellers',
    note: 'A day shows seats only when one flight has enough for every traveller.',
    find: 'Find seats',
    findAndroid: 'Search',
    sentence: 'Your search',
  },

  cal: {
    route: (o: string, d: string) => `${o} → ${d}`,
    navSub: (cabin: string, pax: string, alert: boolean) => `${cabin} · ${pax}${alert ? ' · Alert on' : ''}`,
    back: 'Back',
    open: (date: string) => `Open ${date}`,
    noReply: 'Could not reach openseat. Check your connection and try again.',
  },

  day: {
    book: 'Book',
    share: 'Share link',
    choose: (nums: string, cabin: string) => `Choose ${nums} in ${cabin}.`,
    total: (pax: string) => `Total for ${pax}`,
    totalValue: (miles: string, unit: string, tax: string) => `${miles} ${unit} + ${tax}`,
    shareText: (o: string, d: string, cabin: string) => `Reward seats in ${cabin} from ${o} to ${d} on openseat`,
  },

  alerts: {
    title: 'Alerts',
    sub: 'Routes you are watching on this device. We message you when seats open.',
    empty: 'No alerts yet. Open a route and tap the bell to get a message when seats open.',
    turnOff: (route: string) => `Turn off the alert for ${route}`,
    undo: 'Undo',
    to: (address: string) => `To ${address}`,
    telegram: 'By Telegram',
  },

  settings: {
    title: 'Settings',
    language: 'Language',
    system: 'Match device',
    systemSub: (name: string) => `Now ${name}`,
    languageNote: 'The app follows your device language unless you pick one here.',
    currencyNote: 'Taxes in dollars, dirhams and riyals convert at the fixed official rate. Other currencies show as the airline charges them.',
    appearance: 'Appearance',
    appearanceNote: 'Light and dark mode follow your device.',
    help: 'Help',
    data: 'Data',
    sample: 'This build shows sample data, not live airline seats.',
    live: 'Seats come from the openseat service.',
    about: 'About',
  },
};

export type AppDict = typeof appEn;

/** Arabic counted nouns: 1, 2, 3 to 10, 11 and up. */
function count(n: number, one: string, two: string, few: string, many: string) {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${n} ${few}`;
  return `${n} ${many}`;
}

export const appAr: AppDict = {
  tabs: { search: 'البحث', alerts: 'التنبيهات', settings: 'الإعدادات' },

  search: {
    title: 'البحث',
    androidTitle: 'ابحث عن مقاعد المكافآت',
    sub: 'مقاعد المكافآت على طيران الإمارات والاتحاد للطيران والخطوط الجوية القطرية.',
    androidSub: 'الإمارات والاتحاد والقطرية، خلال الأيام الـ90 القادمة.',
    program: 'برنامج الأميال',
    airlines: { EK: 'الإمارات', EY: 'الاتحاد', QR: 'القطرية' },
    route: 'المسار',
    trip: 'الرحلة',
    from: 'من',
    to: 'إلى',
    swap: 'بدّل المطارين',
    returnTrip: 'رحلة عودة',
    backAfter: 'العودة بعد',
    weeks: (w: number) => count(w, 'أسبوع', 'أسبوعين', 'أسابيع', 'أسبوعًا'),
    fewer: 'مسافرون أقل',
    more: 'مسافرون أكثر',
    note: 'لا يظهر اليوم متاحًا إلا إذا كانت على رحلة واحدة مقاعد تكفي كل المسافرين.',
    find: 'اعرض المقاعد',
    findAndroid: 'ابحث',
    sentence: 'بحثك',
  },

  cal: {
    // Airport codes read left to right in both languages, as on the website.
    route: (o: string, d: string) => `${o} → ${d}`,
    navSub: (cabin: string, pax: string, alert: boolean) => `${cabin} · ${pax}${alert ? ' · التنبيه مفعّل' : ''}`,
    back: 'رجوع',
    open: (date: string) => `افتح ${date}`,
    noReply: 'تعذّر الوصول إلى openseat. تحقّق من اتصالك وحاول مرة أخرى.',
  },

  day: {
    book: 'احجز',
    share: 'شارك الرابط',
    choose: (nums: string, cabin: string) => `اختر ${nums} في ${cabin}.`,
    total: (pax: string) => `المجموع لـ${pax}`,
    totalValue: (miles: string, unit: string, tax: string) => `${miles} ${unit} + ${tax}`,
    shareText: (o: string, d: string, cabin: string) => `مقاعد مكافآت في ${cabin} من ${o} إلى ${d} على openseat`,
  },

  alerts: {
    title: 'التنبيهات',
    sub: 'المسارات التي تراقبها على هذا الجهاز. نراسلك عند توفر المقاعد.',
    empty: 'لا توجد تنبيهات بعد. افتح مسارًا واضغط الجرس لتصلك رسالة عند توفر المقاعد.',
    turnOff: (route: string) => `أوقف التنبيه لمسار ${route}`,
    undo: 'تراجع',
    to: (address: string) => `إلى ${address}`,
    telegram: 'عبر تيليجرام',
  },

  settings: {
    title: 'الإعدادات',
    language: 'اللغة',
    system: 'لغة الجهاز',
    systemSub: (name: string) => `حاليًا ${name}`,
    languageNote: 'يتبع التطبيق لغة جهازك ما لم تختر لغة هنا.',
    currencyNote: 'تُحوَّل الضرائب بالدولار والدرهم والريال بالسعر الرسمي الثابت. تظهر العملات الأخرى كما تفرضها شركة الطيران.',
    appearance: 'المظهر',
    appearanceNote: 'الوضع الفاتح والداكن يتبعان إعداد جهازك.',
    help: 'المساعدة',
    data: 'البيانات',
    sample: 'تعرض هذه النسخة بيانات تجريبية، لا مقاعد حقيقية من شركات الطيران.',
    live: 'تأتي المقاعد من خدمة openseat.',
    about: 'حول التطبيق',
  },
};
