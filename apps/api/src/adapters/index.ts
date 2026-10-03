import { gulfToday, mockDays, type CarrierId } from '@openseat/shared';
import type { AdapterKind, Config } from '../config.js';
import type { Route } from '../store/types.js';
import { SeatsAeroAdapter } from './seatsaero.js';
import { AdapterUnavailableError, type CarrierAdapter } from './types.js';

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      reject(signal.reason);
    }, { once: true });
  });

/** Sample data with a short delay per block, so streaming behaves as it will with a real source. */
export class MockAdapter implements CarrierAdapter {
  readonly name = 'mock';
  constructor(private delayMs = 250) {}

  async fetchDays(route: Route, dates: string[], signal: AbortSignal) {
    await sleep(this.delayMs, signal);
    return mockDays(route, dates, gulfToday(), new Date()).map((d) => ({ ...d, checkedAt: new Date().toISOString() }));
  }
}

/** Placeholder until a permitted data source is plugged in for this carrier. */
export class UnconfiguredAdapter implements CarrierAdapter {
  readonly name = 'none';
  constructor(private carrier: CarrierId) {}

  async fetchDays(): Promise<never> {
    throw new AdapterUnavailableError(this.carrier);
  }
}

export function buildAdapters(
  kinds: Record<CarrierId, AdapterKind>,
  mockDelayMs?: number,
  seatsAero?: Config['seatsAero'],
): Record<CarrierId, CarrierAdapter> {
  const aero = seatsAero ? new SeatsAeroAdapter(seatsAero) : null;
  const make = (id: CarrierId): CarrierAdapter => {
    if (kinds[id] === 'mock') return new MockAdapter(mockDelayMs);
    if (kinds[id] === 'seatsaero') {
      if (!aero) throw new Error(`ADAPTER_${id}=seatsaero needs SEATS_AERO_API_KEY`);
      if (!aero.supports(id)) throw new Error(`Set SEATS_AERO_SOURCE_${id} to use seats.aero for ${id}`);
      return aero;
    }
    return new UnconfiguredAdapter(id);
  };
  return { EK: make('EK'), EY: make('EY'), QR: make('QR') };
}
