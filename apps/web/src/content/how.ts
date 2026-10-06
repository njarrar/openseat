// The worked examples on the How to use page. The website and the mobile app
// both read them. Their titles and tips are in lang/*.xml (examples.list), in
// the same order.

import type { CabinId, CarrierId } from '@openseat/shared';

export interface Example {
  q: { carrier: CarrierId; cabin: CabinId; pax: number; from: string; to: string; ret: number };
}

export const EXAMPLES: Example[] = [
  { q: { carrier: 'EK', cabin: 'economy', pax: 4, from: 'DXB', to: 'LHR', ret: 14 } },
  { q: { carrier: 'EY', cabin: 'business', pax: 1, from: 'AUH', to: 'BKK', ret: 0 } },
  { q: { carrier: 'QR', cabin: 'first', pax: 2, from: 'DOH', to: 'NRT', ret: 0 } },
  { q: { carrier: 'EK', cabin: 'business', pax: 1, from: 'RUH', to: 'LHR', ret: 0 } },
];
