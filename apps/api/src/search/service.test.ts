import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mockDays, gulfToday, type DayResult, type SearchEvent } from '@openseat/shared';
import type { CarrierAdapter } from '../adapters/types.js';
import { MemoryCoordinator } from '../coord/memory.js';
import { MemoryStore } from '../store/memory.js';
import type { Route } from '../store/types.js';
import { SearchService } from './service.js';

class CountingAdapter implements CarrierAdapter {
  readonly name = 'counting';
  calls = 0;
  constructor(private delayMs = 20) {}
  async fetchDays(route: Route, dates: string[], signal: AbortSignal): Promise<DayResult[]> {
    this.calls++;
    await new Promise((r, j) => {
      const t = setTimeout(r, this.delayMs);
      signal.addEventListener('abort', () => (clearTimeout(t), j(new Error('aborted'))), { once: true });
    });
    return mockDays(route, dates, gulfToday()).map((d) => ({ ...d, checkedAt: new Date().toISOString() }));
  }
}

function setup(delayMs = 20) {
  const store = new MemoryStore();
  const coord = new MemoryCoordinator();
  const adapter = new CountingAdapter(delayMs);
  const search = new SearchService(store, coord, { EK: adapter, EY: adapter, QR: adapter }, { chunkDays: 15, staleAfterMin: 360, lockMs: 2000 });
  return { store, coord, adapter, search };
}

const params = { carrier: 'EK' as const, origin: 'DXB', destination: 'LHR', pax: 1 };

async function collect(search: SearchService, signal = new AbortController().signal) {
  const events: SearchEvent[] = [];
  await search.stream(params, 'r1', (e) => events.push(e), signal);
  return events;
}

test('a cold search streams all 90 days in six blocks', async () => {
  const { search, adapter } = setup();
  const events = await collect(search);
  assert.equal(events[0].type, 'meta');
  assert.equal(events.at(-1)?.type, 'done');
  const days = events.flatMap((e) => (e.type === 'days' ? e.days : []));
  assert.equal(new Set(days.map((d) => d.date)).size, 90);
  assert.equal(adapter.calls, 6);
  assert.ok(events.every((e) => e.type !== 'days' || e.source === 'live'));
});

test('a warm search answers from the store without fetching', async () => {
  const { search, adapter } = setup();
  await collect(search);
  adapter.calls = 0;
  const events = await collect(search);
  assert.equal(adapter.calls, 0);
  const first = events.find((e) => e.type === 'days');
  assert.equal(first?.type === 'days' && first.source, 'cache');
  assert.deepEqual(events.find((e) => e.type === 'progress'), { type: 'progress', done: 0, total: 0 });
});

test('identical searches at the same time share one fetch per block', async () => {
  const { search, adapter } = setup(40);
  await Promise.all([collect(search), collect(search), collect(search)]);
  assert.equal(adapter.calls, 6);
});

test('leaving a search stops blocks nobody needs', async () => {
  const { search, adapter } = setup(40);
  const ac = new AbortController();
  const events: SearchEvent[] = [];
  const run = search.stream(params, 'r2', (e) => {
    events.push(e);
    if (e.type === 'days') ac.abort();
  }, ac.signal);
  await run;
  await new Promise((r) => setTimeout(r, 400));
  assert.ok(adapter.calls <= 2, `expected at most 2 fetches, got ${adapter.calls}`);
  assert.ok(!events.some((e) => e.type === 'done'));
});

test('a forced refresh re-reads days that are still fresh', async () => {
  const { search, adapter } = setup();
  await collect(search);
  adapter.calls = 0;
  await search.forceRefresh(params);
  await new Promise((r) => setTimeout(r, 5));
  await collect(search);
  assert.equal(adapter.calls, 6);
});
