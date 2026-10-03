import type { CabinId, Itinerary } from '@openseat/shared';

export type Badge = 'qsuite' | 'a380';

/**
 * Cabin product badges worth knowing before you book. This reads the aircraft
 * type, which is a good guide but not a guarantee: the real data source should
 * send the product for each flight once it is available.
 */
export function productBadges(it: Itinerary, cabin: CabinId): Badge[] {
  const out: Badge[] = [];
  const types = it.legs.length ? it.legs.map((l) => l.aircraft) : [it.aircraft];
  if (it.carrier === 'QR' && cabin === 'business' && types.some((a) => a === 'A350-1000' || a === '777-300ER')) out.push('qsuite');
  if (types.some((a) => a.startsWith('A380'))) out.push('a380');
  return out;
}
