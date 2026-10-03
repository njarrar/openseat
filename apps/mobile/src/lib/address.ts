// Checks for the address an alert goes to. Kept free of React Native so the
// tests can run them, and the same rules as the website and the API.

import type { AlertChannel } from '@openseat/shared';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^\+[1-9]\d{7,14}$/;

/** Drops spaces, dots, dashes and brackets, and turns a leading 00 into +. */
export const cleanPhone = (v: string) => v.replace(/[\s().-]/g, '').replace(/^00/, '+');

/** The address to send, or null when it is not valid. Telegram needs none: the bot learns the chat. */
export function checkAddress(channel: AlertChannel, value: string): string | null {
  if (channel === 'telegram') return '';
  const v = channel === 'whatsapp' ? cleanPhone(value) : value.trim();
  return (channel === 'whatsapp' ? PHONE_RE : EMAIL_RE).test(v) ? v : null;
}

/** The website page that runs the bot check and sends the token back to `back`. */
export function checkPageUrl(web: string, siteKey: string, back: string, lang: string) {
  return `${web}/app-check/?${new URLSearchParams({ k: siteKey, to: back, lang })}`;
}

/** The token from the link the check page sent back, or null. */
export function tokenFrom(url: string | undefined): string | null {
  const q = url?.split('?')[1];
  return q ? new URLSearchParams(q.split('#')[0]).get('token') || null : null;
}
