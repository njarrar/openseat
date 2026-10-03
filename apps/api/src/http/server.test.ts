import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MockAdapter } from '../adapters/index.js';
import { AlertService } from '../alerts/service.js';
import { MemoryCoordinator } from '../coord/memory.js';
import { SearchService } from '../search/service.js';
import { MemoryStore } from '../store/memory.js';
import { buildServer } from './server.js';

const SITE = 'https://openseat.app';

async function app() {
  const store = new MemoryStore();
  const coord = new MemoryCoordinator();
  const a = new MockAdapter(5);
  const search = new SearchService(store, coord, { EK: a, EY: a, QR: a }, { chunkDays: 15, staleAfterMin: 360 });
  const alerts = new AlertService(store, { send: async () => {} }, SITE, 'https://api.openseat.app');
  return buildServer({ store, coord, search, alerts, allowedOrigins: [SITE], trustProxy: false });
}

const q = 'p=EK&o=DXB&d=LHR&n=1&request_id=6f1c2a7e-2b0e-4c4b-9a43-3f0f5d6e7a81';

test('CORS only allows our own site', async () => {
  const s = await app();
  const ok = await s.inject({ method: 'OPTIONS', url: '/api/v1/alerts', headers: { origin: SITE, 'access-control-request-method': 'POST' } });
  assert.equal(ok.headers['access-control-allow-origin'], SITE);
  const bad = await s.inject({ method: 'OPTIONS', url: '/api/v1/alerts', headers: { origin: 'https://evil.example', 'access-control-request-method': 'POST' } });
  assert.notEqual(bad.headers['access-control-allow-origin'], '*');
  assert.notEqual(bad.headers['access-control-allow-origin'], 'https://evil.example');
  const stream = await s.inject({ url: `/api/v1/search/stream?${q}`, headers: { origin: 'https://evil.example' } });
  assert.equal(stream.statusCode, 403);
});

test('the search stream sends server-sent events', async () => {
  const s = await app();
  const r = await s.inject({ url: `/api/v1/search/stream?${q}`, headers: { origin: SITE } });
  assert.equal(r.statusCode, 200);
  assert.match(String(r.headers['content-type']), /text\/event-stream/);
  assert.equal(r.headers['access-control-allow-origin'], SITE);
  assert.match(r.body, /event: meta\ndata: \{"type":"meta","requestId":"6f1c2a7e/);
  assert.match(r.body, /event: done/);
  assert.equal((r.body.match(/event: days/g) ?? []).length, 6);
});

test('invalid searches are rejected', async () => {
  const s = await app();
  assert.equal((await s.inject({ url: '/api/v1/search/stream?p=EK&o=DXB&d=DXB' })).statusCode, 400);
  assert.equal((await s.inject({ url: '/api/v1/search/stream?p=XX&o=DXB&d=LHR' })).statusCode, 400);
});

test('reference data revalidates by ETag and is never immutable', async () => {
  const s = await app();
  const r = await s.inject({ url: '/api/v1/reference' });
  assert.equal(r.statusCode, 200);
  assert.doesNotMatch(String(r.headers['cache-control']), /immutable/);
  const again = await s.inject({ url: '/api/v1/reference', headers: { 'if-none-match': String(r.headers.etag) } });
  assert.equal(again.statusCode, 304);
});

test('refresh has a per-route cooldown', async () => {
  const s = await app();
  const body = { p: 'EK', o: 'DXB', d: 'LHR', n: 1 };
  assert.equal((await s.inject({ method: 'POST', url: '/api/v1/search/refresh', payload: body })).statusCode, 200);
  const second = await s.inject({ method: 'POST', url: '/api/v1/search/refresh', payload: body });
  assert.equal(second.statusCode, 429);
  assert.ok(second.headers['retry-after']);
});

test('alerts can be created and removed with their token', async () => {
  const s = await app();
  const bad = await s.inject({ method: 'POST', url: '/api/v1/alerts', payload: { carrier: 'EK', origin: 'DXB', destination: 'LHR', cabin: 'first', pax: 1, channel: 'email', address: 'x' } });
  assert.equal(bad.statusCode, 400);
  const r = await s.inject({ method: 'POST', url: '/api/v1/alerts', payload: { carrier: 'EK', origin: 'DXB', destination: 'LHR', cabin: 'first', pax: 1, channel: 'email', address: 'me@example.com' } });
  assert.equal(r.statusCode, 201);
  const { id, token } = r.json();
  assert.equal((await s.inject({ method: 'DELETE', url: `/api/v1/alerts/${id}`, headers: { 'x-alert-token': 'wrong' } })).statusCode, 404);
  assert.equal((await s.inject({ method: 'DELETE', url: `/api/v1/alerts/${id}`, headers: { 'x-alert-token': token } })).statusCode, 204);
});
