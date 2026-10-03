import type { DayResult } from '@openseat/shared';
import type { Route } from '../store/types.js';

/**
 * Reads reward availability for one carrier.
 *
 * Contract:
 * - `dates` is a block of consecutive days (CHUNK_DAYS, 15 by default). Use the
 *   source's month or calendar view and make one request per block, then only
 *   ask for flight detail on days that show seats. Never one request per day.
 * - Return every requested date, including days with no flights, so the store
 *   can tell "read, nothing there" from "never read".
 * - Only return connections the source sells as one booking. If you stitch two
 *   awards together yourself, set `separateTickets: true`.
 * - Stop promptly when `signal` aborts: nobody is waiting for the result.
 * - Use sources you are permitted to use (an official or partner API, or a
 *   licensed data provider). Do not work around bot protection or log in with
 *   member accounts the airline has not authorised for this.
 */
export interface CarrierAdapter {
  readonly name: string;
  fetchDays(route: Route, dates: string[], signal: AbortSignal): Promise<DayResult[]>;
}

export class AdapterUnavailableError extends Error {
  constructor(carrier: string) {
    super(`No data source is configured for ${carrier}`);
    this.name = 'AdapterUnavailableError';
  }
}
