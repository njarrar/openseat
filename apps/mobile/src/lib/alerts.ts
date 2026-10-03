// Email alerts turned on from this device, keyed by program, route and cabin.
// The id and token returned by the API are the only way to turn an alert off
// again, so they are kept here with the route for the Alerts tab.
//
// Only email exists today. Other channels can be added to AlertRequest and the
// form in app/alert.tsx without touching the rest of the app.

import type { AlertRequest } from '@openseat/shared';
import { API_URL, offline } from './config';
import { load, save } from './storage';

const KEY = 'openseat-alerts';
const EMAIL = 'openseat-email';

export interface SavedAlert extends AlertRequest {
  id: string;
  token: string;
}

export type AlertMap = Record<string, SavedAlert>;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const alertKey = (a: Pick<AlertRequest, 'carrier' | 'origin' | 'destination' | 'cabin'>) => `${a.carrier}-${a.origin}-${a.destination}-${a.cabin}`;

export const loadAlerts = async () => (await load<AlertMap>(KEY)) ?? {};
export const savedEmail = async () => (await load<string>(EMAIL)) ?? '';

/** Creates the alert on the server and remembers it. Returns the new list, or null on failure. */
export async function turnOn(req: AlertRequest): Promise<AlertMap | null> {
  await save(EMAIL, req.address);
  let ids = { id: 'local', token: 'local' };
  if (!offline) {
    try {
      const r = await fetch(`${API_URL}/api/v1/alerts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(req) });
      if (!r.ok) return null;
      ids = await r.json();
    } catch {
      return null;
    }
  }
  const all = { ...(await loadAlerts()), [alertKey(req)]: { ...req, ...ids } };
  await save(KEY, all);
  return all;
}

/** Removes the alert on the server and here. Returns the new list, or null on failure. */
export async function turnOff(key: string): Promise<AlertMap | null> {
  const all = { ...(await loadAlerts()) };
  const saved = all[key];
  if (saved && !offline && saved.id !== 'local') {
    try {
      const r = await fetch(`${API_URL}/api/v1/alerts/${saved.id}`, { method: 'DELETE', headers: { 'x-alert-token': saved.token } });
      if (!r.ok && r.status !== 404) return null;
    } catch {
      return null;
    }
  }
  delete all[key];
  await save(KEY, all);
  return all;
}
