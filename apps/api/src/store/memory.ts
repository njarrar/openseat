import { randomBytes, randomUUID } from 'node:crypto';
import type { DayResult } from '@openseat/shared';
import { routeId, parseRouteId, type AlertRow, type InventoryStore, type NewAlert, type Route } from './types.js';

/** In-process store for local development and tests. Lost on restart. */
export class MemoryStore implements InventoryStore {
  private days = new Map<string, DayResult>();
  private searches = new Map<string, number[]>();
  private alerts = new Map<string, AlertRow>();

  async getDays(route: Route, dates: string[]) {
    const out = new Map<string, DayResult>();
    for (const d of dates) {
      const hit = this.days.get(routeId(route) + ':' + d);
      if (hit) out.set(d, structuredClone(hit));
    }
    return out;
  }

  async putDays(route: Route, days: DayResult[]) {
    for (const d of days) this.days.set(routeId(route) + ':' + d.date, structuredClone(d));
  }

  async recordSearch(route: Route) {
    const k = routeId(route);
    this.searches.set(k, [...(this.searches.get(k) ?? []), Date.now()]);
  }

  async popularRoutes(limit: number, sinceDays: number) {
    const since = Date.now() - sinceDays * 86400000;
    return [...this.searches.entries()]
      .map(([k, ts]) => [k, ts.filter((t) => t >= since).length] as const)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([k]) => parseRouteId(k)!)
      .filter(Boolean);
  }

  async createAlert(a: NewAlert) {
    const row: AlertRow = { ...a, id: randomUUID(), token: randomBytes(24).toString('base64url'), sentToday: 0, sentDay: null };
    this.alerts.set(row.id, row);
    return { ...row };
  }

  async deleteAlert(id: string, token: string) {
    const a = this.alerts.get(id);
    if (!a || a.token !== token) return false;
    return this.alerts.delete(id);
  }

  async unsubscribe(token: string) {
    for (const [id, a] of this.alerts) if (a.token === token) return this.alerts.delete(id);
    return false;
  }

  async alertsForRoute(route: Route) {
    return [...this.alerts.values()].filter((a) => routeId(a) === routeId(route)).map((a) => ({ ...a }));
  }

  async alertRoutes() {
    const seen = new Map<string, Route>();
    for (const a of this.alerts.values()) seen.set(routeId(a), { carrier: a.carrier, origin: a.origin, destination: a.destination });
    return [...seen.values()];
  }

  async updateAlertState(id: string, patch: Pick<AlertRow, 'open' | 'sentToday' | 'sentDay'>) {
    const a = this.alerts.get(id);
    if (a) Object.assign(a, patch);
  }

  async linkAlert(id: string, channel: AlertRow['channel'], address: string) {
    const a = this.alerts.get(id);
    if (!a || a.channel !== channel || a.address) return null;
    a.address = address;
    return { ...a };
  }

  async removeByAddress(channel: AlertRow['channel'], address: string) {
    let n = 0;
    for (const [id, a] of this.alerts) if (a.channel === channel && a.address === address && this.alerts.delete(id)) n++;
    return n;
  }

  async ping() {
    return true;
  }

  async close() {}
}
