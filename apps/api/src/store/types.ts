import type { AlertChannel, CabinId, CarrierId, DayResult } from '@openseat/shared';

export interface Route {
  carrier: CarrierId;
  origin: string;
  destination: string;
}

export const routeId = (r: Route) => `${r.carrier}:${r.origin}:${r.destination}`;

export function parseRouteId(s: string): Route | null {
  const [carrier, origin, destination] = s.split(':');
  if (!carrier || !origin || !destination) return null;
  return { carrier: carrier as CarrierId, origin, destination };
}

export interface AlertRow extends Route {
  id: string;
  cabin: CabinId;
  pax: number;
  channel: AlertChannel;
  address: string;
  token: string;
  /** Whether seats were open at the last check. Alerts fire when this goes from false to true. */
  open: boolean;
  sentToday: number;
  sentDay: string | null;
}

export type NewAlert = Omit<AlertRow, 'id' | 'token' | 'sentToday' | 'sentDay'>;

export interface InventoryStore {
  /** Days we have read before, keyed by date. Missing dates were never read. */
  getDays(route: Route, dates: string[]): Promise<Map<string, DayResult>>;
  /** Replace what we know about these days. */
  putDays(route: Route, days: DayResult[]): Promise<void>;
  recordSearch(route: Route): Promise<void>;
  popularRoutes(limit: number, sinceDays: number): Promise<Route[]>;

  createAlert(a: NewAlert): Promise<AlertRow>;
  deleteAlert(id: string, token: string): Promise<boolean>;
  unsubscribe(token: string): Promise<boolean>;
  alertsForRoute(route: Route): Promise<AlertRow[]>;
  alertRoutes(): Promise<Route[]>;
  updateAlertState(id: string, patch: Pick<AlertRow, 'open' | 'sentToday' | 'sentDay'>): Promise<void>;

  ping(): Promise<boolean>;
  close(): Promise<void>;
}
