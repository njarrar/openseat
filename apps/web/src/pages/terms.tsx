import { ArrowRight } from '@phosphor-icons/react';
import { render } from 'preact';
import '../styles/base.css';
import '../styles/pages.css';
import { Footer, Header, Page } from '../components/Shell';
import { useLang } from '../i18n';

function Terms() {
  const { t, f } = useLang();
  const c = t.terms;
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
