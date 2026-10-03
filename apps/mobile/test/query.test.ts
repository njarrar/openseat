import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readQuery as webReadQuery } from '../../web/src/lib/url';
import { DEFAULT_QUERY, hasQuery, isQuery, queryParams, queryString, readParams, readQueryString, type Query } from '../src/lib/query';

describe('search query', () => {
  it('reads a deep link the same way the website reads its address', () => {
    for (const s of ['?p=QR&o=DOH&d=NRT&c=first&n=2&r=14', '?p=EY&o=AUH&d=BKK&c=business&n=1&r=0', '?p=XX&o=ZZZ&c=coach&n=9&r=5', '']) {
      assert.deepEqual(readQueryString(s), webReadQuery(s), s);
    }
  });

  it('writes links the website can open', () => {
    const q: Query = { carrier: 'EK', from: 'RUH', to: 'LHR', cabin: 'premium', pax: 3, ret: 21 };
    assert.equal(queryString(q), '?p=EK&o=RUH&d=LHR&c=premium&n=3&r=21');
    assert.deepEqual(webReadQuery(queryString(q)), q);
    assert.deepEqual(readQueryString(queryString(q)), q);
  });

  it('keeps the current search for anything a link leaves out', () => {
    const base: Query = { carrier: 'QR', from: 'DOH', to: 'NRT', cabin: 'first', pax: 2, ret: 14 };
    assert.deepEqual(readParams({ c: 'economy' }, base), { ...base, cabin: 'economy' });
    assert.deepEqual(readParams({ n: ['4', '5'] }, base), { ...base, pax: 4 });
    assert.deepEqual(readParams({ p: 'nope', n: '0', r: '' }, base), base);
  });

  it('round-trips through router params', () => {
    const q: Query = { carrier: 'EY', from: 'AUH', to: 'SYD', cabin: 'business', pax: 6, ret: 7 };
    assert.deepEqual(readParams(queryParams(q)), q);
    assert.ok(hasQuery(queryParams(q)));
    assert.equal(hasQuery({ field: 'from' }), false);
  });

  it('only trusts a saved search that is valid', () => {
    assert.ok(isQuery(DEFAULT_QUERY));
    assert.equal(isQuery({ ...DEFAULT_QUERY, pax: 7 }), false);
    assert.equal(isQuery({ ...DEFAULT_QUERY, from: 'XXX' }), false);
    assert.equal(isQuery({ ...DEFAULT_QUERY, ret: 3 }), false);
    assert.equal(isQuery(null), false);
  });
});
