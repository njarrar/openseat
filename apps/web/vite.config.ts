import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [preact()],
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
