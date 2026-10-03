import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { appAr, appEn } from '../src/i18n/app';
import { DICTS, pickLang } from '../src/i18n/dicts';
import { makeFormat } from '../src/i18n/format';

function shape(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shape);
  if (typeof v === 'function') return 'fn';
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).sort().map(([k, x]) => [k, shape(x)]));
  return typeof v;
}

function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
}

describe('app copy', () => {
  it('Arabic has every English app string', () => {
    assert.deepEqual(shape(appAr), shape(appEn));
  });

  it('shares the website dictionaries rather than a copy', () => {
    assert.deepEqual(shape(DICTS.ar), shape(DICTS.en));
    assert.equal(DICTS.ar.dir, 'rtl');
    assert.equal(DICTS.en.dir, 'ltr');
  });

  it('Arabic counts follow Arabic grammar', () => {
    assert.equal(appAr.search.weeks(1), 'أسبوع');
    assert.equal(appAr.search.weeks(2), 'أسبوعين');
    assert.equal(appAr.search.weeks(3), '3 أسابيع');
    assert.equal(appEn.search.weeks(1), '1 week');
  });

  it('uses no em dash in any copy', () => {
    const dash = '—';
    for (const s of [...strings(appEn), ...strings(appAr)]) assert.ok(!s.includes(dash), s);
    for (const fn of [appEn.cal.navSub, appAr.cal.navSub]) assert.ok(!fn('a', 'b', true).includes(dash));
  });

  it('follows the device language, Arabic or English', () => {
    assert.equal(pickLang('ar'), 'ar');
    assert.equal(pickLang('AR'), 'ar');
    assert.equal(pickLang('en'), 'en');
    assert.equal(pickLang('fr'), 'en');
    assert.equal(pickLang(null), 'en');
  });
});

describe('formatting', () => {
  it('matches the website in English', () => {
    const f = makeFormat('en');
    assert.equal(f.num(88500), '88,500');
    assert.equal(f.dateLong('2026-10-06'), 'Tuesday 6 October');
    assert.equal(f.duration(545), '9h 05m');
    assert.equal(f.money(412, 'USD'), '$412');
    assert.equal(f.program('EY'), 'Etihad Guest');
  });

  it('keeps Latin digits and isolates amounts in Arabic', () => {
    const f = makeFormat('ar');
    assert.equal(f.num(88500), '88,500');
    assert.ok(f.money(412, 'USD').startsWith('⁦'));
    assert.equal(f.city('LHR'), 'لندن');
    assert.equal(f.duration(545), '9 س 05 د');
  });
});
