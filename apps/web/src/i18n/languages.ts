// The language files at the repo root, read when a language is first used.
// The website (vite.config.ts), the apps (metro.config.js) and the app tests
// (test/xml-loader.mjs) each load an .xml import as its text.
//
// To add a language: add languages/<code>.xml, import it below and add the
// code to LANGS in types.ts. Lines it leaves out show in English.

import ar from '../../../../languages/ar.xml';
import en from '../../../../languages/en.xml';
import { buildDict, type Dict } from './dict';
import { Strings } from './strings';
import { LANGS, type Lang } from './types';
import { parseLanguage } from './xml';

const SOURCES: Record<Lang, string> = { en, ar };

/** A value per language, made the first time that language is asked for. */
export function perLang<T>(make: (lang: Lang) => T): Record<Lang, T> {
  const out = {} as Record<Lang, T>;
  for (const lang of LANGS) {
    let v: T | undefined;
    Object.defineProperty(out, lang, { enumerable: true, get: () => (v ??= make(lang)) });
  }
  return out;
}

export const STRINGS: Record<Lang, Strings> = perLang((lang) => {
  const file = parseLanguage(SOURCES[lang]);
  if (file.code !== lang) throw new Error(`languages/${lang}.xml says code="${file.code}"`);
  return new Strings(file, lang === 'en' ? undefined : STRINGS.en);
});

export const DICTS: Record<Lang, Dict> = perLang((lang) => buildDict(STRINGS[lang]));
