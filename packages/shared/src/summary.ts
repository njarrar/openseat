import { CABIN_IDS, type CabinId } from './reference.js';
import type { DayResult, Itinerary } from './types.js';

export interface CabinSummary {
  /** Most seats open on one flight that has room for every traveller. 0 when none. */
  count: number;
  /** Lowest price among those flights, or 0. */
  minMiles: number;
  /** Number of flights with room for every traveller. */
  qualifying: number;
  /** True when at least one flight sells this cabin at all. */
  offered: boolean;
}

/** A day "has seats" only when one flight has enough for everyone. */
export const fits = (it: Itinerary, cabin: CabinId, pax: number) => (it.cabins[cabin].seats ?? 0) >= pax;

export function summarise(day: DayResult, pax: number): Record<CabinId, CabinSummary> {
  const out = {} as Record<CabinId, CabinSummary>;
  for (const cabin of CABIN_IDS) {
    const q = day.itineraries.filter((it) => fits(it, cabin, pax));
    out[cabin] = {
      count: q.length ? Math.max(...q.map((it) => it.cabins[cabin].seats ?? 0)) : 0,
      minMiles: q.length ? Math.min(...q.map((it) => it.cabins[cabin].miles ?? Infinity)) : 0,
      qualifying: q.length,
      offered: day.itineraries.some((it) => it.cabins[cabin].seats !== null),
    };
  }
  return out;
}
