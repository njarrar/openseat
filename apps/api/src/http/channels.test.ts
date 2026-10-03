import { test } from 'node:test';
import assert from 'node:assert/strict';
import { windowDates, type DayResult } from '@openseat/shared';
import { MockAdapter } from '../adapters/index.js';
import { ChannelNotifier, WhatsAppNotifier, type AlertMessage } from '../alerts/notifier.js';
import { AlertService, ValidationError, validateAlert } from '../alerts/service.js';
import { MemoryCoordinator } from '../coord/memory.js';
import { SearchService } from '../search/service.js';
import { MemoryStore } from '../store/memory.js';
import type { AlertRow } from '../store/types.js';
import { buildServer } from './server.js';

const SITE = 'https://openseat.app';
const SECRET = 'webhook-secret';
const route = { carrier: 'EK' as const, origin: 'DXB', destination: 'LHR' };
const body = { ...route, cabin: 'business', pax: 1 };

async function app(opts: { human?: boolean } = {}) {
  const store = new MemoryStore();
  const coord = new MemoryCoordinator();
  const a = new MockAdapter(5);
  const search = new SearchService(store, coord, { EK: a, EY: a, QR: a }, { chunkDays: 15, staleAfterMin: 360 });
  const sent: { to: AlertRow; m: AlertMessage }[] = [];
  const said: { chat: string; text: string }[] = [];
  const alerts = new AlertService(store, { send: async (to, m) => void sent.push({ to, m }) }, SITE, 'https://api.openseat.app');
  const server = await buildServer({
    store, coord, search, alerts, allowedOrigins: [SITE], trustProxy: false,
    channels: ['email', 'telegram', 'whatsapp'],
    telegram: { bot: 'openseat_bot', webhookSecret: SECRET, notifier: { say: async (chat, text) => void said.push({ chat, text }) } },
    botCheck: opts.human === undefined ? undefined : { siteKey: 'site-key', check: { verify: async (t) => opts.human === true && t === 'ok' } },
  });
  return { server, store, alerts, sent, said };
}

const post = (s: Awaited<ReturnType<typeof app>>['server'], payload: object) =>
  s.inject({ method: 'POST', url: '/api/v1/alerts', headers: { origin: SITE }, payload });

const tg = (s: Awaited<ReturnType<typeof app>>['server'], text: string, secret = SECRET) =>
  s.inject({
    method: 'POST', url: '/api/v1/telegram/webhook', headers: { 'x-telegram-bot-api-secret-token': secret },
    payload: { message: { chat: { id: 555 }, text } },
  });

function openDay(date: string): DayResult {
  return {
    date, checkedAt: new Date().toISOString(),
    itineraries: [{
      key: 'EK1', ...route, date, hub: null, dep: '08:00', arr: '12:00', dayOffset: 0, durationMin: 480, layoverMin: 0,
      aircraft: 'A380-800', legs: [], separateTickets: false, currency: 'USD',
      cabins: {
        economy: { seats: 0, miles: null, tax: null, saver: true },
        premium: { seats: null, miles: null, tax: null, saver: false },
        business: { seats: 2, miles: 88500, tax: 400, saver: true },
        first: { seats: null, miles: null, tax: null, saver: false },
      },
    }],
  };
}

test('features list the channels and the bot check site key', async () => {
  const { server } = await app({ human: true });
  const r = await server.inject({ url: '/api/v1/features' });
  assert.deepEqual(r.json().channels, ['email', 'telegram', 'whatsapp']);
  assert.equal(r.json().telegramBot, 'openseat_bot');
  assert.equal(r.json().turnstileSiteKey, 'site-key');
  assert.deepEqual(r.json().currencies, ['USD', 'AED', 'SAR', 'QAR']);
});

test('WhatsApp numbers must be in international format', () => {
  const all = ['email', 'telegram', 'whatsapp'] as const;
  assert.equal(validateAlert({ ...body, channel: 'whatsapp', address: '+971 50 123 4567' }, [...all]).address, '+971501234567');
  assert.equal(validateAlert({ ...body, channel: 'whatsapp', address: '00966 55 123 4567' }, [...all]).address, '+966551234567');
  assert.throws(() => validateAlert({ ...body, channel: 'whatsapp', address: '050 123 4567' }, [...all]), ValidationError);
  assert.throws(() => validateAlert({ ...body, channel: 'whatsapp', address: '+971501234567' }), ValidationError, 'off unless enabled');
});

test('a Telegram alert waits for /start, then sends to that chat', async () => {
  const { server, store, alerts, sent, said } = await app();
  const r = await post(server, { ...body, channel: 'telegram' });
  assert.equal(r.statusCode, 201);
  const { id, link } = r.json();
  assert.equal(link, `https://t.me/openseat_bot?start=${id}`);

  // Not linked yet: nothing goes out.
  await alerts.check(route, [openDay(windowDates()[3])]);
  assert.equal(sent.length, 0);
  await store.updateAlertState(id, { open: false, sentToday: 0, sentDay: null });

  assert.equal((await tg(server, `/start ${id}`, 'wrong')).statusCode, 401);
  assert.equal((await tg(server, `/start ${id}`)).statusCode, 200);
  assert.match(said[0].text, /Alert on/);
  assert.equal(said[0].chat, '555');

  // The same link cannot be used again by someone else.
  await tg(server, `/start ${id}`);
  assert.match(said[1].text, /already been used/);

  await alerts.check(route, [openDay(windowDates()[4])]);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to.address, '555');
  assert.equal(sent[0].m.fields.origin, 'DXB');

  await tg(server, '/stop');
  assert.match(said[2].text, /All your alerts are off/);
  assert.equal((await store.alertsForRoute(route)).length, 0);
});

test('with the bot check on, alerts and refresh need a passing token', async () => {
  const { server } = await app({ human: true });
  const no = await post(server, { ...body, channel: 'email', address: 'a@example.com' });
  assert.equal(no.statusCode, 403);
  assert.equal(no.json().botCheck, true);
  const yes = await post(server, { ...body, channel: 'email', address: 'a@example.com', turnstileToken: 'ok' });
  assert.equal(yes.statusCode, 201);
  const refresh = await server.inject({ method: 'POST', url: '/api/v1/search/refresh', headers: { origin: SITE }, payload: { p: 'EK', o: 'DXB', d: 'LHR', n: 1 } });
  assert.equal(refresh.statusCode, 403);
});

test('alerts go to the notifier for their channel, and WhatsApp uses the template', async () => {
  const calls: { url: string; body: any }[] = [];
  const fake = (async (url: string, init?: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init?.body)) });
    return new Response('{}', { status: 200 });
  }) as typeof fetch;
  const wa = new WhatsAppNotifier({ token: 't', phoneId: '123', template: 'seat_alert', language: 'en' }, fake);
  const logged: string[] = [];
  const n = new ChannelNotifier({ whatsapp: wa }, { send: async (a) => void logged.push(a.channel) });
  assert.deepEqual(n.channels, ['email', 'whatsapp']);
  const fields = { cabin: 'Business', origin: 'DXB', destination: 'LHR', days: '2026-11-01', link: 'L', unsubscribe: 'U' };
  const alert = { channel: 'whatsapp', address: '+971501234567' } as AlertRow;
  await n.send(alert, { subject: 's', text: 't', fields });
  await n.send({ ...alert, channel: 'email' }, { subject: 's', text: 't', fields });
  assert.equal(calls[0].url, 'https://graph.facebook.com/v21.0/123/messages');
  assert.equal(calls[0].body.to, '971501234567');
  assert.equal(calls[0].body.template.name, 'seat_alert');
  assert.deepEqual(calls[0].body.template.components[0].parameters.map((p: { text: string }) => p.text), ['Business', 'DXB', 'LHR', '2026-11-01', 'L', 'U']);
  assert.deepEqual(logged, ['email']);
});
