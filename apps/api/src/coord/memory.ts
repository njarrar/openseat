import { EventEmitter } from 'node:events';
import type { Coordinator } from './types.js';

interface Entry {
  value: string;
  expires: number;
}

/** Single-process coordinator. Correct for one API instance only. */
export class MemoryCoordinator implements Coordinator {
  private kv = new Map<string, Entry>();
  private bus = new EventEmitter().setMaxListeners(0);
  private buckets = new Map<string, { tokens: number; at: number }>();

  private live(key: string) {
    const e = this.kv.get(key);
    if (!e) return null;
    if (e.expires <= Date.now()) {
      this.kv.delete(key);
      return null;
    }
    return e;
  }

  async tryLock(key: string, owner: string, ttlMs: number) {
    if (this.live(key)) return false;
    this.kv.set(key, { value: owner, expires: Date.now() + ttlMs });
    return true;
  }

  async unlock(key: string, owner: string) {
    if (this.live(key)?.value === owner) this.kv.delete(key);
  }

  async publish(channel: string, message: string) {
    // Deliver on the next tick, as a network round trip would.
    queueMicrotask(() => this.bus.emit(channel, message));
  }

  async subscribe(channel: string, onMessage: (m: string) => void) {
    this.bus.on(channel, onMessage);
    return async () => {
      this.bus.off(channel, onMessage);
    };
  }

  async add(key: string, by: number, ttlMs: number) {
    const n = Number(this.live(key)?.value ?? 0) + by;
    this.kv.set(key, { value: String(n), expires: Date.now() + ttlMs });
    return n;
  }

  async count(key: string) {
    return Number(this.live(key)?.value ?? 0);
  }

  async set(key: string, value: string, ttlMs: number) {
    this.kv.set(key, { value, expires: Date.now() + ttlMs });
  }

  async get(key: string) {
    return this.live(key)?.value ?? null;
  }

  async take(key: string, capacity: number, perSec: number) {
    const now = Date.now();
    const b = this.buckets.get(key) ?? { tokens: capacity, at: now };
    b.tokens = Math.min(capacity, b.tokens + ((now - b.at) / 1000) * perSec);
    b.at = now;
    const ok = b.tokens >= 1;
    if (ok) b.tokens -= 1;
    this.buckets.set(key, b);
    return { ok, retryAfterSec: ok ? 0 : Math.ceil((1 - b.tokens) / perSec) };
  }

  async ping() {
    return true;
  }

  async close() {
    this.bus.removeAllListeners();
  }
}
