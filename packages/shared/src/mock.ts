// Deterministic sample data. Not live airline data. The API's mock adapter and
// the web app's offline mode both use this, so they always agree.

import { AIRPORT_BY_CODE, CABIN_IDS, CARRIER_BY_ID, type CabinId, type CarrierId } from './reference.js';
import { diffDays, weekday } from './dates.js';
import type { CabinFare, DayResult, Itinerary, Leg, SearchParams } from './types.js';

interface Fleet {
  fleet: string[];
  first: string[];
  premium: string[];
  mul: number;
  tax: [number, number];
}

const FLEET: Record<CarrierId, Fleet> = {
  EK: { fleet: ['A380-800', '777-300ER', 'A350-900'], first: ['A380-800', '777-300ER'], premium: ['A380-800', 'A350-900'], mul: 1.08, tax: [60, 0.034] },
  EY: { fleet: ['787-9', 'A350-1000', '777-300ER', 'A380-800'], first: ['A380-800'], premium: [], mul: 0.97, tax: [42, 0.02] },
  QR: { fleet: ['A350-1000', '777-300ER', '787-9', 'A380-800'], first: ['A380-800'], premium: [], mul: 1.0, tax: [36, 0.016] },
};

const BANDS = [1200, 3000, 5500, 8000];
const BASE: Record<CabinId, number[]> = {
  economy: [9000, 16000, 26000, 36000, 47000],
  premium: [14500, 25500, 41500, 57500, 75000],
  business: [22000, 42000, 72000, 88000, 112000],
  first: [36000, 62000, 108000, 138000, 172000],
};
const TAX_MUL: Record<CabinId, number> = { economy: 1, premium: 1.2, business: 1.45, first: 1.7 };
const SLOTS = [130, 475, 540, 865, 1215, 1290];

export function hash(s: string): number {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) {
    x ^= s.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  x ^= x >>> 13;
  x = Math.imul(x, 0x5bd1e995);
  x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
}

function km(a: string, b: string) {
  const R = 6371, t = Math.PI / 180, A = AIRPORT_BY_CODE[a], B = AIRPORT_BY_CODE[b];
  const dLa = (B.lat - A.lat) * t, dLo = (B.lon - A.lon) * t;
  const s = Math.sin(dLa / 2) ** 2 + Math.cos(A.lat * t) * Math.cos(B.lat * t) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const hours = (d: number) => d / 810 + 0.5;
const band = (d: number) => {
  let i = 0;
  while (i < BANDS.length && d > BANDS[i]) i++;
  return i;
};
const hhmm = (m: number) => {
  m = ((m % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
};

interface Scheduled {
  key: string;
  dep: number;
  arr: number;
  durationMin: number;
  layoverMin: number;
  dist: number;
  legs: Leg[];
  aircraft: string;
  hub: string | null;
  first: boolean;
  premium: boolean;
}

function schedule(carrier: CarrierId, O: string, D: string): Scheduled[] {
  const c = CARRIER_BY_ID[carrier], f = FLEET[carrier];
  const direct = O === c.hub || D === c.hub;
  const route: [string, string][] = direct ? [[O, D]] : [[O, c.hub], [c.hub, D]];
  const n = 1 + Math.floor(hash(carrier + O + D) * 3);
  const start = Math.floor(hash(D + O + carrier) * SLOTS.length);
  const out: Scheduled[] = [];
  for (let i = 0; i < n; i++) {
    const dep = SLOTS[(start + i * 2) % SLOTS.length] + Math.floor(hash(carrier + O + D + i) * 4) * 5;
    const lay = direct ? 0 : Math.round((1.3 + hash(O + D + i + 'l') * 2.2) * 60);
    let t = dep, dist = 0, longest = 0, aircraft = '';
    const legs: Leg[] = route.map(([a, b], li) => {
      const d = km(a, b);
      dist += d;
      const ac = f.fleet[Math.floor(hash(carrier + a + b + i) * f.fleet.length)];
      if (d > longest) { longest = d; aircraft = ac; }
      const legDep = t + (li > 0 ? lay : 0);
      const legArr = legDep + Math.round(hours(d) * 60) + Math.round((AIRPORT_BY_CODE[b].tz - AIRPORT_BY_CODE[a].tz) * 60);
      t = legArr;
      return { flight: carrier + ' ' + (1 + Math.floor(hash(carrier + a + b) * 780) * 2 + i * 2), from: a, to: b, dep: hhmm(legDep), arr: hhmm(legArr), aircraft: ac };
    });
    const flying = route.reduce((s, [a, b]) => s + Math.round(hours(km(a, b)) * 60), 0);
    out.push({
      key: legs.map((l) => l.flight.replace(' ', '')).join('-'),
      dep, arr: t, durationMin: flying + lay, layoverMin: lay, dist, legs, aircraft,
      hub: direct ? null : c.hub,
      first: f.first.includes(aircraft) && longest > 2000,
      premium: f.premium.includes(aircraft) && longest > 2000,
    });
  }
  return out.sort((a, b) => a.dep - b.dep);
}

const saverMiles = (carrier: CarrierId, cabin: CabinId, dist: number) => Math.round((BASE[cabin][band(dist)] * FLEET[carrier].mul) / 500) * 500;
const taxFor = (carrier: CarrierId, cabin: CabinId, dist: number) => Math.round((FLEET[carrier].tax[0] + dist * FLEET[carrier].tax[1]) * TAX_MUL[cabin]);

function seatsFor(s: Scheduled, date: string, cabin: CabinId, daysOut: number): number | null {
  if (cabin === 'first' && !s.first) return null;
  if (cabin === 'premium' && !s.premium) return null;
  const dow = weekday(date);
  const r = hash(s.key + date + cabin), r2 = hash(date + cabin + s.key + 'q');
  const th = { economy: 0.22, premium: 0.42, business: 0.55, first: 0.7 }[cabin] - (daysOut < 14 ? 0.18 : 0) + (dow === 4 || dow === 5 ? 0.12 : 0);
  if (r < th) return 0;
  return 1 + Math.floor(r2 * { economy: 9, premium: 4, business: 4, first: 2 }[cabin]);
}

/** Sample availability for the given dates. `today` decides how far out each date is. */
export function mockDays(p: Pick<SearchParams, 'carrier' | 'origin' | 'destination'>, dates: string[], today: string, now: Date = new Date()): DayResult[] {
  const sched = schedule(p.carrier, p.origin, p.destination);
  // Each route looks checked a few minutes to a few hours ago.
  const ageMin = 6 + Math.floor(hash(p.carrier + p.origin + p.destination + 'age') * 170);
  const checkedAt = new Date(now.getTime() - ageMin * 60000).toISOString();
  return dates.map((date) => {
    const daysOut = diffDays(today, date);
    const itineraries: Itinerary[] = sched.map((s) => {
      const cabins = {} as Record<CabinId, CabinFare>;
      for (const cabin of CABIN_IDS) {
        const seats = seatsFor(s, date, cabin, daysOut);
        const saver = hash(s.key + date + cabin + 's') > 0.22;
        const base = saverMiles(p.carrier, cabin, s.dist);
        cabins[cabin] = seats === null
          ? { seats: null, miles: null, tax: null, saver: false }
          : { seats, miles: saver ? base : Math.round((base * 1.75) / 500) * 500, tax: taxFor(p.carrier, cabin, s.dist), saver };
      }
      return {
        key: s.key, carrier: p.carrier, origin: p.origin, destination: p.destination, date,
        hub: s.hub, dep: hhmm(s.dep), arr: hhmm(s.arr), dayOffset: Math.floor(s.arr / 1440),
        durationMin: s.durationMin, layoverMin: s.layoverMin, aircraft: s.aircraft, legs: s.legs,
        separateTickets: false, currency: 'USD', cabins,
      };
    });
    return { date, itineraries, checkedAt };
  });
}
