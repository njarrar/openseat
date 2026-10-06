import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import { defineConfig, type Plugin } from 'vite';
import { buildLangs, LANG_DIR, readLangs } from '../../scripts/lang.mjs';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Builds lang/*.xml into src/i18n/lang-data.ts, and rebuilds it when a file
 * changes in dev. The script in each page's head gets the list of languages,
 * so it can pick one before first paint.
 */
function langs(): Plugin {
  let list = buildLangs();
  return {
    name: 'openseat-lang',
    buildStart() {
      list = buildLangs({ quiet: true });
    },
    transformIndexHtml(html) {
      if (html.includes('__OPENSEAT_BOT_CHECK__')) {
        // The bot check page is plain HTML with no bundle, so its two messages go in inline.
        const { langs: all } = readLangs();
        const en = all.find((l) => l.code === 'en')!;
        const pick = (l: (typeof all)[number], k: string) => (l.strings[k] ?? en.strings[k]) as string;
        html = html.replace('__OPENSEAT_BOT_CHECK__', JSON.stringify(Object.fromEntries(all.map((l) => [l.code, { dir: l.dir, ask: pick(l, 'botCheck.ask'), invalid: pick(l, 'botCheck.invalid') }]))));
      }
      return html.replace('__OPENSEAT_LANGS__', JSON.stringify(Object.fromEntries(list.map((l) => [l.code, l.dir]))));
    },
    configureServer(server) {
      server.watcher.add(LANG_DIR);
      server.watcher.on('change', (file) => {
        if (!file.startsWith(LANG_DIR) || !file.endsWith('.xml')) return;
        try {
          list = buildLangs();
        } catch (e) {
          server.config.logger.error(String((e as Error).message));
          return;
        }
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}

export default defineConfig({
  plugins: [langs(), preact()],
  resolve: {
    // Use the shared package's source so changes show up without a separate build.
    alias: { '@openseat/shared': r('../../packages/shared/src/index.ts') },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: { search: r('index.html'), how: r('how-to-use/index.html'), terms: r('terms/index.html'), appCheck: r('app-check/index.html') },
    },
  },
  server: { port: 5173 },
  test: { environment: 'node' },
} as any);
