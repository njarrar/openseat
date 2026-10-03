// The website's dictionaries are the source for every shared string. The app
// imports them from apps/web rather than keeping a copy.

import { ar } from '../../../web/src/i18n/ar';
import { en, type Dict } from '../../../web/src/i18n/en';
import type { Lang } from '../../../web/src/i18n/types';
import { appAr, appEn, type AppDict } from './app';

export type { AppDict, Dict, Lang };
export type { ChipId, Seg } from '../../../web/src/i18n/types';

export const DICTS: Record<Lang, Dict> = { en, ar };
export const APP_DICTS: Record<Lang, AppDict> = { en: appEn, ar: appAr };

/** Arabic when the device prefers it, English otherwise, like the website. */
export const pickLang = (languageCode: string | null | undefined): Lang => (languageCode?.toLowerCase().startsWith('ar') ? 'ar' : 'en');
