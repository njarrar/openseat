// Cloudflare Turnstile, loaded only when the API asks for a bot check. Most
// people never see it; it shows a small box only when it needs a click.

interface Turnstile {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  execute(id: string): void;
  reset(id: string): void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let script: Promise<Turnstile> | null = null;

function load(): Promise<Turnstile> {
  script ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')));
    s.onerror = () => {
      script = null;
      reject(new Error('turnstile'));
    };
    document.head.appendChild(s);
  });
  return script;
}

/** A fresh single-use token, or '' when the check could not run. */
export async function botToken(siteKey: string, lang: string): Promise<string> {
  try {
    const ts = await load();
    const slot = document.createElement('div');
    slot.className = 'turnstile-slot';
    document.body.appendChild(slot);
    return await new Promise<string>((resolve) => {
      const done = (token: string) => {
        slot.remove();
        resolve(token);
      };
      const id = ts.render(slot, {
        sitekey: siteKey,
        language: lang,
        appearance: 'interaction-only',
        execution: 'execute',
        callback: (token: string) => done(token),
        'error-callback': () => done(''),
        'timeout-callback': () => done(''),
      });
      ts.execute(id);
    });
  } catch {
    return '';
  }
}
