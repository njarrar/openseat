// Talks to the openseat API when EXPO_PUBLIC_API_URL is set. Without it, the
// app runs on built-in sample data, like the website's offline mode.

import { WINDOW_DAYS, gulfToday, mockDays, windowDates, type DayResult, type SearchEvent, type SearchParams } from '@openseat/shared';
import { API_URL, offline } from './config';
import { SseParser, toSearchEvent } from './sse';

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
 * its own request id, so two searches never share progress or cancel each
 * other. Stopping closes the connection, which tells the server to drop work
 * nobody else is waiting for.
 */
export function openSearch(p: SearchParams, h: StreamHandlers): () => void {
  const requestId = newId();
  return offline ? mockStream(p, requestId, h) : apiStream(p, requestId, h);
}

/** The parts of XMLHttpRequest the reader uses, so tests can pass a fake. */
export interface XhrLike {
  open(method: string, url: string): void;
  setRequestHeader(name: string, value: string): void;
  send(): void;
  abort(): void;
  readonly responseText: string;
  readonly status: number;
  onprogress: (() => void) | null;
  onload: (() => void) | null;
  onerror: (() => void) | null;
}

/**
 * Reads a server-sent event stream with XMLHttpRequest. React Native has no
 * EventSource, but its XHR reports the response text as it grows, which is
 * all an event stream needs. Calls `onEnd` once, when the stream closes or fails.
 */
export function readEventStream(
  url: string,
  onMessage: (event: string, data: string) => void,
  onEnd: (ok: boolean) => void,
  makeXhr: () => XhrLike = () => new XMLHttpRequest() as unknown as XhrLike,
): () => void {
  const xhr = makeXhr();
  const parser = new SseParser();
  let seen = 0;
  let ended = false;
  const read = () => {
    const text = xhr.responseText ?? '';
    if (text.length <= seen) return;
    const chunk = text.slice(seen);
    seen = text.length;
    for (const m of parser.push(chunk)) {
      if (ended) return;
      onMessage(m.event, m.data);
    }
  };
  const end = (ok: boolean) => {
    if (ended) return;
    ended = true;
    onEnd(ok);
  };
  // Handlers go on before send(): React Native only streams progress to them if they exist then.
  xhr.onprogress = read;
  xhr.onload = () => {
    read();
    end(xhr.status >= 200 && xhr.status < 300);
  };
  xhr.onerror = () => end(false);
  xhr.open('GET', url);
  // Accept is the only header: anything else makes the browser ask the API for CORS permission first.
  xhr.setRequestHeader('Accept', 'text/event-stream');
  xhr.send();
  return () => {
    ended = true;
    xhr.abort();
  };
}

function apiStream(p: SearchParams, requestId: string, h: StreamHandlers) {
  const qs = `p=${p.carrier}&o=${p.origin}&d=${p.destination}&n=${p.pax}&request_id=${requestId}`;
  let finished = false;
  const stop = readEventStream(
    `${API_URL}/api/v1/search/stream?${qs}`,
    (event, data) => {
      const e = toSearchEvent({ event, data });
      if (!e || finished) return;
      if (e.type === 'done') finished = true;
      h.onEvent(e);
    },
    () => {
      // The stream closed without `done`: a dropped connection or a refused request.
      if (finished) return;
      finished = true;
      h.onEvent({ type: 'error', message: 'connection' });
      h.onEvent({ type: 'done' });
    },
  );
  return () => {
    finished = true;
    stop();
  };
}

// Offline mode: same event sequence as the API, with sample data.
const memory = new Map<string, Map<string, DayResult>>();

function mockStream(p: SearchParams, requestId: string, h: StreamHandlers) {
  const key = `${p.carrier}:${p.origin}:${p.destination}`;
  const dates = windowDates(new Date(), WINDOW_DAYS);
  const seen = memory.get(key) ?? new Map<string, DayResult>();
  memory.set(key, seen);
  const timers: ReturnType<typeof setTimeout>[] = [];
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
    timers.push(setTimeout(() => {
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

const lastRefresh = new Map<string, number>();

export async function requestRefresh(p: SearchParams, turnstileToken?: string): Promise<RefreshResult> {
  if (offline) {
    const key = `${p.carrier}:${p.origin}:${p.destination}`;
    if (Date.now() - (lastRefresh.get(key) ?? 0) < 5 * 60000) return 'wait';
    lastRefresh.set(key, Date.now());
    memory.delete(key);
    return 'ok';
  }
  try {
    const r = await fetch(`${API_URL}/api/v1/search/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ p: p.carrier, o: p.origin, d: p.destination, n: p.pax, ...(turnstileToken ? { turnstileToken } : {}) }),
    });
    return r.ok ? 'ok' : r.status === 429 ? 'wait' : 'failed';
  } catch {
    return 'failed';
  }
}
