import { randomUUID } from 'node:crypto';
import { windowDates, type CarrierId, type DayResult, type SearchEvent, type SearchParams } from '@openseat/shared';
import type { CarrierAdapter } from '../adapters/types.js';
import type { Coordinator } from '../coord/types.js';
import { routeId, type InventoryStore, type Route } from '../store/types.js';

export interface SearchOptions {
  chunkDays: number;
  staleAfterMin: number;
  /** How long one block fetch may hold its lock. */
  lockMs?: number;
}

type JobMessage = { ok: true; days: DayResult[] } | { ok: false; message: string };

/** Called after fresh days are stored, for example to check alerts. */
export type AfterRefresh = (route: Route, days: DayResult[]) => Promise<void>;

/**
 * Streams a 90-day search:
 * 1. Sends every day we already have, straight away.
 * 2. Re-reads stale or missing days in blocks. Identical blocks requested at
 *    the same time, by any user on any instance, share one fetch.
 * 3. When a request goes away, blocks it has not started are never fetched,
 *    and a running fetch stops if nobody else is waiting for it.
 */
export class SearchService {
  private lockMs: number;
  afterRefresh: AfterRefresh = async () => {};

  constructor(
    private store: InventoryStore,
    private coord: Coordinator,
    private adapters: Record<CarrierId, CarrierAdapter>,
    private opts: SearchOptions,
  ) {
    this.lockMs = opts.lockMs ?? 60000;
  }

  /** Mark a route so the next search re-reads every day. */
  async forceRefresh(route: Route) {
    await this.coord.set(`force:${routeId(route)}`, new Date().toISOString(), 10 * 60000);
  }

  async stream(p: SearchParams, requestId: string, emit: (e: SearchEvent) => void, signal: AbortSignal) {
    const route: Route = { carrier: p.carrier, origin: p.origin, destination: p.destination };
    const dates = windowDates();
    emit({ type: 'meta', requestId, dates });
    this.store.recordSearch(route).catch(() => {});

    const cached = await this.store.getDays(route, dates);
    if (cached.size) emit({ type: 'days', days: [...cached.values()], source: 'cache' });

    const forcedAt = await this.coord.get(`force:${routeId(route)}`);
    const staleBefore = Math.max(Date.now() - this.opts.staleAfterMin * 60000, forcedAt ? Date.parse(forcedAt) : 0);
    const isStale = (d: string) => {
      const hit = cached.get(d);
      return !hit || Date.parse(hit.checkedAt) <= staleBefore;
    };

    const blocks = this.blocks(dates).filter((b) => b.some(isStale));
    const total = blocks.length;
    let done = 0;
    emit({ type: 'progress', done, total });

    for (const block of blocks) {
      if (signal.aborted) return;
      try {
        const days = await this.fetchShared(route, block, signal);
        if (signal.aborted) return;
        emit({ type: 'days', days, source: 'live' });
      } catch (e) {
        if (signal.aborted) return;
        emit({ type: 'error', message: e instanceof Error ? e.message : 'Search failed', dates: block });
      }
      emit({ type: 'progress', done: ++done, total });
    }
    emit({ type: 'done' });
  }

  /** Refresh every block of a route, used by the scheduler. */
  async refreshRoute(route: Route, signal: AbortSignal) {
    for (const block of this.blocks(windowDates())) {
      if (signal.aborted) return;
      await this.fetchShared(route, block, signal);
    }
  }

  /** Blocks line up with the window start, so everyone asking today shares the same keys. */
  private blocks(dates: string[]) {
    const out: string[][] = [];
    for (let i = 0; i < dates.length; i += this.opts.chunkDays) out.push(dates.slice(i, i + this.opts.chunkDays));
    return out;
  }

  private async fetchShared(route: Route, dates: string[], signal: AbortSignal): Promise<DayResult[]> {
    const key = `${routeId(route)}:${dates[0]}:${dates.length}`;
    const channel = `job:${key}`;
    const listeners = `listeners:${key}`;

    let settle!: (m: JobMessage) => void;
    const result = new Promise<JobMessage>((r) => (settle = r));
    // Subscribe before taking the lock, so the result cannot slip past us.
    const leave = await this.coord.subscribe(channel, (raw) => settle(JSON.parse(raw)));
    await this.coord.add(listeners, 1, this.lockMs * 2);
    try {
      const owner = randomUUID();
      if (await this.coord.tryLock(`lock:${key}`, owner, this.lockMs)) {
        // Runs on its own: it must outlive this request if others are waiting.
        void this.runJob(route, dates, key, owner);
      }
      const outcome = await Promise.race([
        result,
        new Promise<JobMessage>((r) => setTimeout(() => r({ ok: false, message: 'timeout' }), this.lockMs + 5000)),
        new Promise<JobMessage>((r) => signal.addEventListener('abort', () => r({ ok: false, message: 'cancelled' }), { once: true })),
      ]);
      if (outcome.ok) return outcome.days;
      if (outcome.message === 'timeout') {
        // The worker died: fall back to whatever is stored.
        const stored = await this.store.getDays(route, dates);
        if (stored.size === dates.length) return [...stored.values()];
      }
      throw new Error(outcome.message);
    } finally {
      await this.coord.add(listeners, -1, this.lockMs * 2);
      await leave();
    }
  }

  private async runJob(route: Route, dates: string[], key: string, owner: string) {
    const ac = new AbortController();
    // Stop the fetch once nobody is listening any more.
    const watch = setInterval(async () => {
      if ((await this.coord.count(`listeners:${key}`)) <= 0) ac.abort(new Error('cancelled'));
    }, 300);
    let msg: JobMessage;
    try {
      const days = await this.adapters[route.carrier].fetchDays(route, dates, ac.signal);
      await this.store.putDays(route, days);
      msg = { ok: true, days };
      this.afterRefresh(route, days).catch(() => {});
    } catch (e) {
      msg = { ok: false, message: e instanceof Error ? e.message : 'fetch failed' };
    } finally {
      clearInterval(watch);
    }
    // Unlock first: a request arriving in between starts a new fetch rather
    // than waiting for a message that has already gone out.
    await this.coord.unlock(`lock:${key}`, owner);
    await this.coord.publish(`job:${key}`, JSON.stringify(msg));
  }
}
