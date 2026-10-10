// Looks up text in a parsed language file. A name missing from a new language
// falls back to English, so a half-done translation still shows every screen.

import { Plural, type LanguageFile, type PluralForm, type Value } from './xml';
import type { ChipId, Seg } from './types';

type Vars = Record<string, string | number>;

/** Which plural form a count takes. English and Arabic are built in so every platform agrees. */
export function pluralForm(code: string, n: number): PluralForm {
  if (code === 'en') return n === 1 ? 'one' : 'other';
  if (code === 'ar') {
    const r = n % 100;
    if (n === 0) return 'zero';
    if (n === 1) return 'one';
    if (n === 2) return 'two';
    if (r >= 3 && r <= 10) return 'few';
    if (r >= 11 && r <= 99) return 'many';
    return 'other';
  }
  try {
    return new Intl.PluralRules(code).select(n) as PluralForm;
  } catch {
    return n === 1 ? 'one' : 'other';
  }
}

/** Puts values into {name} slots. Unknown names stay as they are, so a test can spot them. */
export const fill = (s: string, vars: Vars = {}) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

export class Strings {
  constructor(readonly file: LanguageFile, private readonly fallback?: Strings) {}

  get code() {
    return this.file.code;
  }

  /** The raw value at a dotted name such as "nav.search". */
  get(path: string): Value {
    let v: Value | undefined = this.file.root;
    for (const part of path.split('.')) {
      if (Array.isArray(v)) v = v[Number(part)];
      else v = v && typeof v === 'object' && !(v instanceof Plural) ? v[part] : undefined;
    }
    if (v !== undefined) return v;
    if (this.fallback) return this.fallback.get(path);
    throw new Error(`No text for "${path}" in ${this.file.code}.xml`);
  }

  text(path: string, vars?: Vars): string {
    const v = this.get(path);
    if (typeof v !== 'string') throw new Error(`"${path}" in ${this.file.code}.xml should be a <text>`);
    return fill(v, vars);
  }

  /** The form for n, with {n} and any other values filled in. */
  plural(path: string, n: number, vars?: Vars): string {
    const v = this.get(path);
    if (!(v instanceof Plural)) throw new Error(`"${path}" in ${this.file.code}.xml should be a <plural>`);
    const form = v.forms[pluralForm(this.code, n)] ?? v.forms.other!;
    return fill(form, { n, ...vars });
  }

  list(path: string): Value[] {
    const v = this.get(path);
    if (!Array.isArray(v)) throw new Error(`"${path}" in ${this.file.code}.xml should be a <list>`);
    return v;
  }

  texts(path: string): string[] {
    return this.list(path).map((x) => {
      if (typeof x !== 'string') throw new Error(`"${path}" in ${this.file.code}.xml should hold only <text>`);
      return x;
    });
  }

  /** A group's text values by name, for small maps such as currency names. */
  map<K extends string>(path: string): Record<K, string> {
    const v = this.get(path);
    if (!v || typeof v !== 'object' || Array.isArray(v) || v instanceof Plural) throw new Error(`"${path}" in ${this.file.code}.xml should be a <group>`);
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof x === 'string' ? x : ''])) as Record<K, string>;
  }

  /** A sentence with {chip} slots, split into words and picker buttons. */
  segments(path: string): Seg[] {
    return this.text(path)
      .split(/\{(\w+)\}/)
      .map((s, i): Seg => (i % 2 ? { chip: s as ChipId } : s.trim()))
      .filter((s) => s !== '');
  }
}
