import { describe, expect, it } from 'vitest';
import { readLangs } from '../../../../scripts/lang.mjs';
import { DICTS, LANGS, pickLang } from './dicts';
import { makeFormat } from './index';
import { LANG_DATA } from './lang-data';

function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
}

describe('lang/*.xml', () => {
  it('every file is valid and only uses keys English has', () => {
    expect(() => readLangs()).not.toThrow();
  });
  it('Arabic and French translate every English string', () => {
    const en = Object.keys(LANG_DATA.en.strings);
    for (const code of ['ar', 'fr'] as const) expect(en.filter((k) => !(k in LANG_DATA[code].strings))).toEqual([]);
  });
  it('lists every language in its own script, English first', () => {
    expect(LANGS.map((l) => l.code)).toEqual(['en', 'ar', 'fr']);
    expect(LANGS.find((l) => l.code === 'fr')?.name).toBe('Français');
    expect(LANGS.find((l) => l.code === 'ar')?.dir).toBe('rtl');
  });
  it('uses no em dash and leaves no {placeholder} unfilled', () => {
    for (const d of Object.values(DICTS)) {
      for (const s of strings(d)) expect(s).not.toContain('—');
      expect(d.search.pax(3)).not.toMatch(/[{}]/);
      expect(d.day.sub(2, 5, 'DXB', 'LHR', 'X')).not.toMatch(/[{}]/);
      expect(d.flight.step3('a', 'b', 'c', 'd', 'e', 'f')).not.toMatch(/[{}]/);
    }
  });
});

describe('dictionaries', () => {
  it('Arabic counts follow Arabic grammar', () => {
    const ar = DICTS.ar;
    expect(ar.search.pax(1)).toBe('مسافر واحد');
    expect(ar.search.pax(2)).toBe('مسافرَين');
    expect(ar.search.pax(4)).toBe('4 مسافرين');
    expect(ar.search.pax(11)).toBe('11 مسافرًا');
    expect(ar.search.ret(14)).toBe('والعودة بعد أسبوعين');
    expect(ar.cal.seats(0)).toBe('0 مقعدًا');
  });
  it('French counts and words', () => {
    const fr = DICTS.fr;
    expect(fr.search.pax(1)).toBe('1 voyageur');
    expect(fr.search.pax(3)).toBe('3 voyageurs');
    expect(fr.search.ret(0)).toBe('aller simple');
    expect(fr.search.ret(7)).toBe('retour 1 semaine plus tard');
    expect(fr.cal.seats(4)).toBe('4 places ou plus');
    expect(fr.names.city.LHR).toBe('Londres');
    expect(fr.names.cabin.business).toBe('Affaires');
  });
  it('English stays as it was', () => {
    const en = DICTS.en;
    expect(en.search.pax(1)).toBe('1 traveller');
    expect(en.search.ret(14)).toBe('and back 2 weeks later');
    expect(en.cal.title('Business', 'ret')).toBe('Return seats in Business');
    expect(en.flight.taxes('$80', 12)).toBe('+ $80 taxes, 9+ seats open');
    expect(en.flight.and).toBe(' and ');
    expect(en.picker.paxSub(1)).toBe('');
  });
  it('the sentence uses every picker once in every language', () => {
    for (const d of Object.values(DICTS)) {
      const chips = d.search.sentence().filter((s) => typeof s !== 'string').map((s) => (s as { chip: string }).chip).sort();
      expect(chips).toEqual(['cabin', 'from', 'pax', 'program', 'ret', 'to']);
    }
  });
  it('splits the sentence into words and pickers as before', () => {
    expect(DICTS.en.search.sentence()).toEqual(['Using', { chip: 'program' }, ', show me', { chip: 'cabin' }, 'seats for', { chip: 'pax' }, 'from', { chip: 'from' }, 'to', { chip: 'to' }, ',', { chip: 'ret' }, '.']);
  });
  it('picks the browser language when we have it', () => {
    expect(pickLang(['fr-CA', 'en'])).toBe('fr');
    expect(pickLang(['de-DE', 'ar-SA'])).toBe('ar');
    expect(pickLang(['de'])).toBe('en');
    expect(pickLang([])).toBe('en');
  });
});

describe('formatting', () => {
  it('formats names, times and money per language', () => {
    expect(makeFormat('en').duration(545)).toBe('9h 05m');
    expect(makeFormat('ar').duration(545)).toBe('9 س 05 د');
    expect(makeFormat('fr').duration(545)).toBe('9 h 05');
    expect(makeFormat('ar').money(412, 'USD').startsWith('⁦')).toBe(true);
    expect(makeFormat('fr').money(412, 'USD').startsWith('⁦')).toBe(false);
    expect(makeFormat('en').program('EY')).toBe('Etihad Guest');
    expect(makeFormat('fr').city('CDG')).toBe('Paris');
  });
});
