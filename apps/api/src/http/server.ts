import { createHash, randomUUID } from 'node:crypto';
import cors from '@fastify/cors';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import {
  AIRPORTS, CABINS, CARRIERS, CURRENCIES, MAX_PAX, WINDOW_DAYS, isAirport, isCarrier,
  type AlertChannel, type SearchEvent, type SearchParams,
} from '@openseat/shared';
import { AlertService, ValidationError, validateAlert } from '../alerts/service.js';
import type { TelegramNotifier } from '../alerts/notifier.js';
import type { Coordinator } from '../coord/types.js';
import type { SearchService } from '../search/service.js';
import { routeId, type InventoryStore } from '../store/types.js';
import type { BotCheck } from './turnstile.js';

export interface ServerDeps {
  store: InventoryStore;
  coord: Coordinator;
  search: SearchService;
  alerts: AlertService;
  allowedOrigins: string[];
  trustProxy: boolean;
  logger?: boolean;
  /** Alert channels people can pick. Email only when not given. */
  channels?: AlertChannel[];
  telegram?: { bot: string; webhookSecret: string; notifier: Pick<TelegramNotifier, 'say'> };
  /** Bot check for alerts and refresh. The site key is public and goes to clients. */
  botCheck?: { check: BotCheck; siteKey: string };
}

const REFERENCE = { windowDays: WINDOW_DAYS, carriers: CARRIERS, cabins: CABINS, airports: AIRPORTS };
const REFERENCE_JSON = JSON.stringify(REFERENCE);
const REFERENCE_ETAG = '"' + createHash('sha1').update(REFERENCE_JSON).digest('hex').slice(0, 16) + '"';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseSearch(q: Record<string, unknown>): SearchParams | null {
  const pax = Number(q.n ?? 1);
  if (!isCarrier(q.p) || !isAirport(q.o) || !isAirport(q.d) || q.o === q.d) return null;
  if (!Number.isInteger(pax) || pax < 1 || pax > MAX_PAX) return null;
  return { carrier: q.p, origin: q.o, destination: q.d, pax };
}

export async function buildServer(deps: ServerDeps) {
  const app = Fastify({ logger: deps.logger ?? false, trustProxy: deps.trustProxy, bodyLimit: 8 * 1024 });
  const allowed = new Set(deps.allowedOrigins);

  // Browsers may only call the API from our own sites, never from any origin.
  await app.register(cors, {
    origin: (origin, cb) => cb(null, !origin || allowed.has(origin)),
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['content-type', 'x-alert-token'],
    maxAge: 600,
  });

  app.addHook('onSend', async (_req, reply) => {
    reply.header('x-content-type-options', 'nosniff');
    reply.header('referrer-policy', 'strict-origin-when-cross-origin');
    reply.header('x-frame-options', 'DENY');
    if (!reply.hasHeader('cache-control')) reply.header('cache-control', 'no-store');
  });

  /** Reject cross-site browser calls even when CORS headers would be ignored (for example EventSource). */
  const originOk = (req: FastifyRequest) => !req.headers.origin || allowed.has(req.headers.origin);

  const limit = async (req: FastifyRequest, reply: FastifyReply, name: string, capacity: number, perSec: number) => {
    const r = await deps.coord.take(`rl:${name}:${req.ip}`, capacity, perSec);
    if (!r.ok) {
      reply.header('retry-after', String(r.retryAfterSec)).code(429).send({ error: 'Too many requests. Try again shortly.' });
      return false;
    }
    return true;
  };

  /** True when the bot check passed, or is off. Sends the 403 itself otherwise. */
  const human = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!deps.botCheck) return true;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const token = String(body.turnstileToken ?? req.headers['cf-turnstile-response'] ?? '');
    if (await deps.botCheck.check.verify(token, req.ip)) return true;
    reply.code(403).send({ error: 'Please confirm you are not a robot and try again.', botCheck: true });
    return false;
  };

  const channels = deps.channels ?? ['email'];

  // What this server offers, so the website and apps can show only what works.
  app.get('/api/v1/features', async (_req, reply) => {
    reply.header('cache-control', 'public, max-age=300');
    return {
      channels,
      telegramBot: deps.telegram?.bot ?? null,
      turnstileSiteKey: deps.botCheck?.siteKey ?? null,
      currencies: CURRENCIES,
    };
  });

  app.get('/api/v1/health', async () => ({ ok: true, store: await deps.store.ping(), coord: await deps.coord.ping() }));

  // Reference data for apps. Cached, revalidated by ETag, never marked immutable.
  app.get('/api/v1/reference', async (req, reply) => {
    reply.header('etag', REFERENCE_ETAG).header('cache-control', 'public, max-age=3600, stale-while-revalidate=86400');
    if (req.headers['if-none-match'] === REFERENCE_ETAG) return reply.code(304).send();
    reply.type('application/json').send(REFERENCE_JSON);
  });

  app.get('/api/v1/search/stream', async (req, reply) => {
    if (!originOk(req)) return reply.code(403).send({ error: 'Origin not allowed' });
    const q = req.query as Record<string, string>;
    const params = parseSearch(q);
    if (!params) return reply.code(400).send({ error: 'Invalid search' });
    // One id per search, made by the client. Progress and cancelling belong to
    // this request only, so two tabs never interfere with each other.
    const requestId = UUID.test(q.request_id ?? '') ? q.request_id : randomUUID();
    if (!(await limit(req, reply, 'search', 30, 0.25))) return;

    reply.hijack();
    const res = reply.raw;
    const origin = req.headers.origin;
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
      'x-content-type-options': 'nosniff',
      ...(origin && allowed.has(origin) ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}),
    });
    const ac = new AbortController();
    req.raw.on('close', () => ac.abort());
    const send = (e: SearchEvent) => {
      if (!res.writableEnded) res.write(`event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`);
    };
    const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 15000);
    try {
      await deps.search.stream(params, requestId, send, ac.signal);
    } catch (e) {
      req.log.error(e);
      send({ type: 'error', message: 'Search failed' });
    } finally {
      clearInterval(heartbeat);
      res.end();
    }
  });

  // Ask for a fresh read of a route. Limited per visitor and per route.
  app.post('/api/v1/search/refresh', async (req, reply) => {
    if (!originOk(req)) return reply.code(403).send({ error: 'Origin not allowed' });
    const params = parseSearch((req.body ?? {}) as Record<string, unknown>);
    if (!params) return reply.code(400).send({ error: 'Invalid route' });
    if (!(await limit(req, reply, 'refresh', 3, 1 / 200))) return;
    if (!(await human(req, reply))) return;
    const id = routeId({ carrier: params.carrier, origin: params.origin, destination: params.destination });
    if (!(await deps.coord.tryLock(`cooldown:${id}`, '1', 5 * 60000))) {
      return reply.header('retry-after', '300').code(429).send({ error: 'This route was refreshed a few minutes ago.' });
    }
    await deps.search.forceRefresh(params);
    return { ok: true };
  });

  app.post('/api/v1/alerts', async (req, reply) => {
    if (!originOk(req)) return reply.code(403).send({ error: 'Origin not allowed' });
    if (!(await limit(req, reply, 'alerts', 10, 1 / 60))) return;
    if (!(await human(req, reply))) return;
    try {
      const a = await deps.alerts.create(validateAlert(req.body, channels));
      // Telegram alerts start once the person opens the bot with this link.
      const link = a.channel === 'telegram' && deps.telegram ? `https://t.me/${deps.telegram.bot}?start=${a.id}` : undefined;
      return reply.code(201).send({ id: a.id, token: a.token, ...(link ? { link } : {}) });
    } catch (e) {
      if (e instanceof ValidationError) return reply.code(400).send({ error: e.message });
      throw e;
    }
  });

  app.delete('/api/v1/alerts/:id', async (req, reply) => {
    if (!originOk(req)) return reply.code(403).send({ error: 'Origin not allowed' });
    const { id } = req.params as { id: string };
    const token = String(req.headers['x-alert-token'] ?? '');
    if (!UUID.test(id) || !token) return reply.code(400).send({ error: 'Missing alert id or token' });
    const ok = await deps.store.deleteAlert(id, token);
    return ok ? reply.code(204).send() : reply.code(404).send({ error: 'Alert not found' });
  });

  // Link in every alert email.
  app.get('/api/v1/alerts/unsubscribe', async (req, reply) => {
    const token = String((req.query as Record<string, string>).token ?? '');
    const ok = token ? await deps.store.unsubscribe(token) : false;
    reply.type('text/html; charset=utf-8').send(
      `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>openseat</title>` +
        `<body style="font:16px/1.6 system-ui,sans-serif;max-width:40ch;margin:15vh auto;padding:0 20px;color:#14201b;background:#f3f3f1">` +
        `<p>${ok ? 'Your alert is off. You will not get more emails about it.' : 'This alert was already turned off.'}</p></body>`,
    );
  });

  // Telegram calls this for every message to the bot. The secret header proves it is Telegram.
  if (deps.telegram) {
    const tg = deps.telegram;
    app.post('/api/v1/telegram/webhook', async (req, reply) => {
      if (req.headers['x-telegram-bot-api-secret-token'] !== tg.webhookSecret) return reply.code(401).send();
      const msg = (req.body as { message?: { chat?: { id?: number }; text?: string } })?.message;
      const chat = msg?.chat?.id;
      const text = (msg?.text ?? '').trim();
      if (!chat) return reply.send({ ok: true });
      const chatId = String(chat);
      try {
        const start = /^\/start\s+([0-9a-f-]{36})$/i.exec(text);
        if (start && UUID.test(start[1])) {
          const a = await deps.store.linkAlert(start[1], 'telegram', chatId);
          await tg.notifier.say(chatId, a
            ? `Alert on. We will message you here when ${a.cabin} seats open from ${a.origin} to ${a.destination}, at most twice a day. Send /stop to turn off all your alerts.`
            : 'This alert link has already been used or has expired. Turn the alert on again from the site.');
        } else if (/^\/stop\b/i.test(text)) {
          const n = await deps.store.removeByAddress('telegram', chatId);
          await tg.notifier.say(chatId, n ? 'All your alerts are off.' : 'You have no alerts on.');
        } else {
          await tg.notifier.say(chatId, 'Turn on an alert from the openseat site, then tap the Telegram link it shows. Send /stop to turn off all your alerts.');
        }
      } catch (e) {
        req.log.error(e);
      }
      // Always 200, or Telegram keeps retrying the same message.
      return reply.send({ ok: true });
    });
  }

  return app;
}
