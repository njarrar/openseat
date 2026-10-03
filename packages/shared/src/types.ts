import type { CabinId, CarrierId } from './reference.js';

/** One cabin on one itinerary. `seats: null` means the cabin is not sold on this flight. */
export interface CabinFare {
  seats: number | null;
  /** One-way price per traveller. */
  miles: number | null;
  /** Cash taxes and carrier surcharges per traveller, in `Itinerary.currency`. */
  tax: number | null;
  /** Saver (fixed, lowest) price. False means a Flex or dynamic price. */
  saver: boolean;
}

export interface Leg {
  flight: string;
  from: string;
  to: string;
  dep: string;
  arr: string;
  aircraft: string;
}

export interface Itinerary {
  /** Flight numbers joined by '-', for example 'EK3-EK7'. */
  key: string;
  carrier: CarrierId;
  origin: string;
  destination: string;
  /** Departure date at the origin, YYYY-MM-DD. */
  date: string;
  /** Null for nonstop flights. */
  hub: string | null;
  dep: string;
  arr: string;
  dayOffset: number;
  durationMin: number;
  layoverMin: number;
  /** Aircraft on the longest leg, the one that decides the cabin product. */
  aircraft: string;
  legs: Leg[];
  /**
   * True when the connection was put together from two separate awards rather
   * than returned by the airline as one booking. These may not be sold together.
   */
  separateTickets: boolean;
  currency: string;
  cabins: Record<CabinId, CabinFare>;
}

export interface DayResult {
  date: string;
  itineraries: Itinerary[];
  /** When this day was last read from the airline, ISO 8601. */
  checkedAt: string;
}

export interface SearchParams {
  carrier: CarrierId;
  origin: string;
  destination: string;
  pax: number;
}

/** Events sent on the search stream (`text/event-stream`). */
export type SearchEvent =
  | { type: 'meta'; requestId: string; dates: string[] }
  | { type: 'days'; days: DayResult[]; source: 'cache' | 'live' }
  | { type: 'progress'; done: number; total: number }
  | { type: 'error'; message: string; dates?: string[] }
  | { type: 'done' };

export type AlertChannel = 'email' | 'telegram' | 'whatsapp';

export interface AlertRequest {
  carrier: CarrierId;
  origin: string;
  destination: string;
  cabin: CabinId;
  pax: number;
  channel: AlertChannel;
  address: string;
}
