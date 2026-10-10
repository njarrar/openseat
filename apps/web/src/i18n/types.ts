export type ChipId = 'program' | 'cabin' | 'pax' | 'from' | 'to' | 'ret';

/** A piece of the search sentence: plain words, or a picker button. */
export type Seg = string | { chip: ChipId };

/** One per file in languages/. Add a code here when you add a file there. */
export const LANGS = ['en', 'ar'] as const;
export type Lang = (typeof LANGS)[number];
