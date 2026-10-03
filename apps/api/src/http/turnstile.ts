// Cloudflare Turnstile: a bot check on actions that send messages or cost a
// fresh read. Off unless TURNSTILE_SECRET is set.

export interface BotCheck {
  verify(token: string, ip: string): Promise<boolean>;
}

export class TurnstileCheck implements BotCheck {
  constructor(private secret: string, private fetchImpl: typeof fetch = globalThis.fetch) {}

  async verify(token: string, ip: string) {
    if (!token || token.length > 2048) return false;
    try {
      const r = await this.fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ secret: this.secret, response: token, remoteip: ip }),
        signal: AbortSignal.timeout(5000),
      });
      const body = (await r.json()) as { success?: boolean };
      return body.success === true;
    } catch {
      // If Cloudflare cannot be reached we fail closed: the action is refused, not let through.
      return false;
    }
  }
}
