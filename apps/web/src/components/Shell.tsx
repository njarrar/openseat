import type { ComponentChildren } from 'preact';
import { CURRENCIES, isCurrency } from '@openseat/shared';
import { CaretDown, Translate } from '@phosphor-icons/react';
import { LANGS, LangContext, isLang, useLang, useLangState, type Dict } from '../i18n';

export type PageId = 'search' | 'how' | 'terms';

const HREF: Record<PageId, string> = { search: '/', how: '/how-to-use/', terms: '/terms/' };

/** Every language in lang/*.xml, each named in its own script so people can find theirs. */
function LangSwitch() {
  const { t, lang, setLang } = useLang();
  return (
    <span class="lang">
      <Translate size={17} aria-hidden="true" />
      <select value={lang} aria-label={t.nav.language} title={t.nav.language} onChange={(e) => isLang(e.currentTarget.value) && setLang(e.currentTarget.value)}>
        {LANGS.map((l) => <option key={l.code} value={l.code} lang={l.code} dir={l.dir}>{l.name}</option>)}
      </select>
      <CaretDown size={13} aria-hidden="true" />
    </span>
  );
}

/** Taxes are shown in this currency. Gulf currencies are pegged to the dollar, so the figures are exact. */
function CurrencySwitch() {
  const { t, currency, setCurrency } = useLang();
  return (
    <span class="currency">
      <select value={currency} aria-label={t.nav.currency} title={t.nav.currency} onChange={(e) => isCurrency(e.currentTarget.value) && setCurrency(e.currentTarget.value)}>
        {CURRENCIES.map((c) => <option key={c} value={c}>{t.nav.currencies[c]}</option>)}
      </select>
      <CaretDown size={13} aria-hidden="true" />
    </span>
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
        <CurrencySwitch />
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
