import type { AlertRequest } from '@openseat/shared';
import { API_URL, offline } from './api';

// Alerts you turned on in this browser, keyed by program, route and cabin.
// The id and token let you turn an alert off again.
const KEY = 'openseat-alerts';
const EMAIL = 'openseat-email';

interface Saved {
  id: string;
  token: string;
}

function read(): Record<string, Saved> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

function write(v: Record<string, Saved>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* storage blocked */
  }
}

export const alertKey = (a: Pick<AlertRequest, 'carrier' | 'origin' | 'destination' | 'cabin'>) => `${a.carrier}-${a.origin}-${a.destination}-${a.cabin}`;

export const watchedKeys = () => new Set(Object.keys(read()));

export function savedEmail(): string {
  try {
    return localStorage.getItem(EMAIL) ?? '';
  } catch {
    return '';
  }
}

export async function turnOn(req: AlertRequest): Promise<boolean> {
  try {
    localStorage.setItem(EMAIL, req.address);
  } catch {
    /* storage blocked */
  }
  let saved: Saved = { id: 'local', token: 'local' };
  if (!offline) {
    try {
      const r = await fetch(`${API_URL}/api/v1/alerts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(req) });
      if (!r.ok) return false;
      saved = await r.json();
    } catch {
      return false;
    }
  }
  write({ ...read(), [alertKey(req)]: saved });
  return true;
}

export async function turnOff(key: string): Promise<boolean> {
  const all = read();
  const saved = all[key];
  if (saved && !offline && saved.id !== 'local') {
    try {
      const r = await fetch(`${API_URL}/api/v1/alerts/${saved.id}`, { method: 'DELETE', headers: { 'x-alert-token': saved.token } });
      if (!r.ok && r.status !== 404) return false;
    } catch {
      return false;
    }
  }
  delete all[key];
  write(all);
  return true;
}
