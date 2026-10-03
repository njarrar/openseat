// A small server-sent events parser. React Native has no EventSource, so the
// app reads the stream as text and feeds it here in whatever pieces arrive.
// Follows the event-stream format: lines end in \n, \r\n or \r, a blank line
// ends an event, lines starting with ':' are comments.

import type { SearchEvent } from '@openseat/shared';

export interface SseMessage {
  event: string;
  data: string;
  id?: string;
}

export class SseParser {
  private buf = '';
  private event = '';
  private data: string[] = [];
  private id: string | undefined;

  /** Add the next piece of the stream. Returns every event it completed. */
  push(chunk: string): SseMessage[] {
    this.buf += chunk;
    const out: SseMessage[] = [];
    let start = 0;
    for (let i = 0; i < this.buf.length; i++) {
      const c = this.buf[i];
      if (c !== '\n' && c !== '\r') continue;
      // A \r at the very end may be the first half of \r\n; wait for more.
      if (c === '\r' && i === this.buf.length - 1) break;
      this.line(this.buf.slice(start, i), out);
      if (c === '\r' && this.buf[i + 1] === '\n') i++;
      start = i + 1;
    }
    this.buf = this.buf.slice(start);
    return out;
  }

  private line(line: string, out: SseMessage[]) {
    if (line === '') {
      if (this.data.length) out.push({ event: this.event || 'message', data: this.data.join('\n'), ...(this.id !== undefined ? { id: this.id } : {}) });
      this.event = '';
      this.data = [];
      return;
    }
    if (line.startsWith(':')) return;
    const colon = line.indexOf(':');
    const field = colon < 0 ? line : line.slice(0, colon);
    let value = colon < 0 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'event') this.event = value;
    else if (field === 'data') this.data.push(value);
    else if (field === 'id') this.id = value;
  }
}

const TYPES = new Set<SearchEvent['type']>(['meta', 'days', 'progress', 'error', 'done']);

/** Turns one stream message into a search event, or null if it is not one. */
export function toSearchEvent(m: SseMessage): SearchEvent | null {
  if (!TYPES.has(m.event as SearchEvent['type'])) return null;
  try {
    const data = JSON.parse(m.data);
    return data && typeof data === 'object' && data.type === m.event ? (data as SearchEvent) : null;
  } catch {
    return null;
  }
}
