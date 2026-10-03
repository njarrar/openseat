import type { ComponentChildren } from 'preact';
import { Translate } from '@phosphor-icons/react';
import { LangContext, useLang, useLangState } from '../i18n';
import type { Dict } from '../i18n/en';

export type PageId = 'search' | 'how' | 'terms';

const HREF: Record<PageId, string> = { search: '/', how: '/how-to-use/', terms: '/terms/' };

function LangSwitch() {
  const { t, setLang } = useLang();
  return (
    <button type="button" class="lang" onClick={() => setLang(t.nav.switchLang)} aria-label={t.nav.switchLabel} lang={t.nav.switchLang}>
      <Translate size={17} aria-hidden="true" />
      <span lang={t.nav.switchLang}>{t.nav.switchTo}</span>
    </button>
  );
}

export function Header({ page }: { page: PageId }) {
  const { t } = useLang();
  const links: [PageId, string][] = page === 'search'
    ? [['how', t.nav.howToUse], ['terms', t.nav.terms]]
    : [['search', t.nav.search], ['how', t.nav.howToUse], ['terms', t.nav.terms]];
  return (
    <header class="header">
      <a class="brand" href="/" aria-label={t.nav.home}>
        <img src="/icons/openseat-icon.svg" alt="" width={32} height={32} />
        openseat
      </a>
      <nav class="nav" aria-label={t.nav.search}>
        {links.map(([id, label]) => (
          <a key={id} href={HREF[id]} class={[page === 'search' && id === 'how' ? 'pill' : '', id === 'terms' ? 'secondary' : ''].join(' ').trim() || undefined} aria-current={id === page ? 'page' : undefined}>
            {label}
          </a>
        ))}
        <LangSwitch />
      </nav>
    </header>
  );
}

export function Footer({ page, sample }: { page: PageId; sample?: boolean }) {
  const { t } = useLang();
  const links: [PageId, string][] = ([['search', t.nav.search], ['how', t.nav.howToUse], ['terms', t.nav.terms]] as [PageId, string][]).filter(([id]) => id !== page);
  return (
    <footer class="footer">
      <p>{t.footer.disclaimer}{sample ? ' ' + t.footer.sample : ''}</p>
      <p class="copy">{t.footer.copyright}</p>
      <nav aria-label={t.nav.search}>
        {links.map(([id, label]) => <a key={id} href={HREF[id]}>{label}</a>)}
      </nav>
    </footer>
  );
}

/** Language context for a whole page. */
export function Page({ title, children }: { title: (t: Dict) => string; children: ComponentChildren }) {
  const value = useLangState(title);
  if (typeof document !== 'undefined') document.title = title(value.t);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
