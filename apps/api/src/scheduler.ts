import { windowDates } from '@openseat/shared';
import type { Coordinator } from './coord/types.js';
import type { SearchService } from './search/service.js';
import { parseRouteId, routeId, type InventoryStore, type Route } from './store/types.js';

export interface SchedulerOptions {
  trunkRoutes: string[];
  trunkMaxAgeMin: number;
  alertMaxAgeMin: number;
  tickSec: number;
  routesPerTick: number;
}

interface Candidate {
  route: Route;
  maxAgeMin: number;
  /** Lower runs first. */
  tier: number;
}

/**
 * Keeps busy routes fresh with a rolling, jittered schedule instead of one big
 * refresh at fixed times, which would hit airline systems all at once.
 *
 * Tier 1: trunk routes and the most searched routes, every 2 to 4 hours.
 * Tier 2: routes with active alerts, every 1 to 2 hours.
 * Tier 3: everything else is refreshed when someone searches (see SearchService).
 */
export class Scheduler {
  private timer?: NodeJS.Timeout;
  private ac = new AbortController();
  private running = false;

  constructor(
    private store: InventoryStore,
    private coord: Coordinator,
    private search: SearchService,
    private opts: SchedulerOptions,
    private log: (m: string) => void = () => {},
  ) {}

  start() {
    this.timer = setInterval(() => void this.tick(), this.opts.tickSec * 1000);
    void this.tick();
  }

  stop() {
    clearInterval(this.timer);
    this.ac.abort();
  }

  /** Stable per-route jitter in [0.75, 1.25), so routes spread across the hour. */
  static jitter(route: Route) {
    let h = 0;
    for (const ch of routeId(route)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return 0.75 + (h % 1000) / 2000;
  }

  async candidates(): Promise<Candidate[]> {
    const trunk = this.opts.trunkRoutes.map(parseRouteId).filter((r): r is Route => !!r);
    const popular = await this.store.popularRoutes(20, 7);
    const alerts = await this.store.alertRoutes();
    const out = new Map<string, Candidate>();
    for (const r of [...trunk, ...popular]) out.set(routeId(r), { route: r, maxAgeMin: this.opts.trunkMaxAgeMin, tier: 1 });
    for (const r of alerts) out.set(routeId(r), { route: r, maxAgeMin: this.opts.alertMaxAgeMin, tier: 2 });
    return [...out.values()];
  }

  /** Age in minutes of the oldest day in the window, or Infinity if any day was never read. */
  async age(route: Route) {
    const dates = windowDates();
    const days = await this.store.getDays(route, dates);
    if (days.size < dates.length) return Infinity;
    const oldest = Math.min(...[...days.values()].map((d) => Date.parse(d.checkedAt)));
    return (Date.now() - oldest) / 60000;
  }

  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const due: (Candidate & { overdue: number })[] = [];
      for (const c of await this.candidates()) {
        const limit = c.maxAgeMin * Scheduler.jitter(c.route);
        const age = await this.age(c.route);
        if (age >= limit) due.push({ ...c, overdue: age / limit });
      }
      due.sort((a, b) => a.tier - b.tier || b.overdue - a.overdue);
      for (const c of due.slice(0, this.opts.routesPerTick)) {
        const id = routeId(c.route);
        // Only one instance refreshes a given route.
        const owner = String(process.pid) + Math.random();
        if (!(await this.coord.tryLock(`sched:${id}`, owner, 10 * 60000))) continue;
        try {
          this.log(`refreshing ${id} (tier ${c.tier})`);
          await this.search.refreshRoute(c.route, this.ac.signal);
        } catch (e) {
          this.log(`refresh failed for ${id}: ${e instanceof Error ? e.message : e}`);
        } finally {
          await this.coord.unlock(`sched:${id}`, owner);
        }
      }
    } finally {
      this.running = false;
    }
  }
}
