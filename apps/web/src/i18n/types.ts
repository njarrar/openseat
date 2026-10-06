export type ChipId = 'program' | 'cabin' | 'pax' | 'from' | 'to' | 'ret';

/** A piece of the search sentence: plain words, or a picker button. */
export type Seg = string | { chip: ChipId };

export type { Lang } from './lang-data';
