// Copy for the How to use page. The website and the mobile app both read it.

import type { CabinId, CarrierId } from '@openseat/shared';
import type { Lang } from '../i18n/types';

export interface Example {
  q: { carrier: CarrierId; cabin: CabinId; pax: number; from: string; to: string; ret: number };
  title: Record<Lang, string>;
  tips: Record<Lang, string[]>;
}

export const EXAMPLES: Example[] = [
  {
    q: { carrier: 'EK', cabin: 'economy', pax: 4, from: 'DXB', to: 'LHR', ret: 14 },
    title: { en: 'A family of four to London for the winter break', ar: 'عائلة من أربعة أفراد إلى لندن في عطلة الشتاء' },
    tips: {
      en: [
        'With 4 travellers, a day only shows seats when one flight has 4 open. Look for days marked 4+ in dark green.',
        'Pick an outbound day, then switch to the Return tab. Days with a short bar fit a trip of 11 to 17 nights.',
        'Book both legs in one session on emirates.com, so the seats you found are still there for the second leg.',
      ],
      ar: [
        'مع 4 مسافرين، لا يظهر اليوم متاحًا إلا إذا توفرت 4 مقاعد على رحلة واحدة. ابحث عن الأيام المعلّمة بـ4+ باللون الأخضر الداكن.',
        'اختر يوم الذهاب، ثم انتقل إلى تبويب العودة. الأيام التي تحتها خط قصير تناسب رحلة من 11 إلى 17 ليلة.',
        'احجز الاتجاهين في جلسة واحدة على emirates.com، حتى تبقى المقاعد التي وجدتها متاحة للرحلة الثانية.',
      ],
    },
  },
  {
    q: { carrier: 'EY', cabin: 'business', pax: 1, from: 'AUH', to: 'BKK', ret: 0 },
    title: { en: 'A last-minute Business seat to Bangkok', ar: 'مقعد أعمال في اللحظة الأخيرة إلى بانكوك' },
    tips: {
      en: [
        'Airlines often release unsold seats in the last two weeks, so check the first rows of the calendar.',
        'Use the arrows next to the date to step through days without going back to the calendar.',
        'If Business is full but Also open shows Economy, tap it to see that price on the same flight.',
      ],
      ar: [
        'كثيرًا ما تطرح شركات الطيران المقاعد غير المباعة في آخر أسبوعين، فراجع الصفوف الأولى من التقويم.',
        'استخدم السهمين بجانب التاريخ للتنقل بين الأيام دون العودة إلى التقويم.',
        'إذا امتلأت درجة الأعمال وظهرت السياحية تحت «متاح أيضًا»، فاضغط عليها لترى سعرها على الرحلة نفسها.',
      ],
    },
  },
  {
    q: { carrier: 'QR', cabin: 'first', pax: 2, from: 'DOH', to: 'NRT', ret: 0 },
    title: { en: 'Two First seats to Tokyo with Avios', ar: 'مقعدان في الدرجة الأولى إلى طوكيو بنقاط أفيوس' },
    tips: {
      en: [
        'Qatar sells First only on its A380, so many routes show not offered. That is a fact about the plane, not a lack of seats.',
        'Two seats together in First are rare. If the calendar is empty, tap Alert me when seats open.',
        'Short on Avios? You can move Avios from British Airways Executive Club before you book.',
      ],
      ar: [
        'تبيع القطرية الدرجة الأولى على طائرات A380 فقط، لذلك تظهر «غير متوفرة» في مسارات كثيرة. هذا يتعلق بالطائرة لا بنفاد المقاعد.',
        'توفر مقعدين معًا في الدرجة الأولى أمر نادر. إذا كان التقويم فارغًا فاضغط «نبّهني عند توفر مقاعد».',
        'نقاط أفيوس لا تكفي؟ يمكنك نقلها من برنامج الخطوط البريطانية Executive Club قبل الحجز.',
      ],
    },
  },
  {
    q: { carrier: 'EK', cabin: 'business', pax: 1, from: 'RUH', to: 'LHR', ret: 0 },
    title: { en: 'Starting from a city that is not a hub', ar: 'السفر من مدينة ليست محورًا' },
    tips: {
      en: [
        'Flights from Riyadh connect in Dubai. A day shows seats only when both flights have one open.',
        'Each flight card shows the stop and the time on the ground, so you can skip long connections.',
        'Compare with a search from Dubai. If you can reach the hub yourself, there are often more days to choose from.',
      ],
      ar: [
        'الرحلات من الرياض تمر بدبي. لا يظهر اليوم متاحًا إلا إذا توفر مقعد على الرحلتين.',
        'تعرض بطاقة كل رحلة مكان التوقف ومدة الانتظار، فتتجنب التحويلات الطويلة.',
        'قارن ببحث يبدأ من دبي. إذا استطعت الوصول إلى المحور بنفسك، فغالبًا ستجد أيامًا أكثر.',
      ],
    },
  },
];

export const HOW_COPY = {
  en: {
    title: 'How to use Openseat',
    lede: 'Find a day with reward seats, then book it on the airline site with your own miles. Below are four real ways people search, step by step.',
    basics: 'The basics in four moves',
    moves: [
      ['Start with your miles', 'Pick the program you hold miles in. Skywards, Etihad Guest or Privilege Club.'],
      ['Finish the sentence', 'Set cabin, travellers, airports and an optional return. Search by city, code or Arabic name.'],
      ['Read the numbers', 'Each day shows how many seats are open on its best flight: 1, 2, 3 or 4+. Empty days have none.'],
      ['Book with the airline', 'Open the day, follow How to book, and finish on the airline site before the seat goes.'],
    ],
    examples: 'Examples',
    tryIt: 'Try this search',
    faqTitle: 'Common questions',
    faq: [
      ['Why did a seat disappear when I tried to book?', 'Busy routes are checked every few hours, other routes when you search. Seats can be taken in between, so the airline site always has the final word. Each day shows when it was last checked, and Check again asks for a fresh look.'],
      ["Why can't I pick dates further out?", 'The window is always the next 90 days. That keeps searches fast, and a shared link shows everyone the same dates.'],
      ['Are the prices exact?', 'Miles are the published reward price for one way, per traveller. Taxes are an estimate in US dollars and can change at checkout. A Flex price badge means the seat is not at the lowest reward price.'],
      ['How do I share a search?', 'Tap Copy link next to the date. The link keeps your program, cabin, travellers, airports and return, so others see what you see.'],
    ],
    start: 'Start a search',
  },
  ar: {
    title: 'طريقة استخدام Openseat',
    lede: 'اعثر على يوم فيه مقاعد مكافآت، ثم احجزه على موقع شركة الطيران بأميالك. فيما يلي أربع طرق حقيقية يبحث بها الناس، خطوة بخطوة.',
    basics: 'الأساسيات في أربع خطوات',
    moves: [
      ['ابدأ بأميالك', 'اختر البرنامج الذي تملك فيه أميالًا: سكاي واردز أو ضيف الاتحاد أو نادي الامتياز.'],
      ['أكمل الجملة', 'حدد الدرجة والمسافرين والمطارات ورحلة العودة إن أردت. ابحث باسم المدينة أو الرمز أو الاسم العربي.'],
      ['اقرأ الأرقام', 'يعرض كل يوم عدد المقاعد المتاحة على أفضل رحلة فيه: 1 أو 2 أو 3 أو 4+. الأيام الفارغة لا مقاعد فيها.'],
      ['احجز مع شركة الطيران', 'افتح اليوم واتبع «طريقة الحجز»، وأكمل على موقع شركة الطيران قبل أن يُحجز المقعد.'],
    ],
    examples: 'أمثلة',
    tryIt: 'جرّب هذا البحث',
    faqTitle: 'أسئلة شائعة',
    faq: [
      ['لماذا اختفى المقعد عندما حاولت الحجز؟', 'نتحقق من المسارات المزدحمة كل بضع ساعات، ومن غيرها عند البحث. قد تُحجز المقاعد بين تحقق وآخر، لذلك تبقى الكلمة الأخيرة لموقع شركة الطيران. يظهر لكل يوم وقت آخر تحقق، ويطلب زر «تحقق مجددًا» نظرة جديدة.'],
      ['لماذا لا أستطيع اختيار تواريخ أبعد؟', 'النافذة دائمًا الأيام الـ90 القادمة. هذا يبقي البحث سريعًا، ويعرض الرابط المشترك التواريخ نفسها للجميع.'],
      ['هل الأسعار دقيقة؟', 'الأميال هي سعر المكافأة المنشور للاتجاه الواحد وللمسافر الواحد. الضرائب تقديرية بالدولار الأمريكي وقد تتغير عند الدفع. وشارة «سعر مرن» تعني أن المقعد ليس بأقل سعر مكافأة.'],
      ['كيف أشارك بحثًا؟', 'اضغط «نسخ الرابط» بجانب التاريخ. يحفظ الرابط البرنامج والدرجة والمسافرين والمطارات والعودة، فيرى غيرك ما تراه.'],
    ],
    start: 'ابدأ البحث',
  },
};
