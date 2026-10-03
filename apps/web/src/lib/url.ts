import { MAX_PAX, RETURN_OPTIONS, isAirport, isCabin, isCarrier, type CabinId, type CarrierId } from '@openseat/shared';

export interface Query {
  carrier: CarrierId;
  from: string;
  to: string;
  cabin: CabinId;
  pax: number;
  /** Days until the return: 0 for one way, else 7, 14, 21 or 28. */
  ret: number;
}

export const DEFAULT_QUERY: Query = { carrier: 'EK', from: 'DXB', to: 'LHR', cabin: 'business', pax: 1, ret: 0 };

/** ?p=EK&o=DXB&d=LHR&c=business&n=1&r=0. Anything invalid falls back to the default. */
export function readQuery(search: string): Query {
  const q = new URLSearchParams(search);
  const out = { ...DEFAULT_QUERY };
  const p = q.get('p'), o = q.get('o'), d = q.get('d'), c = q.get('c');
  if (isCarrier(p)) out.carrier = p;
  if (isAirport(o)) out.from = o;
  if (isAirport(d)) out.to = d;
  if (isCabin(c)) out.cabin = c;
  const n = Number(q.get('n'));
  if (Number.isInteger(n) && n >= 1 && n <= MAX_PAX) out.pax = n;
  const r = Number(q.get('r'));
  if ((RETURN_OPTIONS as readonly number[]).includes(r)) out.ret = r;
  return out;
}

export function queryString(q: Query): string {
  return `?p=${q.carrier}&o=${q.from}&d=${q.to}&c=${q.cabin}&n=${q.pax}&r=${q.ret}`;
}

/** Keep the address bar in step, so reload and back keep the search. Other params (lang) stay. */
export function writeQuery(q: Query) {
  const url = new URL(location.href);
  for (const [k, v] of new URLSearchParams(queryString(q))) url.searchParams.set(k, v);
  history.replaceState(history.state, '', url);
}

export function shareUrl(q: Query): string {
  return location.origin + location.pathname + queryString(q);
}
