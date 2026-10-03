import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { checkPageUrl, tokenFrom } from './address';
import { WEB_URL } from './config';
import { features } from './features';

// The API can ask for a Cloudflare Turnstile token before it saves an alert or
// refreshes a route. The apps have no web view, so they open a small page on
// the website in the system browser sheet. The page runs the check and sends
// the token back through the app link (openseat://check?token=...).

export type Human = { ok: true; token?: string } | { ok: false };

/** A token when the API asks for one; ok with no token when it does not. */
export async function human(lang: string): Promise<Human> {
  const { turnstileSiteKey } = await features();
  if (!turnstileSiteKey) return { ok: true };
  if (!WEB_URL) return { ok: false };
  const back = Linking.createURL('check');
  try {
    const r = await WebBrowser.openAuthSessionAsync(checkPageUrl(WEB_URL, turnstileSiteKey, back, lang), back);
    const token = r.type === 'success' ? tokenFrom(r.url) : null;
    return token ? { ok: true, token } : { ok: false };
  } catch {
    return { ok: false };
  }
}
