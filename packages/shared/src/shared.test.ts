import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, diffDays, gulfToday, isIsoDate, mockDays, summarise, weekday, windowDates } from './index.js';

test('date helpers stay on whole days', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-03-29', 1), '2026-03-30');
  assert.equal(diffDays('2026-10-03', '2027-01-01'), 90);
  assert.equal(weekday('2026-10-05'), 0); // a Monday
  assert.equal(isIsoDate('2026-02-30'), false);
});

test('the window starts on the Gulf date', () => {
  // 22:30 UTC is already the next day in Dubai.
  assert.equal(gulfToday(new Date('2026-10-03T22:30:00Z')), '2026-10-04');
  const w = windowDates(new Date('2026-10-03T08:00:00Z'));
  assert.equal(w.length, 90);
  assert.equal(w[0], '2026-10-03');
  assert.equal(w[89], '2026-12-31');
});

test('sample data is deterministic and well formed', () => {
  const now = new Date('2026-10-03T08:00:00Z');
  const dates = windowDates(now).slice(0, 5);
  const a = mockDays({ carrier: 'EK', origin: 'RUH', destination: 'LHR' }, dates, dates[0], now);
  const b = mockDays({ carrier: 'EK', origin: 'RUH', destination: 'LHR' }, dates, dates[0], now);
  assert.deepEqual(a, b);
  const it = a[0].itineraries[0];
  assert.equal(it.hub, 'DXB');
  assert.equal(it.legs.length, 2);
  assert.equal(it.currency, 'USD');
  for (const fare of Object.values(it.cabins)) {
    if (fare.seats === null) assert.equal(fare.miles, null);
    else assert.ok(fare.miles && fare.miles > 0);
  }
});

test('a day has seats only when one flight fits every traveller', () => {
  const day = {
    date: '2026-10-10', checkedAt: '',
    itineraries: [3, 1].map((seats, i) => ({
      key: 'X' + i, carrier: 'EK' as const, origin: 'DXB', destination: 'LHR', date: '2026-10-10', hub: null,
      dep: '08:00', arr: '12:00', dayOffset: 0, durationMin: 480, layoverMin: 0, aircraft: 'A380-800', legs: [],
      separateTickets: false, currency: 'USD',
      cabins: {
        economy: { seats, miles: 20000 + i * 1000, tax: 100, saver: true },
        premium: { seats: null, miles: null, tax: null, saver: false },
        business: { seats: 0, miles: 70000, tax: 300, saver: true },
        first: { seats: null, miles: null, tax: null, saver: false },
      },
    })),
  };
  const s2 = summarise(day, 2);
  assert.deepEqual(s2.economy, { count: 3, minMiles: 20000, qualifying: 1, offered: true });
  assert.equal(s2.business.count, 0);
  assert.equal(s2.business.offered, true);
  assert.equal(s2.first.offered, false);
  assert.equal(summarise(day, 4).economy.count, 0);
});

test('pegged currencies convert exactly and others are left alone', async () => {
  const { convert, currencyForLocale } = await import('./currency.js');
  assert.equal(convert(100, 'USD', 'SAR'), 375);
  assert.equal(Math.round(convert(367.25, 'AED', 'USD')!), 100);
  assert.equal(convert(10, 'EUR', 'USD'), null);
  assert.equal(currencyForLocale('ar-SA'), 'SAR');
  assert.equal(currencyForLocale('en-AE'), 'AED');
  assert.equal(currencyForLocale('en'), 'USD');
});
