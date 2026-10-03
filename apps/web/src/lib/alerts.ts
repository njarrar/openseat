import type { AlertChannel, AlertRequest } from '@openseat/shared';
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

export function savedAddress(channel: AlertChannel): string {
  try {
    return localStorage.getItem(channel === 'email' ? EMAIL : `openseat-${channel}`) ?? '';
  } catch {
    return '';
  }
}

export type TurnOnResult = { ok: true; link?: string } | { ok: false; robot?: boolean };

export async function turnOn(req: AlertRequest, turnstileToken?: string): Promise<TurnOnResult> {
  try {
    if (req.address) localStorage.setItem(req.channel === 'email' ? EMAIL : `openseat-${req.channel}`, req.address);
  } catch {
    /* storage blocked */
  }
  let saved: Saved & { link?: string } = { id: 'local', token: 'local' };
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
  write({ ...read(), [alertKey(req)]: { id: saved.id, token: saved.token } });
  return { ok: true, link: saved.link };
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
