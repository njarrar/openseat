/**
 * Cross-instance coordination: locks for request merging, pub/sub for passing
 * results to waiting requests, counters for listeners, and token buckets for
 * rate limits. Redis in production, in-process for development.
 */
export interface Coordinator {
  /** Take a lock if nobody holds it. Returns false when someone else does. */
  tryLock(key: string, owner: string, ttlMs: number): Promise<boolean>;
  unlock(key: string, owner: string): Promise<void>;
  publish(channel: string, message: string): Promise<void>;
  /** Resolves once the subscription is live. Call the returned function to leave. */
  subscribe(channel: string, onMessage: (message: string) => void): Promise<() => Promise<void>>;
  /** Add `by` to a counter that expires after `ttlMs` without changes. Returns the new value. */
  add(key: string, by: number, ttlMs: number): Promise<number>;
  count(key: string): Promise<number>;
  /** Simple key/value with expiry. */
  set(key: string, value: string, ttlMs: number): Promise<void>;
  get(key: string): Promise<string | null>;
  /** Take one token from a bucket that holds `capacity` and refills `perSec` a second. */
  take(key: string, capacity: number, perSec: number): Promise<{ ok: boolean; retryAfterSec: number }>;
  ping(): Promise<boolean>;
  close(): Promise<void>;
}
