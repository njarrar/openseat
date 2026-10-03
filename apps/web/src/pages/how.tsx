import { ArrowRight, ArrowSquareOut, CalendarCheck, TextAa, Wallet } from '@phosphor-icons/react';
import { render } from 'preact';
import '../styles/base.css';
import '../styles/pages.css';
import { Footer, Header, Page } from '../components/Shell';
import { EXAMPLES, HOW_COPY as COPY, type Example } from '../content/how';
import { useLang } from '../i18n';
import type { ChipId } from '../i18n/types';
import { queryString } from '../lib/url';

const MOVE_ICONS = [Wallet, TextAa, CalendarCheck, ArrowSquareOut];

function ExampleSentence({ q }: { q: Example['q'] }) {
  const { t, f } = useLang();
  const value: Record<ChipId, string> = {
    program: f.program(q.carrier), cabin: f.cabin(q.cabin), pax: t.search.pax(q.pax), from: f.city(q.from), to: f.city(q.to), ret: t.search.ret(q.ret),
  };
  return (
    <p class="ex-sentence">
      {t.search.sentence().map((s, i) => {
        if (typeof s !== 'string') return [i > 0 ? ' ' : '', <span class="ex-chip" key={i}>{value[s.chip]}</span>];
        return /^[,.،]/.test(s) ? s : (i > 0 ? ' ' : '') + s;
      })}
    </p>
  );
}

function How() {
  const { lang } = useLang();
  const c = COPY[lang];
  return (
    <>
      <Header page="how" />
      <main class="wrap">
        <section class="page-intro">
          <h1>{c.title}</h1>
          <p>{c.lede}</p>
        </section>

        <section class="card basics" aria-labelledby="basics">
          <h2 id="basics">{c.basics}</h2>
          {c.moves.map(([title, text], i) => {
            const Icon = MOVE_ICONS[i];
            return (
              <div key={title}>
                <span class={'dot small' + (i === 3 ? ' solid' : '')} aria-hidden="true"><Icon size={19} /></span>
                <strong>{title}</strong>
                <span>{text}</span>
              </div>
            );
          })}
        </section>

        <section class="examples" aria-labelledby="examples">
          <h2 id="examples">{c.examples}</h2>
          {EXAMPLES.map((ex) => (
            <article class="card example" key={ex.title.en}>
              <div class="ex-main">
                <h3>{ex.title[lang]}</h3>
                <ExampleSentence q={ex.q} />
                <a class="btn dark small" href={'/' + queryString({ carrier: ex.q.carrier, from: ex.q.from, to: ex.q.to, cabin: ex.q.cabin, pax: ex.q.pax, ret: ex.q.ret })}>
                  {c.tryIt}
                  <ArrowRight size={16} class="flip" aria-hidden="true" />
                </a>
              </div>
              <ol class="steps">
                {ex.tips[lang].map((tip) => <li key={tip}>{tip}</li>)}
              </ol>
            </article>
          ))}
        </section>

        <section class="faq" aria-labelledby="faq">
          <h2 id="faq">{c.faqTitle}</h2>
          {c.faq.map(([qq, a]) => (
            <div key={qq}>
              <h3>{qq}</h3>
              <p>{a}</p>
            </div>
          ))}
        </section>

        <a class="btn page-cta" href="/">{c.start}<ArrowRight size={16} class="flip" aria-hidden="true" /></a>
        <Footer page="how" />
      </main>
    </>
  );
}

render(<Page title={(t) => t.meta.howTitle}><How /></Page>, document.getElementById('app')!);
