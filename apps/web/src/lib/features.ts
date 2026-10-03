import { CURRENCIES, type AlertChannel, type CurrencyId } from '@openseat/shared';
import { API_URL, offline } from './api';

// What the API offers: alert channels, the Telegram bot and the bot check key.
// Asked once per page. Sample-data mode offers email only.

export interface Features {
  channels: AlertChannel[];
  telegramBot: string | null;
  turnstileSiteKey: string | null;
  currencies: CurrencyId[];
}

const BASIC: Features = { channels: ['email'], telegramBot: null, turnstileSiteKey: null, currencies: CURRENCIES };

let pending: Promise<Features> | null = null;

export function features(): Promise<Features> {
  if (offline) return Promise.resolve(BASIC);
  pending ??= fetch(`${API_URL}/api/v1/features`)
    .then((r) => (r.ok ? r.json() : BASIC))
    .then((f: Partial<Features>) => ({ ...BASIC, ...f, channels: f.channels?.length ? f.channels : BASIC.channels }))
    .catch(() => BASIC);
  return pending;
}
