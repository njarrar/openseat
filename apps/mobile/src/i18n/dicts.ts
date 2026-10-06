// Every string comes from lang/*.xml, through the website's dictionaries, so
// the app and the site never drift apart.

import { DICTS, LANGS, isLang, pickLang as pickFromTags, type Dict, type Lang } from '../../../web/src/i18n/dicts';
import { LANG_CODES, LANG_DATA } from '../../../web/src/i18n/lang-data';
import { makeAppDict, type AppDict } from './app';

export type { AppDict, Dict, Lang };
export type { ChipId, Seg } from '../../../web/src/i18n/types';
export { DICTS, LANGS, isLang };

export const APP_DICTS = Object.fromEntries(LANG_CODES.map((c) => [c, makeAppDict(LANG_DATA[c], LANG_DATA.en)])) as Record<Lang, AppDict>;

/** The device language when we have it, English otherwise, like the website. */
export const pickLang = (languageTag: string | null | undefined): Lang => pickFromTags([languageTag]);
