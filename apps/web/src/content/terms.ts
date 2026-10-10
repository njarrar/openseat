// Copy for the Terms page. The website and the mobile app both read it.
// The words are in languages/<code>.xml under terms.
// Placeholder legal text from the design. Have counsel review both languages before launch.

import { perLang, STRINGS } from '../i18n/languages';

export const TERMS = perLang((lang) => {
  const s = STRINGS[lang];
  return {
    title: s.text('terms.title'),
    updated: s.text('terms.updated'),
    sectionsLabel: s.text('terms.sectionsLabel'),
    intro: s.text('terms.intro'),
    sections: s.list('terms.sections').map((_, i): [string, string[]] => [s.text(`terms.sections.${i}.title`), s.texts(`terms.sections.${i}.paras`)]),
    start: s.text('terms.start'),
  };
});
