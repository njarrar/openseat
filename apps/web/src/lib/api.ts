// Talks to the openseat API when VITE_API_URL is set. Without it, the site runs
// on built-in sample data in the browser, so it can be hosted as static files.

import { WINDOW_DAYS, gulfToday, mockDays, windowDates, type DayResult, type SearchEvent, type SearchParams } from '@openseat/shared';

export const API_URL: string = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const offline = !API_URL;

export interface StreamHandlers {
  onEvent: (e: SearchEvent) => void;
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

/**
 * Starts one search and returns a function that stops it. Every search gets
 * its own request id, so searches in other tabs never share progress or get
 * cancelled by each other. Closing the stream tells the server to stop work
 * nobody else is waiting for.
 */
export function openSearch(p: SearchParams, h: StreamHandlers): () => void {
  const requestId = newId();
  return offline ? mockStream(p, requestId, h) : sseStream(p, requestId, h);
}

function sseStream(p: SearchParams, requestId: string, h: StreamHandlers) {
  const qs = new URLSearchParams({ p: p.carrier, o: p.origin, d: p.destination, n: String(p.pax), request_id: requestId });
  const es = new EventSource(`${API_URL}/api/v1/search/stream?${qs}`);
  let finished = false;
  const types: SearchEvent['type'][] = ['meta', 'days', 'progress', 'error', 'done'];
  for (const type of types) {
    es.addEventListener(type, (ev) => {
      const data = JSON.parse((ev as MessageEvent).data) as SearchEvent;
      if (data.type === 'done') {
        finished = true;
        es.close();
      }
      h.onEvent(data);
    });
  }
  // EventSource reconnects on its own; a search is one-shot, so stop instead.
  es.onerror = () => {
    if (finished) return;
    finished = true;
    es.close();
    h.onEvent({ type: 'error', message: 'connection' });
    h.onEvent({ type: 'done' });
  };
  return () => {
    finished = true;
    es.close();
  };
}

// Offline mode: same event sequence as the API, with sample data.
const memory = new Map<string, Map<string, DayResult>>();

function mockStream(p: SearchParams, requestId: string, h: StreamHandlers) {
  const key = `${p.carrier}:${p.origin}:${p.destination}`;
  const dates = windowDates(new Date(), WINDOW_DAYS);
  const seen = memory.get(key) ?? new Map<string, DayResult>();
  memory.set(key, seen);
  const timers: number[] = [];
  let stopped = false;
  const emit = (e: SearchEvent) => !stopped && h.onEvent(e);

  emit({ type: 'meta', requestId, dates });
  const cached = dates.filter((d) => seen.has(d)).map((d) => seen.get(d)!);
  if (cached.length) emit({ type: 'days', days: cached, source: 'cache' });
  const missing = dates.filter((d) => !seen.has(d));
  const blocks: string[][] = [];
  for (let i = 0; i < missing.length; i += 15) blocks.push(missing.slice(i, i + 15));
  emit({ type: 'progress', done: 0, total: blocks.length });
  blocks.forEach((block, i) => {
    timers.push(window.setTimeout(() => {
      const days = mockDays(p, block, gulfToday());
      for (const d of days) seen.set(d.date, d);
      emit({ type: 'days', days, source: 'live' });
      emit({ type: 'progress', done: i + 1, total: blocks.length });
      if (i === blocks.length - 1) emit({ type: 'done' });
    }, 220 + i * 110));
  });
  if (!blocks.length) emit({ type: 'done' });
  return () => {
    stopped = true;
    timers.forEach(clearTimeout);
  };
}

export type RefreshResult = 'ok' | 'wait' | 'failed';

export async function requestRefresh(p: SearchParams): Promise<RefreshResult> {
  if (offline) {
    const key = `openseat-refresh:${p.carrier}:${p.origin}:${p.destination}`;
    const last = Number(sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last < 5 * 60000) return 'wait';
    sessionStorage.setItem(key, String(Date.now()));
    memory.delete(`${p.carrier}:${p.origin}:${p.destination}`);
    return 'ok';
  }
  try {
    const r = await fetch(`${API_URL}/api/v1/search/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ p: p.carrier, o: p.origin, d: p.destination, n: p.pax }),
    });
    return r.ok ? 'ok' : r.status === 429 ? 'wait' : 'failed';
  } catch {
    return 'failed';
  }
}
