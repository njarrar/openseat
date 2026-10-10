// Copy for the How to use page. The website and the mobile app both read it.
// The words are in languages/<code>.xml under howPage.

import type { CabinId, CarrierId } from '@openseat/shared';
import { perLang, STRINGS } from '../i18n/languages';
import type { Lang } from '../i18n/types';

export interface Example {
  q: { carrier: CarrierId; cabin: CabinId; pax: number; from: string; to: string; ret: number };
  title: Record<Lang, string>;
  tips: Record<Lang, string[]>;
}

const QUERIES: Example['q'][] = [
  { carrier: 'EK', cabin: 'economy', pax: 4, from: 'DXB', to: 'LHR', ret: 14 },
  { carrier: 'EY', cabin: 'business', pax: 1, from: 'AUH', to: 'BKK', ret: 0 },
  { carrier: 'QR', cabin: 'first', pax: 2, from: 'DOH', to: 'NRT', ret: 0 },
  { carrier: 'EK', cabin: 'business', pax: 1, from: 'RUH', to: 'LHR', ret: 0 },
];

export const EXAMPLES: Example[] = QUERIES.map((q, i) => ({
  q,
  title: perLang((lang) => STRINGS[lang].text(`howPage.cases.${i}.title`)),
  tips: perLang((lang) => STRINGS[lang].texts(`howPage.cases.${i}.tips`)),
}));

export const HOW_COPY = perLang((lang) => {
  const s = STRINGS[lang];
  const pairs = (path: string, a: string, b: string) => s.list(path).map((_, i): [string, string] => [s.text(`${path}.${i}.${a}`), s.text(`${path}.${i}.${b}`)]);
  return {
    title: s.text('howPage.title'),
    lede: s.text('howPage.lede'),
    basics: s.text('howPage.basics'),
    moves: pairs('howPage.moves', 'title', 'text'),
    examples: s.text('howPage.examples'),
    tryIt: s.text('howPage.tryIt'),
    faqTitle: s.text('howPage.faqTitle'),
    faq: pairs('howPage.faq', 'q', 'a'),
    start: s.text('howPage.start'),
  };
});
