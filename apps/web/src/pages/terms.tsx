import { ArrowRight } from '@phosphor-icons/react';
import { render } from 'preact';
import '../styles/base.css';
import '../styles/pages.css';
import { Footer, Header, Page } from '../components/Shell';
import { useLang } from '../i18n';

// Placeholder legal text from the design. Have counsel review both languages before launch.
const TERMS = {
  en: {
    title: 'Terms of use',
    updated: 'Last updated 2 October 2026',
    sectionsLabel: 'Sections',
    intro: 'By using Openseat you agree to these terms. They are written to be read, so each section is short.',
    sections: [
      ['What Openseat is', [
        'Openseat is an independent information tool that shows reward seat availability on Emirates, Etihad Airways and Qatar Airways. We do not sell tickets, hold seats, or handle your miles or payments. All bookings are made directly with the airline.',
        'Openseat is not affiliated with, connected to or endorsed by any of these airlines or their loyalty programs.',
      ]],
      ['Accuracy', [
        'Reward availability changes all the time. A seat shown here may be gone by the time you search on the airline site. Miles prices are published one-way rates and taxes are estimates. We do not guarantee that results are accurate, complete or current.',
        'Always confirm seats, miles and fees on the airline site before you book or move miles between programs.',
      ]],
      ['Fair use', [
        'Openseat is for personal use. Do not scrape it, query it automatically, resell its data or try to get around usage limits. We limit the number of searches per hour and may block access that harms the service for others.',
      ]],
      ['Alerts and email', [
        'If you turn on an alert, we use your email address only to tell you about seats on the routes you chose. We send at most two emails a day, and every email has a link to turn the alert off. We do not sell or share your address.',
        'An alert is a best effort. It may arrive after the seats have gone, and we are not responsible for a missed alert.',
      ]],
      ['Trademarks', [
        'Emirates, Etihad Airways, Qatar Airways and their program names, including Emirates Skywards, Etihad Guest and Privilege Club, are trademarks of their owners and are used here only to describe the flights shown. The Openseat name and design belong to Openseat.',
      ]],
      ['Liability', [
        'Openseat is provided as is, without warranties of any kind. To the extent the law allows, we are not liable for any loss that comes from relying on it. This includes miles you transfer or spend, fees you pay, and trips you miss or change.',
      ]],
      ['Changes', [
        'We may update these terms or stop the service at any time. When we change the terms, we update the date at the top of this page. If you keep using Openseat after a change, you accept the new version.',
      ]],
    ] as [string, string[]][],
    start: 'Start a search',
  },
  ar: {
    title: 'شروط الاستخدام',
    updated: 'آخر تحديث 2 أكتوبر 2026',
    sectionsLabel: 'الأقسام',
    intro: 'باستخدامك Openseat فإنك توافق على هذه الشروط. كُتبت لتُقرأ، لذلك جاء كل قسم قصيرًا.',
    sections: [
      ['ما هو Openseat', [
        'Openseat أداة معلومات مستقلة تعرض توفر مقاعد المكافآت على طيران الإمارات والاتحاد للطيران والخطوط الجوية القطرية. لا نبيع التذاكر ولا نحجز المقاعد ولا نتعامل مع أميالك أو مدفوعاتك. تتم كل الحجوزات مباشرة مع شركة الطيران.',
        'لا يرتبط Openseat بأي من شركات الطيران هذه أو برامج ولائها، ولا يتصل بها ولا يحظى بتأييدها.',
      ]],
      ['الدقة', [
        'يتغير توفر المكافآت باستمرار. قد يختفي مقعد معروض هنا قبل أن تبحث عنه على موقع شركة الطيران. أسعار الأميال هي الأسعار المنشورة للاتجاه الواحد، والضرائب تقديرية. لا نضمن أن تكون النتائج دقيقة أو كاملة أو محدّثة.',
        'تحقق دائمًا من المقاعد والأميال والرسوم على موقع شركة الطيران قبل الحجز أو نقل الأميال بين البرامج.',
      ]],
      ['الاستخدام العادل', [
        'Openseat للاستخدام الشخصي. لا تستخرج بياناته آليًا ولا تستعلم عنه بشكل آلي ولا تُعِد بيع بياناته ولا تحاول تجاوز حدود الاستخدام. نحدد عدد عمليات البحث في الساعة، وقد نمنع أي استخدام يضر بالخدمة للآخرين.',
      ]],
      ['التنبيهات والبريد الإلكتروني', [
        'إذا فعّلت تنبيهًا، نستخدم بريدك الإلكتروني فقط لإخبارك بالمقاعد على المسارات التي اخترتها. نرسل رسالتين كحد أقصى في اليوم، وفي كل رسالة رابط لإيقاف التنبيه. لا نبيع عنوانك ولا نشاركه.',
        'التنبيه جهد نبذله دون ضمان. قد يصل بعد نفاد المقاعد، ولسنا مسؤولين عن تنبيه فائت.',
      ]],
      ['العلامات التجارية', [
        'طيران الإمارات والاتحاد للطيران والخطوط الجوية القطرية وأسماء برامجها، ومنها سكاي واردز وضيف الاتحاد ونادي الامتياز، علامات تجارية لأصحابها، ونستخدمها هنا فقط لوصف الرحلات المعروضة. اسم Openseat وتصميمه ملك لـ Openseat.',
      ]],
      ['المسؤولية', [
        'يُقدَّم Openseat كما هو، دون أي ضمانات. وبالقدر الذي يسمح به القانون، لسنا مسؤولين عن أي خسارة تنتج عن الاعتماد عليه، بما في ذلك الأميال التي تنقلها أو تنفقها، والرسوم التي تدفعها، والرحلات التي تفوتك أو تغيّرها.',
      ]],
      ['التغييرات', [
        'قد نحدّث هذه الشروط أو نوقف الخدمة في أي وقت. عند تغيير الشروط نحدّث التاريخ أعلى هذه الصفحة. واستمرارك في استخدام Openseat بعد التغيير يعني قبولك للنسخة الجديدة.',
      ]],
    ] as [string, string[]][],
    start: 'ابدأ البحث',
  },
};

function Terms() {
  const { lang, f } = useLang();
  const c = TERMS[lang];
  return (
    <>
      <Header page="terms" />
      <main class="wrap terms">
        <div class="terms-side">
          <h1>{c.title}</h1>
          <p class="muted">{c.updated}</p>
          <nav aria-label={c.sectionsLabel}>
            {c.sections.map(([title], i) => <a key={title} href={`#t${i + 1}`}>{f.num(i + 1)}. {title}</a>)}
          </nav>
        </div>
        <article class="terms-body">
          <p class="lede">{c.intro}</p>
          {c.sections.map(([title, paras], i) => (
            <section id={`t${i + 1}`} key={title}>
              <h2>{f.num(i + 1)}. {title}</h2>
              {paras.map((p) => <p key={p}>{p}</p>)}
            </section>
          ))}
          <a class="btn" href="/">{c.start}<ArrowRight size={16} class="flip" aria-hidden="true" /></a>
        </article>
        <div class="terms-foot"><Footer page="terms" /></div>
      </main>
    </>
  );
}

render(<Page title={(t) => t.meta.termsTitle}><Terms /></Page>, document.getElementById('app')!);
