import { buildAdapters } from './adapters/index.js';
import { ChannelNotifier, EmailNotifier, TelegramNotifier, WhatsAppNotifier } from './alerts/notifier.js';
import { AlertService } from './alerts/service.js';
import { loadConfig } from './config.js';
import { MemoryCoordinator } from './coord/memory.js';
import { RedisCoordinator } from './coord/redis.js';
import { migrate } from './db/migrate.js';
import { buildServer } from './http/server.js';
import { TurnstileCheck } from './http/turnstile.js';
import { Scheduler } from './scheduler.js';
import { SearchService } from './search/service.js';
import { MemoryStore } from './store/memory.js';
import { PostgresStore } from './store/postgres.js';

const config = loadConfig();

if (config.databaseUrl) await migrate(config.databaseUrl, (m) => console.log(`[db] ${m}`));
const store = config.databaseUrl ? new PostgresStore(config.databaseUrl) : new MemoryStore();
const coord = config.redisUrl ? new RedisCoordinator(config.redisUrl) : new MemoryCoordinator();
if (!config.databaseUrl) console.warn('[api] DATABASE_URL not set, keeping data in memory');
if (!config.redisUrl) console.warn('[api] REDIS_URL not set, locks and rate limits work for this process only');

const search = new SearchService(store, coord, buildAdapters(config.adapters, undefined, config.seatsAero), {
  chunkDays: config.chunkDays,
  staleAfterMin: config.staleAfterMin,
});
const telegram = config.telegram ? new TelegramNotifier(config.telegram.token) : undefined;
const notifier = new ChannelNotifier({
  email: config.smtp ? new EmailNotifier(config.smtp.url, config.smtp.from) : undefined,
  telegram,
  whatsapp: config.whatsapp ? new WhatsAppNotifier(config.whatsapp) : undefined,
});
const alerts = new AlertService(store, notifier, config.publicUrl, config.apiPublicUrl);
search.afterRefresh = (route, days) => alerts.check(route, days);

const app = await buildServer({
  store, coord, search, alerts, allowedOrigins: config.allowedOrigins, trustProxy: config.trustProxy, logger: true,
  channels: notifier.channels,
  telegram: config.telegram && telegram ? { bot: config.telegram.bot, webhookSecret: config.telegram.webhookSecret, notifier: telegram } : undefined,
  botCheck: config.turnstile ? { check: new TurnstileCheck(config.turnstile.secret), siteKey: config.turnstile.siteKey } : undefined,
});
const scheduler = new Scheduler(store, coord, search, config.scheduler, (m) => app.log.info(`[scheduler] ${m}`));

await app.listen({ port: config.port, host: config.host });
if (config.scheduler.enabled) scheduler.start();

const shutdown = async () => {
  scheduler.stop();
  await app.close();
  await store.close();
  await coord.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
