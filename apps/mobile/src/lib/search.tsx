// The current search and everything derived from it, shared by the Search,
// Calendar and Day screens. Mirrors the website's SearchApp.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { summarise, type CabinId, type CabinSummary, type DayResult, type SearchParams } from '@openseat/shared';
import { DEFAULT_QUERY, isQuery, type Query } from './query';
import { load, save } from './storage';
import { useSearch, type SearchState } from './useSearch';

const KEY = 'openseat-query';

export type Leg = 'out' | 'ret';
type Sums = Map<string, Record<CabinId, CabinSummary>>;

function useSummaries(days: Map<string, DayResult>, pax: number): Sums {
  return useMemo(() => {
    const out: Sums = new Map();
    for (const [d, day] of days) out.set(d, summarise(day, pax));
    return out;
  }, [days, pax]);
}

function firstOpen(s: SearchState, sums: Sums, cabin: CabinId, lo: number, hi: number) {
  for (let i = Math.max(0, lo); i <= hi && i < s.dates.length; i++) if ((sums.get(s.dates[i])?.[cabin].count ?? 0) > 0) return i;
  return -1;
}

export interface Trip {
  q: Query;
  /** Changes the search and goes back to the default days, unless `keepDay` (the "Also open" chips). */
  update: (patch: Partial<Query>, keepDay?: boolean) => void;
  invalid: boolean;
  out: SearchState;
  back: SearchState;
  leg: Leg;
  setLeg: (l: Leg) => void;
  isRet: boolean;
  /** The leg on screen. */
  cur: SearchState;
  sums: Sums;
  outIdx: number;
  retIdx: number;
  selIdx: number;
  minIdx: number;
  fitRange: [number, number] | null;
  select: (idx: number) => void;
  step: (by: number) => void;
  /** Origin and destination of the leg on screen. */
  O: string;
  D: string;
  date: string | undefined;
  day: DayResult | undefined;
  summary: Record<CabinId, CabinSummary> | undefined;
  params: SearchParams | null;
}

const Ctx = createContext<Trip | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [q, setQ] = useState<Query>(DEFAULT_QUERY);
  const [leg, setLeg] = useState<Leg>('out');
  const [sel, setSel] = useState<{ out?: number; ret?: number }>({});

  // Restore the last search, so the app opens where it was left.
  useEffect(() => {
    load<Query>(KEY).then((saved) => {
      if (isQuery(saved)) setQ(saved);
    });
  }, []);

  const update = useCallback((patch: Partial<Query>, keepDay = false) => {
    setQ((prev) => {
      const next = { ...prev, ...patch };
      save(KEY, next);
      return next;
    });
    if (!keepDay) setSel({});
    if ('ret' in patch) setLeg('out');
  }, []);

  const invalid = q.from === q.to;
  const outP = useMemo<SearchParams | null>(() => (invalid ? null : { carrier: q.carrier, origin: q.from, destination: q.to, pax: q.pax }), [q.carrier, q.from, q.to, q.pax, invalid]);
  const retP = useMemo<SearchParams | null>(() => (invalid || !q.ret ? null : { carrier: q.carrier, origin: q.to, destination: q.from, pax: q.pax }), [q.carrier, q.from, q.to, q.pax, q.ret, invalid]);
  const out = useSearch(outP);
  const back = useSearch(retP);
  const sumOut = useSummaries(out.days, q.pax);
  const sumRet = useSummaries(back.days, q.pax);

  // Default day: the first with seats. For a return, the first that fits the trip length.
  const last = Math.max(0, out.dates.length - 1);
  let outIdx = sel.out ?? firstOpen(out, sumOut, q.cabin, 0, last);
  if (outIdx < 0) outIdx = 0;
  let retIdx = 0;
  let fitRange: [number, number] | null = null;
  if (q.ret > 0) {
    const target = outIdx + q.ret;
    const lastRet = Math.max(0, back.dates.length - 1);
    fitRange = [Math.min(lastRet, target - 3), Math.min(lastRet, target + 3)];
    if (sel.ret != null && sel.ret >= outIdx) retIdx = sel.ret;
    else {
      let i = firstOpen(back, sumRet, q.cabin, fitRange[0], fitRange[1]);
      if (i < 0) i = firstOpen(back, sumRet, q.cabin, outIdx, lastRet);
      retIdx = i < 0 ? Math.min(lastRet, target) : i;
    }
  }
  const isRet = q.ret > 0 && leg === 'ret';
  const cur = isRet ? back : out;
  const sums = isRet ? sumRet : sumOut;
  const selIdx = isRet ? retIdx : outIdx;
  const minIdx = isRet ? outIdx : 0;
  const date = cur.dates[selIdx];
  const legKey = isRet ? 'ret' : 'out';
  const count = cur.dates.length;

  const trip: Trip = {
    q, update, invalid, out, back, leg, setLeg, isRet, cur, sums, outIdx, retIdx, selIdx, minIdx, fitRange,
    select: (idx) => setSel((s) => ({ ...s, [legKey]: idx })),
    step: (by) => setSel((s) => ({ ...s, [legKey]: Math.max(minIdx, Math.min(count - 1, selIdx + by)) })),
    O: isRet ? q.to : q.from,
    D: isRet ? q.from : q.to,
    date,
    day: date ? cur.days.get(date) : undefined,
    summary: date ? sums.get(date) : undefined,
    params: isRet ? retP : outP,
  };

  return <Ctx.Provider value={trip}>{children}</Ctx.Provider>;
}

export function useTrip() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTrip outside SearchProvider');
  return v;
}
