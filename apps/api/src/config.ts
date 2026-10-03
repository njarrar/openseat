import type { CarrierId } from '@openseat/shared';

const list = (v: string | undefined) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
const num = (v: string | undefined, d: number) => (v && !Number.isNaN(Number(v)) ? Number(v) : d);

export type AdapterKind = 'mock' | 'none';

export interface Config {
  port: number;
  host: string;
  /** Postgres connection string. Without it the API keeps data in memory. */
  databaseUrl?: string;
  /** Redis connection string. Without it locks, rate limits and pub/sub stay in this process. */
  redisUrl?: string;
  /** Exact origins allowed to call the API from a browser. Never '*'. */
  allowedOrigins: string[];
  trustProxy: boolean;
  adapters: Record<CarrierId, AdapterKind>;
  /** Dates are fetched in blocks this size, one airline calendar request per block. */
  chunkDays: number;
  /** A day read longer ago than this is refreshed when someone searches. */
  staleAfterMin: number;
  scheduler: {
    enabled: boolean;
    /** Busy routes, refreshed every 2 to 4 hours. Format: EK:DXB:LHR */
    trunkRoutes: string[];
    trunkMaxAgeMin: number;
    alertMaxAgeMin: number;
    tickSec: number;
    routesPerTick: number;
  };
  smtp?: { url: string; from: string };
  publicUrl: string;
  /** Where this API is reached from outside, for links in emails. */
  apiPublicUrl: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const adapter = (id: CarrierId): AdapterKind => {
    const v = env[`ADAPTER_${id}`] ?? env.ADAPTER ?? 'mock';
    return v === 'none' ? 'none' : 'mock';
  };
  return {
    port: num(env.PORT, 8787),
    host: env.HOST ?? '0.0.0.0',
    databaseUrl: env.DATABASE_URL || undefined,
    redisUrl: env.REDIS_URL || undefined,
    allowedOrigins: list(env.ALLOWED_ORIGINS ?? 'http://localhost:5173'),
    trustProxy: env.TRUST_PROXY === 'true',
    adapters: { EK: adapter('EK'), EY: adapter('EY'), QR: adapter('QR') },
    chunkDays: num(env.CHUNK_DAYS, 15),
    staleAfterMin: num(env.STALE_AFTER_MIN, 360),
    scheduler: {
      enabled: env.SCHEDULER !== 'off',
      trunkRoutes: list(env.TRUNK_ROUTES ?? 'EK:DXB:LHR,EK:RUH:LHR,EK:JED:LHR,QR:DOH:LHR,QR:RUH:LHR,EY:AUH:LHR,EK:DXB:IST,EK:RUH:IST,QR:DOH:CDG,EK:DXB:CDG,EY:AUH:BKK,QR:DOH:NRT'),
      trunkMaxAgeMin: num(env.TRUNK_MAX_AGE_MIN, 180),
      alertMaxAgeMin: num(env.ALERT_MAX_AGE_MIN, 90),
      tickSec: num(env.SCHEDULER_TICK_SEC, 60),
      routesPerTick: num(env.SCHEDULER_ROUTES_PER_TICK, 2),
    },
    smtp: env.SMTP_URL ? { url: env.SMTP_URL, from: env.MAIL_FROM ?? 'openseat <alerts@openseat.app>' } : undefined,
    publicUrl: env.PUBLIC_URL ?? 'http://localhost:5173',
    apiPublicUrl: env.API_PUBLIC_URL ?? 'http://localhost:8787',
  };
}
