import { test } from 'node:test';
import assert from 'node:assert/strict';
import { windowDates, type DayResult } from '@openseat/shared';
import { MemoryStore } from '../store/memory.js';
import type { AlertRow } from '../store/types.js';
import { AlertService, MAX_PER_DAY, ValidationError, validateAlert } from './service.js';

const route = { carrier: 'EK' as const, origin: 'DXB', destination: 'LHR' };

function day(date: string, businessSeats: number): DayResult {
  return {
    date, checkedAt: new Date().toISOString(),
    itineraries: [{
      key: 'EK1', ...route, date, hub: null, dep: '08:00', arr: '12:00', dayOffset: 0, durationMin: 480, layoverMin: 0,
      aircraft: 'A380-800', legs: [], separateTickets: false, currency: 'USD',
      cabins: {
        economy: { seats: 4, miles: 30000, tax: 200, saver: true },
        premium: { seats: null, miles: null, tax: null, saver: false },
        business: { seats: businessSeats, miles: 88500, tax: 400, saver: true },
        first: { seats: null, miles: null, tax: null, saver: false },
      },
    }],
  };
}

function setup() {
  const store = new MemoryStore();
  const sent: { to: AlertRow; subject: string; text: string }[] = [];
  const service = new AlertService(store, { send: async (to, m) => void sent.push({ to, ...m }) }, 'https://openseat.app', 'https://api.openseat.app');
  return { store, sent, service };
}

const request = { ...route, cabin: 'business' as const, pax: 2, channel: 'email' as const, address: 'traveller@example.com' };

test('validation rejects bad input', () => {
  assert.throws(() => validateAlert({ ...request, address: 'nope' }), ValidationError);
  assert.throws(() => validateAlert({ ...request, destination: 'DXB' }), ValidationError);
  assert.throws(() => validateAlert({ ...request, channel: 'telegram' }), ValidationError);
  assert.throws(() => validateAlert({ ...request, pax: 7 }), ValidationError);
  assert.equal(validateAlert({ ...request, address: ' Traveller@Example.com ' }).address, 'traveller@example.com');
});

test('an alert fires once when seats open, then waits for them to close', async () => {
  const { store, sent, service } = setup();
  const [d0, d1] = windowDates();
  await store.putDays(route, [day(d0, 0), day(d1, 0)]);
  await service.create(request);

  await service.check(route, [day(d1, 1)]); // one seat is not enough for two
  assert.equal(sent.length, 0);

  await service.check(route, [day(d1, 2)]);
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /Business seats open: DXB to LHR/);
  assert.match(sent[0].text, /unsubscribe\?token=/);

  await service.check(route, [day(d1, 3)]); // still open, no repeat
  assert.equal(sent.length, 1);
});

test(`no more than ${MAX_PER_DAY} emails a day`, async () => {
  const { sent, service } = setup();
  const [d0] = windowDates();
  await service.create(request);
  for (let i = 0; i < 4; i++) {
    await service.check(route, [day(d0, 2)]);
    await service.check(route, [day(d0, 0)]);
  }
  assert.equal(sent.length, MAX_PER_DAY);
});
