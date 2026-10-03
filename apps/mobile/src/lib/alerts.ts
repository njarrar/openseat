// Alerts turned on from this device, keyed by program, route and cabin.
// The id and token returned by the API are the only way to turn an alert off
// again, so they are kept here with the route for the Alerts tab.

import type { AlertChannel, AlertRequest } from '@openseat/shared';
import { API_URL, offline } from './config';
import { load, save } from './storage';

const KEY = 'openseat-alerts';
// The last address used for each channel, to fill the form next time.
const addressKey = (c: AlertChannel) => (c === 'email' ? 'openseat-email' : `openseat-${c}`);

export interface SavedAlert extends AlertRequest {
  id: string;
  token: string;
}

export type AlertMap = Record<string, SavedAlert>;

export const alertKey = (a: Pick<AlertRequest, 'carrier' | 'origin' | 'destination' | 'cabin'>) => `${a.carrier}-${a.origin}-${a.destination}-${a.cabin}`;

export const loadAlerts = async () => (await load<AlertMap>(KEY)) ?? {};
export const savedAddress = async (c: AlertChannel) => (await load<string>(addressKey(c))) ?? '';

/**
 * The new list on success, plus the bot link for Telegram, which still needs a
 * tap on Start. robot is set when the API turned down the bot check.
 */
export type TurnOnResult = { ok: true; all: AlertMap; link?: string } | { ok: false; robot?: boolean };

/** Creates the alert on the server and remembers it. */
export async function turnOn(req: AlertRequest, turnstileToken?: string): Promise<TurnOnResult> {
  if (req.address) await save(addressKey(req.channel), req.address);
  let saved: { id: string; token: string; link?: string } = { id: 'local', token: 'local' };
  if (!offline) {
    try {
      const r = await fetch(`${API_URL}/api/v1/alerts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...req, ...(turnstileToken ? { turnstileToken } : {}) }),
      });
      if (!r.ok) return { ok: false, robot: r.status === 403 };
      saved = await r.json();
    } catch {
      return { ok: false };
    }
  }
  const all = { ...(await loadAlerts()), [alertKey(req)]: { ...req, id: saved.id, token: saved.token } };
  await save(KEY, all);
  return { ok: true, all, link: saved.link };
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
