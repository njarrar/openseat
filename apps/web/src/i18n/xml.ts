// Reads a language file from the languages/ folder at the repo root.
//
// The files use a small, fixed set of tags, so this is a short parser of our
// own rather than a dependency. It runs the same in the browser, in React
// Native and in Node tests, none of which share an XML API.
//
//   <language code="en" name="English" dir="ltr" locale="en-GB" numberLocale="en-US">
//     <group name="nav">                      nested names, read as nav.search
//       <text name="search">Search</text>     one string; {name} marks a value
//       <list name="weekdays">                strings or groups in order
//         <text>Mon</text>
//       </list>
//       <plural name="pax">                   picked by count: zero, one, two, few, many, other
//         <one>{n} traveller</one>
//         <other>{n} travellers</other>
//       </plural>
//     </group>
//   </language>
//
// Runs of spaces and line breaks in text become one space, and text is trimmed,
// so long lines can wrap in the file. Add xml:space="preserve" to keep them.

export const PLURAL_FORMS = ['zero', 'one', 'two', 'few', 'many', 'other'] as const;
export type PluralForm = (typeof PLURAL_FORMS)[number];

export class Plural {
  constructor(readonly forms: Partial<Record<PluralForm, string>>) {}
}

export type Value = string | Plural | Value[] | { [name: string]: Value };

export interface LanguageFile {
  code: string;
  name: string;
  dir: 'ltr' | 'rtl';
  locale: string;
  numberLocale: string;
  root: { [name: string]: Value };
}

interface El {
  tag: string;
  attrs: Record<string, string>;
  kids: (El | string)[];
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e] ?? m;
  });
}

/** Parses the tree of elements. Throws with a line number on broken markup. */
function parseTree(xml: string): El {
  let i = 0;
  const line = () => xml.slice(0, i).split('\n').length;
  const fail = (msg: string): never => {
    throw new Error(`Language file, line ${line()}: ${msg}`);
  };
  const root: El = { tag: '', attrs: {}, kids: [] };
  const stack: El[] = [root];

  while (i < xml.length) {
    const lt = xml.indexOf('<', i);
    if (lt === -1) {
      stack[stack.length - 1].kids.push(decode(xml.slice(i)));
      break;
    }
    if (lt > i) stack[stack.length - 1].kids.push(decode(xml.slice(i, lt)));
    i = lt;
    if (xml.startsWith('<!--', i)) {
      const end = xml.indexOf('-->', i);
      if (end === -1) fail('comment is not closed');
      i = end + 3;
    } else if (xml.startsWith('<![CDATA[', i)) {
      const end = xml.indexOf(']]>', i);
      if (end === -1) fail('CDATA is not closed');
      stack[stack.length - 1].kids.push(xml.slice(i + 9, end));
      i = end + 3;
    } else if (xml.startsWith('<?', i) || xml.startsWith('<!', i)) {
      const end = xml.indexOf('>', i);
      if (end === -1) fail('declaration is not closed');
      i = end + 1;
    } else if (xml.startsWith('</', i)) {
      const end = xml.indexOf('>', i);
      if (end === -1) fail('closing tag is not closed');
      const tag = xml.slice(i + 2, end).trim();
      const open = stack.pop();
      if (!open || open === root || open.tag !== tag) fail(`</${tag}> does not match <${open?.tag ?? ''}>`);
      i = end + 1;
    } else {
      const m = /^<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/.exec(xml.slice(i));
      if (!m) fail('bad tag');
      const attrs: Record<string, string> = {};
      for (const a of m![2].matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]] = decode(a[2] ?? a[3]);
      const el: El = { tag: m![1], attrs, kids: [] };
      stack[stack.length - 1].kids.push(el);
      if (!m![3]) stack.push(el);
      i += m![0].length;
    }
  }
  if (stack.length > 1) fail(`<${stack[stack.length - 1].tag}> is not closed`);
  const els = root.kids.filter((k): k is El => typeof k !== 'string');
  if (els.length !== 1) fail('expected one <language> element');
  return els[0];
}

function textOf(el: El): string {
  const raw = el.kids.map((k) => (typeof k === 'string' ? k : textOf(k))).join('');
  return el.attrs['xml:space'] === 'preserve' ? raw : raw.replace(/[ \t\r\n]+/g, ' ').trim();
}

const elements = (el: El) => el.kids.filter((k): k is El => typeof k !== 'string');

function value(el: El): Value {
  switch (el.tag) {
    case 'text':
      return textOf(el);
    case 'plural': {
      const forms: Partial<Record<PluralForm, string>> = {};
      for (const k of elements(el)) {
        if (!(PLURAL_FORMS as readonly string[]).includes(k.tag)) throw new Error(`Language file: <${k.tag}> is not a plural form`);
        forms[k.tag as PluralForm] = textOf(k);
      }
      if (forms.other === undefined) throw new Error(`Language file: plural "${el.attrs.name}" needs an <other> form`);
      return new Plural(forms);
    }
    case 'list':
      return elements(el).map(value);
    case 'group':
      return named(el);
    default:
      throw new Error(`Language file: unknown tag <${el.tag}>`);
  }
}

function named(el: El): { [name: string]: Value } {
  const out: { [name: string]: Value } = {};
  for (const k of elements(el)) {
    const name = k.attrs.name;
    if (!name) throw new Error(`Language file: <${k.tag}> inside <${el.tag}> needs a name`);
    if (name in out) throw new Error(`Language file: "${name}" appears twice`);
    out[name] = value(k);
  }
  return out;
}

export function parseLanguage(xml: string): LanguageFile {
  const el = parseTree(xml);
  if (el.tag !== 'language') throw new Error('Language file: the top element must be <language>');
  const { code, name, dir = 'ltr', locale, numberLocale } = el.attrs;
  if (!code || !name || !locale) throw new Error('Language file: <language> needs code, name and locale');
  if (dir !== 'ltr' && dir !== 'rtl') throw new Error('Language file: dir must be ltr or rtl');
  return { code, name, dir, locale, numberLocale: numberLocale ?? locale, root: named(el) };
}
