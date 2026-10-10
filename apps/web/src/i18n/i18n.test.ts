import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DICTS, STRINGS } from './languages';
import { pluralForm } from './strings';
import { LANGS } from './types';
import { Plural, parseLanguage, type Value } from './xml';

const ar = DICTS.ar;
const en = DICTS.en;
const dir = new URL('../../../../languages/', import.meta.url);

/** Every dotted name in a file, with the kind of value it holds. */
function names(v: Value, path = '', out: Record<string, string> = {}): Record<string, string> {
  if (typeof v === 'string') out[path] = 'text';
  else if (v instanceof Plural) out[path] = 'plural';
  else if (Array.isArray(v)) {
    out[path] = `list of ${v.length}`;
    v.forEach((x, i) => names(x, `${path}.${i}`, out));
  } else for (const [k, x] of Object.entries(v)) names(x, path ? `${path}.${k}` : k, out);
  return out;
}

function shape(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shape);
  if (typeof v === 'function') return 'fn';
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).sort().map(([k, x]) => [k, shape(x)]));
  return typeof v;
}

describe('language files', () => {
  it('has one file per language and nothing else', () => {
    const files = readdirSync(dir).filter((f) => f.endsWith('.xml')).sort();
    expect(files).toEqual(LANGS.map((l) => `${l}.xml`).sort());
  });

  it('Arabic has every English line, of the same kind', () => {
    expect(names(STRINGS.ar.file.root)).toEqual(names(STRINGS.en.file.root));
  });

  it('builds the same shape of copy in every language', () => {
    for (const l of LANGS) expect(shape(DICTS[l])).toEqual(shape(en));
    expect(ar.dir).toBe('rtl');
    expect(en.dir).toBe('ltr');
  });

  it('leaves no {slot} unfilled and uses no em dash', () => {
    const args = [0, 1, 2, 3, 5, 7, 9, 11, 14, 100, 'ret', 'out'];
    const seen: string[] = [];
    const walk = (v: unknown) => {
      if (typeof v === 'string') seen.push(v);
      else if (typeof v === 'function') for (const a of args) walk(v(...Array(Math.max(v.length, 1)).fill(a)));
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    for (const l of LANGS) walk(DICTS[l]);
    for (const s of seen) {
      expect(s).not.toMatch(/\{\w+\}/);
      expect(s).not.toContain('\u2014');
    }
  });
});

describe('reading XML', () => {
  const xml = (body: string) => `<?xml version="1.0"?>\n<language code="xx" name="Test" locale="xx">${body}</language>`;

  it('reads text, groups, lists, plurals and entities', () => {
    const f = parseLanguage(xml(`
      <!-- a comment -->
      <group name="a">
        <text name="b">Fish &amp; chips
          for two</text>
        <text name="c" xml:space="preserve"> and </text>
      </group>
      <list name="d"><text>one</text><group><text name="e">two</text></group></list>
      <plural name="p"><one>{n} cat</one><other>{n} cats</other></plural>`));
    expect(f.dir).toBe('ltr');
    expect(f.numberLocale).toBe('xx');
    expect(f.root.a).toEqual({ b: 'Fish & chips for two', c: ' and ' });
    expect(f.root.d).toEqual(['one', { e: 'two' }]);
    expect(f.root.p).toBeInstanceOf(Plural);
  });

  it('says where the file is broken', () => {
    expect(() => parseLanguage(xml('\n<text name="a">x</group>'))).toThrow(/line 3/);
    expect(() => parseLanguage(xml('<text name="a">x</text><text name="a">y</text>'))).toThrow(/twice/);
    expect(() => parseLanguage(xml('<plural name="p"><one>x</one></plural>'))).toThrow(/other/);
    expect(() => parseLanguage(xml('<text>no name</text>'))).toThrow(/name/);
  });

  it('every file in the folder parses and names its own code', () => {
    for (const l of LANGS) expect(parseLanguage(readFileSync(new URL(`${l}.xml`, dir), 'utf8')).code).toBe(l);
  });
});

describe('copy', () => {
  it('Arabic counts follow Arabic grammar', () => {
    expect(ar.search.pax(1)).toBe('مسافر واحد');
    expect(ar.search.pax(2)).toBe('مسافرَين');
    expect(ar.search.pax(4)).toBe('4 مسافرين');
    expect(ar.search.pax(12)).toBe('12 مسافرًا');
    expect(ar.search.ret(14)).toBe('والعودة بعد أسبوعين');
    expect(pluralForm('ar', 0)).toBe('zero');
    expect(pluralForm('ar', 11)).toBe('many');
  });
  it('English counts', () => {
    expect(en.search.pax(1)).toBe('1 traveller');
    expect(en.search.pax(3)).toBe('3 travellers');
    expect(en.flight.taxes('$40', 12)).toBe('+ $40 taxes, 9+ seats open');
    expect(en.cal.dayAria('Mon 5 Oct', '2 seats', '88,500', 'Miles', true)).toBe('Mon 5 Oct, 2 seats from 88,500 Miles, fits your trip');
  });
  it('the sentence uses every picker once in both languages', () => {
    for (const d of [en, ar]) {
      const chips = d.search.sentence().filter((s) => typeof s !== 'string').map((s) => (s as { chip: string }).chip).sort();
      expect(chips).toEqual(['cabin', 'from', 'pax', 'program', 'ret', 'to']);
    }
    expect(en.search.sentence()).toEqual(['Using', { chip: 'program' }, ', show me', { chip: 'cabin' }, 'seats for', { chip: 'pax' }, 'from', { chip: 'from' }, 'to', { chip: 'to' }, ',', { chip: 'ret' }, '.']);
  });
});
