// Every string comes from the language files in languages/ at the repo root,
// read through the website's i18n code so the two never drift apart.

import type { Dict } from '../../../web/src/i18n/dict';
import { DICTS, perLang, STRINGS } from '../../../web/src/i18n/languages';
import type { Lang } from '../../../web/src/i18n/types';
import { buildAppDict, type AppDict } from './app';

export type { AppDict, Dict, Lang };
export type { ChipId, Seg } from '../../../web/src/i18n/types';

export { DICTS };
export const APP_DICTS: Record<Lang, AppDict> = perLang((lang) => buildAppDict(STRINGS[lang]));

/** Arabic when the device prefers it, English otherwise, like the website. */
export const pickLang = (languageCode: string | null | undefined): Lang => (languageCode?.toLowerCase().startsWith('ar') ? 'ar' : 'en');
