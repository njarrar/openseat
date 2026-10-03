import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SeatsAeroAdapter, toDays } from './seatsaero.js';

const route = { carrier: 'EK' as const, origin: 'DXB', destination: 'LHR' };
const dates = ['2026-11-01', '2026-11-02', '2026-11-03'];

const seg = (n: string, from: string, to: string, dep: string, arr: string, aircraft: string, distance: number, order: number) => ({
  FlightNumber: n, OriginAirport: from, DestinationAirport: to, DepartsAt: dep, ArrivesAt: arr, AircraftName: aircraft, Distance: distance, Order: order,
});

const rows = [
  {
    Date: '2026-11-01',
    UpdatedAt: '2026-10-31T20:00:00Z',
    AvailabilityTrips: [
      {
        Cabin: 'business', FlightNumbers: 'EK1', Stops: 0, TotalDuration: 460, RemainingSeats: 2, MileageCost: 88500,
        TotalTaxes: 41250, TaxesCurrency: 'usd', OriginAirport: 'DXB', DestinationAirport: 'LHR',
        DepartsAt: '2026-11-01T07:45:00Z', ArrivesAt: '2026-11-01T11:25:00Z',
        AvailabilitySegments: [seg('EK1', 'DXB', 'LHR', '2026-11-01T07:45:00Z', '2026-11-01T11:25:00Z', 'Airbus A380', 3414, 0)],
      },
      {
        Cabin: 'economy', FlightNumbers: 'EK1', Stops: 0, TotalDuration: 460, RemainingSeats: 0, MileageCost: 30000,
        TotalTaxes: 20000, TaxesCurrency: 'USD', OriginAirport: 'DXB', DestinationAirport: 'LHR',
        DepartsAt: '2026-11-01T07:45:00Z', ArrivesAt: '2026-11-01T11:25:00Z',
      },
      {
        Cabin: 'first', FlightNumbers: 'EK2, EK29', Stops: 1, TotalDuration: 900, RemainingSeats: 1, MileageCost: 136250,
        TotalTaxes: 60000, TaxesCurrency: 'USD', OriginAirport: 'DXB', DestinationAirport: 'LHR',
        DepartsAt: '2026-11-01T22:00:00Z', ArrivesAt: '2026-11-02T09:00:00Z',
        AvailabilitySegments: [
          seg('EK29', 'DXB', 'MAN', '2026-11-01T22:00:00Z', '2026-11-02T02:30:00Z', 'Boeing 777', 3500, 0),
          seg('EK2', 'MAN', 'LHR', '2026-11-02T05:00:00Z', '2026-11-02T09:00:00Z', 'Airbus A350', 150, 1),
        ],
      },
      // Another route in the same reply is ignored.
      { Cabin: 'business', FlightNumbers: 'EK3', Stops: 0, TotalDuration: 460, RemainingSeats: 4, MileageCost: 1, TotalTaxes: 0, OriginAirport: 'DXB', DestinationAirport: 'LGW', DepartsAt: '2026-11-01T09:00:00Z', ArrivesAt: '2026-11-01T13:00:00Z' },
    ],
  },
];

test('rows become one day per requested date, with flights merged across cabins', () => {
  const now = new Date('2026-11-01T00:00:00Z');
  const days = toDays(route, dates, rows, now);
  assert.deepEqual(days.map((d) => d.date), dates);
  assert.equal(days[1].itineraries.length, 0);
  assert.equal(days[1].checkedAt, now.toISOString());

  const [nonstop, connect] = days[0].itineraries;
  assert.equal(days[0].checkedAt, '2026-10-31T20:00:00.000Z');
  assert.equal(nonstop.key, 'EK1');
  assert.equal(nonstop.hub, null);
  assert.equal(nonstop.aircraft, 'Airbus A380');
  assert.deepEqual(nonstop.cabins.business, { seats: 2, miles: 88500, tax: 413, saver: true });
  assert.equal(nonstop.cabins.economy.seats, 1, 'unknown count still means one seat');
  assert.equal(nonstop.cabins.first.seats, null);

  assert.equal(connect.key, 'EK29-EK2');
  assert.equal(connect.hub, 'MAN');
  assert.equal(connect.layoverMin, 150);
  assert.equal(connect.dayOffset, 1);
  assert.equal(connect.aircraft, 'Boeing 777');
  assert.deepEqual(connect.legs.map((l) => l.flight), ['EK29', 'EK2']);
});

test('the adapter asks for one block with trips, follows pages and sends the key', async () => {
  const calls: { url: URL; key: string | null }[] = [];
  const fake = (async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    calls.push({ url, key: new Headers(init?.headers).get('Partner-Authorization') });
    const first = !url.searchParams.has('cursor');
    return new Response(JSON.stringify({ data: first ? rows : [], hasMore: first, cursor: 42 }), { status: 200 });
  }) as typeof fetch;
  const a = new SeatsAeroAdapter({ apiKey: 'k', fetch: fake });
  const days = await a.fetchDays(route, dates, new AbortController().signal);
  assert.equal(days.length, 3);
  assert.equal(calls.length, 2);
  const q = calls[0].url.searchParams;
  assert.equal(calls[0].key, 'k');
  assert.equal(q.get('sources'), 'emirates');
  assert.equal(q.get('start_date'), '2026-11-01');
  assert.equal(q.get('end_date'), '2026-11-03');
  assert.equal(q.get('include_trips'), 'true');
  assert.equal(calls[1].url.searchParams.get('cursor'), '42');
});

test('errors and missing sources are reported, not hidden', async () => {
  const fail = (async () => new Response('no', { status: 401 })) as unknown as typeof fetch;
  await assert.rejects(new SeatsAeroAdapter({ apiKey: 'k', fetch: fail }).fetchDays(route, dates, new AbortController().signal), /401/);
  const a = new SeatsAeroAdapter({ apiKey: 'k' });
  assert.equal(a.supports('QR'), false);
  await assert.rejects(a.fetchDays({ ...route, carrier: 'QR' }, dates, new AbortController().signal), /no source/);
});
