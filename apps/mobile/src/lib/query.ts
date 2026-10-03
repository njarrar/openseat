// The search, as the website keeps it in its address: ?p=EK&o=DXB&d=LHR&c=business&n=1&r=0.
// The app reads the same keys from deep links and writes them into shared links,
// so a link made in the app opens the same search on the website and back.

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

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** True when the params carry any part of a search. */
export const hasQuery = (p: Params) => ['p', 'o', 'd', 'c', 'n', 'r'].some((k) => one(p[k]) !== undefined);

/** Reads the search keys. Anything missing or invalid comes from `base`. */
export function readParams(p: Params, base: Query = DEFAULT_QUERY): Query {
  const out = { ...base };
  const c = one(p.p), o = one(p.o), d = one(p.d), cab = one(p.c);
  if (isCarrier(c)) out.carrier = c;
  if (isAirport(o)) out.from = o;
  if (isAirport(d)) out.to = d;
  if (isCabin(cab)) out.cabin = cab;
  const n = Number(one(p.n));
  if (Number.isInteger(n) && n >= 1 && n <= MAX_PAX) out.pax = n;
  const r = one(p.r);
  if (r !== undefined && r !== '' && (RETURN_OPTIONS as readonly number[]).includes(Number(r))) out.ret = Number(r);
  return out;
}

/** Parses '?p=EK&o=DXB...' (with or without the '?'). */
export function readQueryString(s: string, base: Query = DEFAULT_QUERY): Query {
  const params: Record<string, string> = {};
  for (const part of s.replace(/^\?/, '').split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    const k = decodeURIComponent(eq < 0 ? part : part.slice(0, eq));
    if (!(k in params)) params[k] = decodeURIComponent(eq < 0 ? '' : part.slice(eq + 1).replace(/\+/g, ' '));
  }
  return readParams(params, base);
}

export function queryString(q: Query): string {
  return `?p=${q.carrier}&o=${q.from}&d=${q.to}&c=${q.cabin}&n=${q.pax}&r=${q.ret}`;
}

/** A plain object for router params. */
export const queryParams = (q: Query) => ({ p: q.carrier, o: q.from, d: q.to, c: q.cabin, n: String(q.pax), r: String(q.ret) });

/** Sanity check for anything read back from storage. */
export function isQuery(v: unknown): v is Query {
  if (!v || typeof v !== 'object') return false;
  const q = v as Query;
  return isCarrier(q.carrier) && isAirport(q.from) && isAirport(q.to) && isCabin(q.cabin)
    && Number.isInteger(q.pax) && q.pax >= 1 && q.pax <= MAX_PAX && (RETURN_OPTIONS as readonly number[]).includes(q.ret);
}
