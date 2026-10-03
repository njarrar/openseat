import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SseParser, toSearchEvent } from '../src/lib/sse';
import { readEventStream, type XhrLike } from '../src/lib/stream';

const frame = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

describe('SseParser', () => {
  it('reads the events the API sends', () => {
    const p = new SseParser();
    const out = p.push(frame('meta', { type: 'meta', requestId: 'r1', dates: ['2026-10-03'] }) + frame('done', { type: 'done' }));
    assert.deepEqual(out.map((m) => m.event), ['meta', 'done']);
    assert.deepEqual(JSON.parse(out[0].data).dates, ['2026-10-03']);
  });

  it('joins events split across any number of chunks', () => {
    const text = frame('progress', { type: 'progress', done: 1, total: 6 }) + frame('done', { type: 'done' });
    for (const size of [1, 2, 3, 7, 50]) {
      const p = new SseParser();
      const got = [];
      for (let i = 0; i < text.length; i += size) got.push(...p.push(text.slice(i, i + size)));
      assert.deepEqual(got.map((m) => m.event), ['progress', 'done'], `chunk size ${size}`);
      assert.equal(JSON.parse(got[0].data).total, 6);
    }
  });

  it('handles \\r\\n and \\r line endings, even split between chunks', () => {
    // A \r at the end of a chunk may be half of \r\n, so its line waits for the next chunk.
    const p = new SseParser();
    const got = [...p.push('event: a\r'), ...p.push('\ndata: 1\r\n\r'), ...p.push('\nevent: b\rdata: 2\r\r'), ...p.push('event: c\n')];
    assert.deepEqual(got, [{ event: 'a', data: '1' }, { event: 'b', data: '2' }]);
  });

  it('skips comments and keeps multi-line data', () => {
    const p = new SseParser();
    const got = p.push(': keep-alive\n\ndata: one\ndata: two\nid: 7\n\n');
    assert.deepEqual(got, [{ event: 'message', data: 'one\ntwo', id: '7' }]);
  });

  it('does not emit an event until its blank line arrives', () => {
    const p = new SseParser();
    assert.deepEqual(p.push('event: done\ndata: {"type":"done"}\n'), []);
    assert.equal(p.push('\n').length, 1);
  });
});

describe('toSearchEvent', () => {
  it('accepts known events whose data matches the name', () => {
    assert.deepEqual(toSearchEvent({ event: 'progress', data: '{"type":"progress","done":2,"total":6}' }), { type: 'progress', done: 2, total: 6 });
  });
  it('drops unknown names, mismatches and bad JSON', () => {
    assert.equal(toSearchEvent({ event: 'message', data: '{"type":"message"}' }), null);
    assert.equal(toSearchEvent({ event: 'days', data: '{"type":"done"}' }), null);
    assert.equal(toSearchEvent({ event: 'done', data: '{oops' }), null);
  });
});

/** A stand-in for XMLHttpRequest that lets a test feed the response text. */
class FakeXhr implements XhrLike {
  responseText = '';
  status = 0;
  onprogress: (() => void) | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  url = '';
  headers: Record<string, string> = {};
  aborted = false;
  sent = false;
  open(_m: string, url: string) {
    this.url = url;
  }
  setRequestHeader(k: string, v: string) {
    this.headers[k] = v;
  }
  send() {
    this.sent = true;
  }
  abort() {
    this.aborted = true;
  }
  feed(s: string) {
    this.responseText += s;
    this.status = 200;
    this.onprogress?.();
  }
}

describe('readEventStream', () => {
  it('reads the response as it grows and ends once', () => {
    const xhr = new FakeXhr();
    const got: string[] = [];
    const ends: boolean[] = [];
    readEventStream('https://api.test/stream', (e, d) => got.push(`${e}:${d}`), (ok) => ends.push(ok), () => xhr);
    assert.equal(xhr.headers.Accept, 'text/event-stream');
    assert.ok(xhr.onprogress, 'progress handler set before send');
    xhr.feed('event: meta\ndata: 1\n');
    assert.deepEqual(got, []);
    xhr.feed('\nevent: done\nda');
    xhr.feed('ta: 2\n\n');
    xhr.onload?.();
    xhr.onerror?.();
    assert.deepEqual(got, ['meta:1', 'done:2']);
    assert.deepEqual(ends, [true]);
  });

  it('stops delivering after it is cancelled', () => {
    const xhr = new FakeXhr();
    const got: string[] = [];
    const stop = readEventStream('u', (e) => got.push(e), () => got.push('end'), () => xhr);
    xhr.feed('event: a\ndata: 1\n\n');
    stop();
    xhr.feed('event: b\ndata: 2\n\n');
    xhr.onload?.();
    assert.deepEqual(got, ['a']);
    assert.ok(xhr.aborted);
  });

  it('reports a failed connection', () => {
    const xhr = new FakeXhr();
    const ends: boolean[] = [];
    readEventStream('u', () => {}, (ok) => ends.push(ok), () => xhr);
    xhr.onerror?.();
    assert.deepEqual(ends, [false]);
  });
});
