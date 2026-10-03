// Runs against real Postgres and Redis when DATABASE_URL and REDIS_URL are set.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gulfToday, mockDays, windowDates } from '@openseat/shared';
import { RedisCoordinator } from './coord/redis.js';
import { migrate } from './db/migrate.js';
import { PostgresStore } from './store/postgres.js';

const db = process.env.DATABASE_URL;
const redis = process.env.REDIS_URL;

test('postgres store keeps days, empty days and alerts', { skip: !db && 'DATABASE_URL not set' }, async () => {
  await migrate(db!, () => {});
  const store = new PostgresStore(db!);
  try {
    const route = { carrier: 'QR' as const, origin: 'DOH', destination: 'NRT' };
    const dates = windowDates().slice(0, 3);
    const days = mockDays(route, dates, gulfToday());
    days[2] = { ...days[2], itineraries: [] };
    await store.putDays(route, days);
    await store.putDays(route, days); // replacing is safe
    const back = await store.getDays(route, dates);
    assert.equal(back.size, 3);
    assert.deepEqual(back.get(dates[0])!.itineraries, days[0].itineraries);
    assert.equal(back.get(dates[2])!.itineraries.length, 0);

    await store.recordSearch(route);
    assert.ok((await store.popularRoutes(5, 7)).some((r) => r.origin === 'DOH' && r.destination === 'NRT'));

    const a = await store.createAlert({ ...route, cabin: 'first', pax: 2, channel: 'email', address: 'a@example.com', open: false });
    assert.equal((await store.alertsForRoute(route)).filter((x) => x.id === a.id).length, 1);
    await store.updateAlertState(a.id, { open: true, sentToday: 1, sentDay: dates[0] });
    const updated = (await store.alertsForRoute(route)).find((x) => x.id === a.id)!;
    assert.equal(updated.open, true);
    assert.equal(updated.sentDay, dates[0]);
    assert.equal(await store.unsubscribe(a.token), true);

    // Telegram: linked once, then removed by chat.
    const chat = `chat-${Date.now()}`;
    const tg = await store.createAlert({ ...route, cabin: 'first', pax: 1, channel: 'telegram', address: '', open: false });
    assert.equal(await store.linkAlert(tg.id, 'email', chat), null);
    assert.equal((await store.linkAlert(tg.id, 'telegram', chat))?.address, chat);
    assert.equal(await store.linkAlert(tg.id, 'telegram', 'someone-else'), null);
    assert.equal(await store.removeByAddress('telegram', chat), 1);
  } finally {
    await store.close();
  }
});

test('redis coordinator locks, counts, limits and relays messages', { skip: !redis && 'REDIS_URL not set' }, async () => {
  const c = new RedisCoordinator(redis!);
  const k = 'test:' + Math.random();
  try {
    assert.equal(await c.tryLock(k, 'a', 2000), true);
    assert.equal(await c.tryLock(k, 'b', 2000), false);
    await c.unlock(k, 'b'); // not the owner: no effect
    assert.equal(await c.tryLock(k, 'b', 2000), false);
    await c.unlock(k, 'a');
    assert.equal(await c.tryLock(k, 'b', 2000), true);

    assert.equal(await c.add(k + ':n', 2, 2000), 2);
    assert.equal(await c.add(k + ':n', -1, 2000), 1);

    const results = [];
    for (let i = 0; i < 4; i++) results.push((await c.take(k + ':rl', 3, 0.01)).ok);
    assert.deepEqual(results, [true, true, true, false]);

    const got = new Promise<string>(async (resolve) => {
      await c.subscribe(k + ':ch', resolve);
      await c.publish(k + ':ch', 'hello');
    });
    assert.equal(await got, 'hello');
  } finally {
    await c.close();
  }
});

test('two API instances merge identical searches through Redis', { skip: !redis && 'REDIS_URL not set' }, async () => {
  const { SearchService } = await import('./search/service.js');
  const { MemoryStore } = await import('./store/memory.js');
  let calls = 0;
  const adapter = {
    name: 'counting',
    async fetchDays(route: { carrier: 'EK'; origin: string; destination: string }, dates: string[]) {
      calls++;
      await new Promise((r) => setTimeout(r, 80));
      return mockDays(route, dates, gulfToday()).map((d) => ({ ...d, checkedAt: new Date().toISOString() }));
    },
  };
  const store = new MemoryStore();
  // A random route per run, so leftover keys never interfere.
  const coordA = new RedisCoordinator(redis!);
  const coordB = new RedisCoordinator(redis!);
  const opts = { chunkDays: 15, staleAfterMin: 360, lockMs: 3000 };
  const a = new SearchService(store, coordA, { EK: adapter, EY: adapter, QR: adapter } as any, opts);
  const b = new SearchService(store, coordB, { EK: adapter, EY: adapter, QR: adapter } as any, opts);
  const dests = ['LHR', 'CDG', 'IST', 'JFK', 'BOM', 'SIN'];
  const params = { carrier: 'EK' as const, origin: 'DXB', destination: dests[Math.floor(Math.random() * dests.length)], pax: 1 };
  try {
    await Promise.all([a, b, a, b].map((s) => s.stream(params, 'r', () => {}, new AbortController().signal)));
    assert.equal(calls, 6);
  } finally {
    await coordA.close();
    await coordB.close();
  }
});
