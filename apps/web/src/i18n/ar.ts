import type { Dict } from './en';
import type { Seg } from './types';

/** Arabic counted nouns: 1, 2, 3 to 10, 11 and up. */
function count(n: number, one: string, two: string, few: string, many: string) {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${n} ${few}`;
  return `${n} ${many}`;
}

const weeks = (w: number) => count(w, 'أسبوع', 'أسبوعين', 'أسابيع', 'أسبوعًا');
const seats = (n: number) => count(n, 'مقعد واحد', 'مقعدان', 'مقاعد', 'مقعدًا');
const days = (n: number) => count(n, 'يوم واحد', 'يومين', 'أيام', 'يومًا');
const nights = (n: number) => count(n, 'ليلة واحدة', 'ليلتان', 'ليالٍ', 'ليلة');
const flights = (n: number) => count(n, 'رحلة واحدة', 'رحلتين', 'رحلات', 'رحلة');

export const ar: Dict = {
  dir: 'rtl',
  locale: 'ar-u-nu-latn-ca-gregory',
  numberLocale: 'ar-u-nu-latn',

  meta: {
    searchTitle: 'openseat: مقاعد المكافآت على الإمارات والاتحاد والقطرية',
    howTitle: 'طريقة استخدام openseat',
    termsTitle: 'شروط الاستخدام، openseat',
  },

  nav: {
    home: 'الصفحة الرئيسية لـ openseat',
    search: 'البحث',
    howToUse: 'طريقة الاستخدام',
    terms: 'الشروط',
    switchTo: 'English',
    switchLang: 'en',
    switchLabel: 'Read this page in English',
    currency: 'عملة الضرائب',
    currencies: { USD: 'دولار', AED: 'درهم', SAR: 'ريال سعودي', QAR: 'ريال قطري' },
  },

  footer: {
    disclaimer: 'Openseat خدمة مستقلة، ولا ترتبط بطيران الإمارات أو الاتحاد للطيران أو الخطوط الجوية القطرية ولا تحظى بتأييدها. أسماء البرامج علامات تجارية لأصحابها.',
    sample: 'الأسعار وأعداد المقاعد المعروضة بيانات تجريبية.',
    copyright: '© 2026 Openseat · v1.0.0',
  },

  search: {
    eyebrow: 'ابحث عن مقاعد المكافآت على طيران الإمارات والاتحاد للطيران والخطوط الجوية القطرية',
    sentence: (): Seg[] => ['باستخدام', { chip: 'program' }, '، اعرض لي مقاعد', { chip: 'cabin' }, 'لـ', { chip: 'pax' }, 'من', { chip: 'from' }, 'إلى', { chip: 'to' }, '،', { chip: 'ret' }, '.'],
    pax: (n: number) => count(n, 'مسافر واحد', 'مسافرَين', 'مسافرين', 'مسافرًا'),
    ret: (d: number) => (d === 0 ? 'ذهاب فقط' : `والعودة بعد ${weeks(d / 7)}`),
    sameAirport: 'اختر مطارين مختلفين لعرض المقاعد.',
    chipLabel: (what: string, value: string) => `${what}: ${value}`,
  },

  picker: {
    program: 'برنامج الأميال',
    programSub: (unit: string, hub: string) => `الأسعار بـ${unit}. المحور: ${hub}`,
    cabin: 'الدرجة',
    premiumSub: 'على طيران الإمارات فقط، في بعض رحلات A380 وA350',
    pax: 'المسافرون',
    paxSub: (n: number) => (n > 1 ? `لا تظهر المقاعد إلا إذا توفر ${seats(n)} على رحلة واحدة` : ''),
    ret: 'العودة',
    retOption: (d: number) => (d === 0 ? 'ذهاب فقط' : `العودة بعد ${weeks(d / 7)}`),
    retSub: (d: number) => (d === 0 ? 'رحلة الذهاب فقط' : `نميّز أيام العودة بعد ${d - 3} إلى ${d + 3} ليلة من سفرك`),
    from: 'السفر من',
    to: 'السفر إلى',
    airportLabel: 'المدينة أو رمز المطار أو الاسم بالعربية',
    airportPlaceholder: 'مثلًا: لندن أو LHR',
    popular: 'مسارات شائعة',
    all: 'كل المطارات',
    routeAria: (a: string, b: string) => `من ${a} إلى ${b}`,
    empty: 'لا توجد مطارات مطابقة. جرّب اسم مدينة أو رمزًا من 3 أحرف.',
    close: 'إغلاق',
  },

  cal: {
    outbound: 'الذهاب',
    return: 'العودة',
    tablist: 'جزء الرحلة',
    title: (cabin: string, leg) => (leg === 'ret' ? `مقاعد العودة في ${cabin}` : leg === 'out' ? `مقاعد الذهاب في ${cabin}` : `المقاعد في ${cabin}`),
    subFrom: (cabin: string, miles: string, unit: string, open: number, total: number) => `${cabin} تبدأ من ${miles} ${unit} للاتجاه الواحد. تتوفر مقاعد في ${open} من الأيام الـ${total} القادمة.`,
    subNone: (cabin: string) => `لا توجد مقاعد في ${cabin} خلال الأيام الـ90 القادمة. فعّل التنبيه لنخبرك عند توفرها.`,
    subNotOffered: (program: string, cabin: string) => `لا يقدم ${program} ${cabin} على هذا المسار. جرّب درجة أخرى.`,
    subLoading: 'نتحقق من الأيام الـ90 القادمة.',
    legend: ['لا مقاعد', 'مقعد واحد', '2 إلى 3', '4 أو أكثر'],
    fits: (w: number) => `يناسب رحلة مدتها ${weeks(w)}`,
    weekdays: ['إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت', 'أحد'],
    keys: 'استخدم مفاتيح الأسهم للتنقل بين الأيام.',
    aria: (o: string, d: string, cabin: string) => `التقويم، من ${o} إلى ${d}، ${cabin}`,
    seats: (n: number) => (n >= 4 ? '4 مقاعد أو أكثر' : seats(n)),
    dayAria: (date: string, s: string, miles: string, unit: string, fits: boolean) => `${date}، ${s} بدءًا من ${miles} ${unit}${fits ? '، يناسب رحلتك' : ''}`,
    dayNone: (date: string, cabin: string) => `${date}، لا مقاعد في ${cabin}`,
    dayPending: (date: string) => `${date}، جارٍ التحقق`,
    dayFailed: (date: string) => `${date}، تعذر التحقق`,
    checking: (n: number) => `نتحقق من ${days(n)} أخرى لدى شركة الطيران`,
    stop: 'إيقاف',
    stopped: 'توقف البحث. تركنا الأيام التي لم نتحقق منها فارغة.',
    failed: 'تعذر التحقق من بعض الأيام. نعرض آخر نتائج محفوظة حيثما توفرت.',
    retry: 'حاول مجددًا',
  },

  day: {
    prev: 'اليوم السابق',
    next: 'اليوم التالي',
    close: 'إغلاق',
    sub: (n: number, total: number, o: string, d: string, cabin: string) =>
      `${n} من ${flights(total)} من ${o} إلى ${d} فيها مقاعد في ${cabin}. الأسعار للمسافر الواحد وللاتجاه الواحد.`,
    noFlights: (o: string, d: string) => `لا رحلات من ${o} إلى ${d} في هذا اليوم.`,
    trip: (out: string, ret: string, n: number) => `الذهاب ${out}، والعودة ${ret}، ${nights(n)}.`,
    alertOff: 'نبّهني عند توفر مقاعد',
    alertOn: 'التنبيه مفعّل',
    copy: 'نسخ الرابط',
    copied: 'تم النسخ',
    updated: (rel: string) => `آخر تحديث ${rel}`,
    refresh: 'تحقق مجددًا',
    refreshing: 'جارٍ التحقق',
    refreshWait: 'تحققنا من هذا المسار قبل دقائق. حاول بعد قليل.',
    refreshFailed: 'تعذر بدء تحقق جديد. حاول بعد قليل.',
  },

  flight: {
    nonstop: 'رحلة مباشرة',
    stop: (city: string, wait: string) => `توقف واحد في ${city} (${wait} للتحويل)`,
    taxes: (tax: string, n: number) => `+ ${tax} ضرائب، ${n >= 9 ? '9+ مقاعد' : seats(n)} متاحة`,
    notOffered: (cabin: string) => `${cabin} غير متوفرة`,
    noSeats: (cabin: string) => `لا مقاعد في ${cabin}`,
    alsoOpen: 'متاح أيضًا',
    howToBook: 'طريقة الحجز',
    saver: 'سعر التوفير',
    flex: 'سعر مرن',
    flexTitle: 'ليس أقل سعر بالأميال. قد تكلف مقاعد التوفير في يوم آخر أميالًا أقل.',
    separate: 'تذكرتان منفصلتان',
    separateNote: 'هذه مكافأتان منفصلتان. إذا تأخرت الرحلة الأولى فلا تلتزم شركة الطيران بإعادة حجزك. اترك 3 ساعات على الأقل للتحويل.',
    step1: (program: string, site: string) => `سجّل الدخول إلى ${program} على ${site}.`,
    step2: (o: string, d: string, date: string, term: string) => `ابحث من ${o} إلى ${d} يوم ${date} مع تفعيل خيار ${term}.`,
    step3: (nums: string, cabin: string, pax: string, miles: string, unit: string, tax: string) => `اختر ${nums} في ${cabin}. المجموع لـ${pax}: ${miles} ${unit} و${tax}.`,
    step3None: (cabin: string, pax: string) => `لا توجد مقاعد مكافآت في ${cabin} لـ${pax} على هذه الرحلة اليوم. اختر يومًا أخضر من التقويم.`,
    and: ' و',
    open: (site: string) => `افتح ${site}`,
  },

  alert: {
    title: 'استلم تنبيهًا عند توفر المقاعد',
    body: (cabin: string, o: string, d: string, program: string, pax: string) => `سنراقب مقاعد ${cabin} من ${o} إلى ${d} على ${program}، لـ${pax}.`,
    email: 'البريد الإلكتروني',
    help: 'رسالتان كحد أقصى في اليوم. في كل رسالة رابط لإيقاف التنبيه.',
    invalid: 'أدخل بريدًا إلكترونيًا صحيحًا.',
    submit: 'فعّل التنبيه',
    cancel: 'إلغاء',
    on: (cabin: string, o: string, d: string) => `سنراسلك عند توفر مقاعد ${cabin} من ${o} إلى ${d}.`,
    off: 'أُوقف التنبيه.',
    failed: 'تعذر حفظ التنبيه. حاول مجددًا.',
    channel: 'أرسل التنبيه عبر',
    channels: { email: 'البريد', telegram: 'تيليجرام', whatsapp: 'واتساب' },
    phone: 'رقم واتساب',
    phoneHelp: 'مع رمز الدولة، مثل ‎+971 50 123 4567. رسالتان كحد أقصى في اليوم، وفي كل رسالة رابط لإيقاف التنبيه.',
    phoneInvalid: 'أدخل رقمك مع رمز الدولة، يبدأ بعلامة +.',
    telegramHelp: 'بعد ذلك افتح بوت تيليجرام واضغط ابدأ. رسالتان كحد أقصى في اليوم. أرسل ‎/stop للبوت لإيقاف التنبيهات.',
    telegramNext: 'خطوة أخيرة: افتح تيليجرام واضغط ابدأ لتفعيل التنبيه.',
    telegramOpen: 'افتح تيليجرام',
    onMessage: (cabin: string, o: string, d: string) => `سنراسلك عند توفر مقاعد ${cabin} من ${o} إلى ${d}.`,
    robot: 'أكّد أنك لست روبوتًا ثم حاول مجددًا.',
  },

  how: {
    title: 'كيف يعمل',
    intro: 'يعرض Openseat الأيام التي تتوفر فيها مقاعد المكافآت. أما الحجز فيبقى مباشرة مع شركة الطيران وبأميالك أنت.',
    examples: 'شاهد أمثلة عملية',
    steps: [
      { title: 'كوّن بحثك', text: 'كل جزء أخضر في الجملة قائمة اختيار. ابدأ ببرنامج الأميال، ثم حدد الدرجة وعدد المسافرين والمطارات، وهل تحتاج رحلة عودة.' },
      { title: 'تصفّح الأيام الـ90 القادمة', text: 'الرقم في كل يوم هو عدد المقاعد المتاحة على أفضل رحلة في ذلك اليوم. كلما كان الأخضر أغمق زادت المقاعد.' },
      { title: 'افتح يومًا', text: 'شاهد كل الرحلات المباشرة وذات التوقف الواحد، والسعر للمسافر مع الضرائب، والدرجات الأخرى المتاحة على الرحلة نفسها. لرحلة العودة انتقل إلى تبويب العودة.' },
      { title: 'احجز مع شركة الطيران', text: 'اتبع خطوات «طريقة الحجز» وأكمل الحجز على موقع شركة الطيران. وإن لم تتوفر مقاعد بعد، فعّل التنبيه وسنراسلك.' },
    ],
    reading: 'قراءة التقويم',
    key: [
      'لا مقاعد مكافآت في درجتك تكفي كل المسافرين في بحثك.',
      'مقعد واحد متاح على رحلة واحدة على الأقل.',
      'مقعدان أو ثلاثة متاحة على رحلة واحدة.',
      'أربعة مقاعد أو أكثر. اليوم المحاط بإطار هو المعروض في قائمة الرحلات.',
      'في تبويب العودة، يميّز خط قصير الأيام التي تناسب مدة رحلتك.',
    ],
    notesTitle: 'ملاحظات الحجز حسب البرنامج',
    notes: {
      EK: ['ابحث مع اختيار Classic Rewards، وإلا فسترى الأسعار النقدية فقط.', 'السياحية الممتازة متوفرة فقط في بعض رحلات A380 وA350.', 'تشمل الضرائب رسوم الناقل، لذلك تكون عادة أعلى من الاتحاد أو القطرية.'],
      EY: ['اختر «الحجز بالأميال» على etihad.com قبل البحث.', 'الدرجة الأولى متوفرة على A380 فقط. معظم المسارات فيها السياحية والأعمال.', 'الحجز بالأميال للاتجاه الواحد، فيمكنك المزج بين الدرجات أو التواريخ في رحلة العودة.'],
      QR: ['الأسعار بنقاط أفيوس. يمكنك نقل أفيوس من وإلى برنامج الخطوط البريطانية Executive Club.', 'الدرجة الأولى على A380 فقط. درجة الأعمال Qsuite متوفرة في معظم الرحلات الطويلة.', 'ابحث مع تفعيل «الحجز بنقاط أفيوس» لترى مقاعد المكافآت.'],
    },
    goodTitle: 'معلومات مفيدة',
    good: [
      'نتحقق من المسارات المزدحمة كل بضع ساعات، ومن غيرها عند البحث. يظهر لكل يوم وقت آخر تحقق.',
      'الأسعار للاتجاه الواحد وللمسافر الواحد. تعرض خطوات الحجز المجموع لمجموعتك.',
      'لا يظهر اليوم متاحًا إلا إذا كانت على رحلة واحدة مقاعد تكفي الجميع.',
      'الرحلات ذات التوقف الواحد تمر بمحور شركة الطيران: دبي أو أبوظبي أو الدوحة.',
      'الضرائب والرسوم تقديرية بالدولار الأمريكي. تعرض شركة الطيران المبلغ النهائي عند الدفع.',
      'لا نشمل بعد مكافآت شركات الطيران الشريكة. ترى فقط الرحلات التي تشغلها الشركات الثلاث.',
    ],
    back: 'العودة إلى البحث',
  },
};
