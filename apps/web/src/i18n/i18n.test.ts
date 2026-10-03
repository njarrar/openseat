import { describe, expect, it } from 'vitest';
import { ar } from './ar';
import { en } from './en';

function shape(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shape);
  if (typeof v === 'function') return 'fn';
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).sort().map(([k, x]) => [k, shape(x)]));
  return typeof v;
}

describe('dictionaries', () => {
  it('Arabic has every English string', () => {
    expect(shape(ar)).toEqual(shape(en));
  });
  it('Arabic counts follow Arabic grammar', () => {
    expect(ar.search.pax(1)).toBe('مسافر واحد');
    expect(ar.search.pax(2)).toBe('مسافرَين');
    expect(ar.search.pax(4)).toBe('4 مسافرين');
    expect(ar.search.ret(14)).toBe('والعودة بعد أسبوعين');
  });
  it('the sentence uses every picker once in both languages', () => {
    for (const d of [en, ar]) {
      const chips = d.search.sentence().filter((s) => typeof s !== 'string').map((s) => (s as { chip: string }).chip).sort();
      expect(chips).toEqual(['cabin', 'from', 'pax', 'program', 'ret', 'to']);
    }
  });
});
