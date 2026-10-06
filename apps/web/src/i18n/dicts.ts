// Every language in lang/*.xml, ready to use. English fills any gaps.

import { LANG_CODES, LANG_DATA, type Lang } from './lang-data';
import { makeDict, type Dict } from './strings';

export type { Lang } from './lang-data';
export type { Dict } from './strings';

export const DICTS = Object.fromEntries(LANG_CODES.map((c) => [c, makeDict(LANG_DATA[c], LANG_DATA.en)])) as Record<Lang, Dict>;

/** For the language menu: each language named in its own script. */
export const LANGS = LANG_CODES.map((code) => ({ code, name: LANG_DATA[code].name, dir: LANG_DATA[code].dir }));

export const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LANG_CODES as string[]).includes(v);

/** The first preferred language we have: an exact match such as pt-BR, else the base language. English if none. */
export function pickLang(tags: readonly (string | null | undefined)[]): Lang {
  for (const tag of tags) {
    if (!tag) continue;
    const lower = tag.toLowerCase();
    const exact = LANG_CODES.find((c) => c.toLowerCase() === lower);
    if (exact) return exact;
    const base = LANG_CODES.find((c) => c.toLowerCase() === lower.split('-')[0]);
    if (base) return base;
  }
  return 'en';
}
