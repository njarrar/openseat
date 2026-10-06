#!/usr/bin/env node
// Builds the translations in lang/*.xml into apps/web/src/i18n/lang-data.ts,
// which the website and the apps import. See lang/README.md for the format.
//
//   node scripts/lang.mjs           check the files and write lang-data.ts
//   node scripts/lang.mjs --check   check the files only
//
// English (lang/en.xml) is the reference. Another language may leave strings
// out, and they show in English, but it may not add keys English does not have.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const LANG_DIR = join(ROOT, 'lang');
export const OUT_FILE = join(ROOT, 'apps/web/src/i18n/lang-data.ts');

const PLURAL_FORMS = ['zero', 'one', 'two', 'few', 'many', 'other'];
const NAME = /^[A-Za-z0-9_]+$/;

class LangError extends Error {}

// ---- A small XML reader: elements, attributes, text, comments, CDATA and entities.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decode(s, fail) {
  return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-z]+);?/g, (m, e) => {
    if (!m.endsWith(';')) fail(`"&" must be written as &amp;`);
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    if (!(e in ENTITIES)) fail(`unknown entity &${e};`);
    return ENTITIES[e];
  });
}

export function parseXml(src, file) {
  let i = 0;
  const line = (at = i) => src.slice(0, at).split('\n').length;
  const fail = (msg, at = i) => { throw new LangError(`${file}:${line(at)}: ${msg}`); };
  const root = { name: '#root', attrs: {}, children: [], line: 1 };
  const stack = [root];

  if (src.charCodeAt(0) === 0xfeff) i = 1;
  while (i < src.length) {
    const top = stack[stack.length - 1];
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i);
      if (end < 0) fail('comment is not closed');
      i = end + 3;
    } else if (src.startsWith('<![CDATA[', i)) {
      const end = src.indexOf(']]>', i);
      if (end < 0) fail('CDATA is not closed');
      top.children.push({ text: src.slice(i + 9, end) });
      i = end + 3;
    } else if (src.startsWith('<?', i)) {
      const end = src.indexOf('?>', i);
      if (end < 0) fail('declaration is not closed');
      i = end + 2;
    } else if (src.startsWith('<!', i)) {
      fail('DOCTYPE and other declarations are not supported');
    } else if (src.startsWith('</', i)) {
      const m = /^<\/([A-Za-z_][\w.:-]*)\s*>/.exec(src.slice(i));
      if (!m) fail('bad closing tag');
      if (stack.length === 1 || top.name !== m[1]) fail(`</${m[1]}> does not match <${top.name}> on line ${top.line}`);
      stack.pop();
      i += m[0].length;
    } else if (src[i] === '<') {
      const start = i;
      const m = /^<([A-Za-z_][\w.:-]*)/.exec(src.slice(i));
      if (!m) fail('bad tag');
      i += m[0].length;
      const el = { name: m[1], attrs: {}, children: [], line: line(start) };
      for (;;) {
        const ws = /^\s*/.exec(src.slice(i))[0];
        i += ws.length;
        if (src.startsWith('/>', i)) { i += 2; top.children.push(el); break; }
        if (src[i] === '>') { i += 1; top.children.push(el); stack.push(el); break; }
        const a = /^([A-Za-z_][\w.:-]*)\s*=\s*("([^"]*)"|'([^']*)')/.exec(src.slice(i));
        if (!a || !ws) fail(`bad attribute in <${el.name}>`);
        if (a[1] in el.attrs) fail(`attribute ${a[1]} is set twice`);
        el.attrs[a[1]] = decode(a[3] ?? a[4], (msg) => fail(msg));
        i += a[0].length;
      }
    } else {
      const end = src.indexOf('<', i);
      const raw = src.slice(i, end < 0 ? src.length : end);
      const at = i;
      top.children.push({ text: decode(raw, (msg) => fail(msg, at)) });
      i += raw.length;
    }
  }
  if (stack.length > 1) fail(`<${stack[stack.length - 1].name}> on line ${stack[stack.length - 1].line} is not closed`);
  const els = root.children.filter((c) => c.name);
  if (els.length !== 1 || root.children.some((c) => !c.name && c.text.trim())) fail('the file must hold one <language> element', 0);
  return els[0];
}

// ---- From XML elements to a flat map of keys.

/** Text inside an element. Spaces and line breaks fold to one space, unless xml:space="preserve". */
function textOf(el, file) {
  for (const c of el.children) if (c.name) throw new LangError(`${file}:${c.line}: <${el.name}> holds text only, not <${c.name}>`);
  const s = el.children.map((c) => c.text).join('');
  return el.attrs['xml:space'] === 'preserve' ? s : s.replace(/\s+/g, ' ').trim();
}

function only(el, names, file) {
  for (const c of el.children) {
    if (c.name && !names.includes(c.name)) throw new LangError(`${file}:${c.line}: <${c.name}> is not allowed inside <${el.name}>`);
    if (!c.name && c.text.trim()) throw new LangError(`${file}:${el.line}: put text inside <${names.join('>, <')}>, not straight inside <${el.name}>`);
  }
  return el.children.filter((c) => c.name);
}

function keyOf(el, attr, file) {
  const k = el.attrs[attr];
  if (!k || !NAME.test(k)) throw new LangError(`${file}:${el.line}: <${el.name}> needs ${attr}="..." made of letters, digits or _`);
  return k;
}

function entry(el, file) {
  if (el.name === 'text') return textOf(el, file);
  if (el.name === 'plural') {
    const forms = {};
    for (const f of only(el, PLURAL_FORMS, file)) {
      if (f.name in forms) throw new LangError(`${file}:${f.line}: <${f.name}> appears twice`);
      forms[f.name] = textOf(f, file);
    }
    if (!('other' in forms)) throw new LangError(`${file}:${el.line}: <plural> needs an <other> form`);
    return { plural: forms };
  }
  if (el.name === 'list') {
    return only(el, ['item'], file).map((item) => {
      const kids = item.children.filter((c) => c.name);
      if (!kids.length) return textOf(item, file);
      const obj = {};
      for (const c of only(item, ['text', 'list', 'plural'], file)) {
        const k = keyOf(c, 'key', file);
        if (k in obj) throw new LangError(`${file}:${c.line}: key "${k}" appears twice in this item`);
        obj[k] = entry(c, file);
      }
      return obj;
    });
  }
  throw new LangError(`${file}:${el.line}: <${el.name}> is not a known element`);
}

function collect(el, prefix, out, lines, file) {
  for (const c of only(el, ['section', 'text', 'plural', 'list'], file)) {
    if (c.name === 'section') {
      collect(c, prefix + keyOf(c, 'name', file) + '.', out, lines, file);
      continue;
    }
    const key = prefix + keyOf(c, 'key', file);
    if (key in out) throw new LangError(`${file}:${c.line}: "${key}" appears twice (first on line ${lines[key]})`);
    out[key] = entry(c, file);
    lines[key] = c.line;
  }
}

const kind = (v) => (typeof v === 'string' ? 'text' : Array.isArray(v) ? 'list' : 'plural');

/** Every {name} in a value, so a translation cannot ask for a value the code never passes. */
function placeholders(v, out = new Set()) {
  if (typeof v === 'string') for (const m of v.matchAll(/\{(\w+)\}/g)) out.add(m[1]);
  else if (Array.isArray(v)) v.forEach((x) => placeholders(x, out));
  else if (v && typeof v === 'object') Object.values(v.plural ?? v).forEach((x) => placeholders(x, out));
  return out;
}

function sameShape(a, b) {
  if (kind(a) !== kind(b)) return false;
  if (!Array.isArray(a)) return true;
  return a.length === b.length && a.every((x, i) => {
    const y = b[i];
    if (typeof x === 'string' || typeof y === 'string') return typeof x === typeof y;
    const ka = Object.keys(x).sort().join(), kb = Object.keys(y).sort().join();
    return ka === kb && Object.keys(x).every((k) => sameShape(x[k], y[k]));
  });
}

function readLanguage(file, src) {
  const el = parseXml(src, file);
  if (el.name !== 'language') throw new LangError(`${file}:${el.line}: the file must start with <language>`);
  const code = file.replace(/\.xml$/, '');
  const a = el.attrs;
  const need = (k) => {
    if (!a[k]) throw new LangError(`${file}:${el.line}: <language> needs ${k}="..."`);
    return a[k];
  };
  if (need('code') !== code) throw new LangError(`${file}:${el.line}: code="${a.code}" must match the file name (${code})`);
  if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(code)) throw new LangError(`${file}: name the file with a language code, like fr.xml or pt-BR.xml`);
  if (!['ltr', 'rtl'].includes(need('dir'))) throw new LangError(`${file}:${el.line}: dir must be "ltr" or "rtl"`);
  for (const k of ['locale', 'numbers']) {
    try {
      Intl.getCanonicalLocales(need(k));
    } catch {
      throw new LangError(`${file}:${el.line}: ${k}="${a[k]}" is not a valid locale`);
    }
  }
  const strings = {}, lines = {};
  collect(el, '', strings, lines, file);
  return { code, name: need('name'), english: need('english'), dir: a.dir, locale: a.locale, numbers: a.numbers, strings, lines };
}

/** Reads and checks every file. Throws on the first error; returns warnings for missing strings. */
export function readLangs(dir = LANG_DIR) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.xml')).sort();
  if (!files.includes('en.xml')) throw new LangError('lang/en.xml is missing. English is the reference for every other language.');
  const langs = files.map((f) => readLanguage(f, readFileSync(join(dir, f), 'utf8')));
  const en = langs.find((l) => l.code === 'en');
  const warnings = [];
  for (const l of langs) {
    if (l === en) continue;
    const file = `${l.code}.xml`;
    for (const [key, v] of Object.entries(l.strings)) {
      const base = en.strings[key];
      if (base === undefined) throw new LangError(`${file}:${l.lines[key]}: "${key}" is not in en.xml. Check the spelling, or add it to English first.`);
      if (!sameShape(v, base)) throw new LangError(`${file}:${l.lines[key]}: "${key}" must have the same form as in en.xml (${kind(base)}${Array.isArray(base) ? ` of ${base.length} items` : ''})`);
      const allowed = placeholders(base);
      if (kind(base) === 'plural') allowed.add('n');
      for (const p of placeholders(v)) {
        if (!allowed.has(p)) throw new LangError(`${file}:${l.lines[key]}: "${key}" uses {${p}}, but English only has ${[...allowed].map((x) => `{${x}}`).join(' ') || 'none'}`);
      }
    }
    const missing = Object.keys(en.strings).filter((k) => !(k in l.strings));
    if (missing.length) warnings.push(`${file}: ${missing.length} strings not translated yet, shown in English: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', ...' : ''}`);
  }
  // English first, then the others by code.
  langs.sort((x, y) => (x.code === 'en' ? -1 : y.code === 'en' ? 1 : x.code.localeCompare(y.code)));
  return { langs, warnings };
}

export function render(langs) {
  const data = Object.fromEntries(langs.map(({ lines, ...l }) => [l.code, l]));
  return `// Built from lang/*.xml by scripts/lang.mjs. Do not edit this file: edit the XML and run npm run lang.

export type Lang = ${langs.map((l) => JSON.stringify(l.code)).join(' | ')};

export type LangValue = string | { plural: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string } } | (string | Record<string, LangValue>)[];

export interface LangData {
  code: Lang;
  /** The language's name in its own script, for the language menu. */
  name: string;
  english: string;
  dir: 'ltr' | 'rtl';
  locale: string;
  numbers: string;
  strings: Record<string, LangValue>;
}

export const LANG_CODES: Lang[] = ${JSON.stringify(langs.map((l) => l.code))};

export const LANG_DATA: Record<Lang, LangData> = ${JSON.stringify(data, null, 1)};
`;
}

/** Checks lang/*.xml and, unless check is set, writes lang-data.ts. Returns the languages found. */
export function buildLangs({ check = false, quiet = false } = {}) {
  const { langs, warnings } = readLangs();
  if (!quiet) for (const w of warnings) console.warn(`lang: ${w}`);
  if (!check) {
    const out = render(langs);
    let old = '';
    try {
      old = readFileSync(OUT_FILE, 'utf8');
    } catch {
      /* first build */
    }
    if (old !== out) {
      mkdirSync(dirname(OUT_FILE), { recursive: true });
      writeFileSync(OUT_FILE, out);
    }
  }
  return langs.map(({ code, name, dir }) => ({ code, name, dir }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const langs = buildLangs({ check: process.argv.includes('--check') });
    console.log(`lang: ${langs.map((l) => l.code).join(', ')} ok`);
  } catch (e) {
    if (!(e instanceof LangError)) throw e;
    console.error(`lang: ${e.message}`);
    process.exit(1);
  }
}
