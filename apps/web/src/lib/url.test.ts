import { describe, expect, it } from 'vitest';
import { DEFAULT_QUERY, queryString, readQuery } from './url';

describe('search URL', () => {
  it('reads a full shared link', () => {
    expect(readQuery('?p=QR&o=DOH&d=NRT&c=first&n=2&r=14')).toEqual({ carrier: 'QR', from: 'DOH', to: 'NRT', cabin: 'first', pax: 2, ret: 14 });
  });
  it('falls back to defaults for anything invalid', () => {
    expect(readQuery('?p=XX&o=ZZZ&c=coach&n=9&r=5')).toEqual(DEFAULT_QUERY);
    expect(readQuery('')).toEqual(DEFAULT_QUERY);
  });
  it('writes what it reads', () => {
    const q = { carrier: 'EY' as const, from: 'AUH', to: 'BKK', cabin: 'business' as const, pax: 1, ret: 0 };
    expect(readQuery(queryString(q))).toEqual(q);
  });
});
