import { Redis } from 'ioredis';
import type { Coordinator } from './types.js';

const UNLOCK = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`;

const ADD = `
local n = redis.call('incrby', KEYS[1], ARGV[1])
redis.call('pexpire', KEYS[1], ARGV[2])
return n`;

// Token bucket kept in a hash: tokens and last refill time in ms.
const TAKE = `
local cap = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local b = redis.call('hmget', KEYS[1], 't', 'a')
local tokens = tonumber(b[1]) or cap
local at = tonumber(b[2]) or now
tokens = math.min(cap, tokens + (now - at) / 1000 * rate)
local ok = 0
if tokens >= 1 then tokens = tokens - 1 ok = 1 end
redis.call('hset', KEYS[1], 't', tokens, 'a', now)
redis.call('pexpire', KEYS[1], math.ceil(cap / rate * 1000) + 1000)
local wait = 0
if ok == 0 then wait = math.ceil((1 - tokens) / rate) end
return {ok, wait}`;

export class RedisCoordinator implements Coordinator {
  private cmd: Redis;
  private sub: Redis;
  private handlers = new Map<string, Set<(m: string) => void>>();

  constructor(url: string) {
    this.cmd = new Redis(url, { maxRetriesPerRequest: 2 });
    // Pub/sub needs its own connection.
    this.sub = new Redis(url, { maxRetriesPerRequest: 2 });
    this.sub.on('message', (channel: string, message: string) => {
      for (const h of this.handlers.get(channel) ?? []) h(message);
    });
  }

  async tryLock(key: string, owner: string, ttlMs: number) {
    return (await this.cmd.set(key, owner, 'PX', ttlMs, 'NX')) === 'OK';
  }

  async unlock(key: string, owner: string) {
    await this.cmd.eval(UNLOCK, 1, key, owner);
  }

  async publish(channel: string, message: string) {
    await this.cmd.publish(channel, message);
  }

  async subscribe(channel: string, onMessage: (m: string) => void) {
    let set = this.handlers.get(channel);
    if (!set) {
      set = new Set();
      this.handlers.set(channel, set);
      await this.sub.subscribe(channel);
    }
    set.add(onMessage);
    return async () => {
      const s = this.handlers.get(channel);
      if (!s) return;
      s.delete(onMessage);
      if (s.size === 0) {
        this.handlers.delete(channel);
        await this.sub.unsubscribe(channel);
      }
    };
  }

  async add(key: string, by: number, ttlMs: number) {
    return Number(await this.cmd.eval(ADD, 1, key, by, ttlMs));
  }

  async count(key: string) {
    return Number((await this.cmd.get(key)) ?? 0);
  }

  async set(key: string, value: string, ttlMs: number) {
    await this.cmd.set(key, value, 'PX', ttlMs);
  }

  async get(key: string) {
    return this.cmd.get(key);
  }

  async take(key: string, capacity: number, perSec: number) {
    const [ok, wait] = (await this.cmd.eval(TAKE, 1, key, capacity, perSec, Date.now())) as [number, number];
    return { ok: ok === 1, retryAfterSec: wait };
  }

  async ping() {
    try {
      return (await this.cmd.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async close() {
    this.sub.disconnect();
    this.cmd.disconnect();
  }
}
