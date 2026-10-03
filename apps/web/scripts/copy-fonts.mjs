// Copies the font subsets we use into public/fonts with stable names, so the
// HTML can preload them. Runs before dev and build.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'fonts');
mkdirSync(out, { recursive: true });

const pkg = (name) => dirname(require.resolve(`${name}/package.json`));
const files = [
  ['@fontsource-variable/hanken-grotesk', 'hanken-grotesk-latin-wght-normal.woff2', 'hanken-grotesk-latin.woff2'],
  ['@fontsource/dm-mono', 'dm-mono-latin-400-normal.woff2', 'dm-mono-latin-400.woff2'],
  ['@fontsource/dm-mono', 'dm-mono-latin-500-normal.woff2', 'dm-mono-latin-500.woff2'],
  ...[400, 500, 600, 700].map((w) => ['@fontsource/ibm-plex-sans-arabic', `ibm-plex-sans-arabic-arabic-${w}-normal.woff2`, `ibm-plex-sans-arabic-${w}.woff2`]),
];
for (const [name, file, as] of files) copyFileSync(join(pkg(name), 'files', file), join(out, as));
console.log(`copied ${files.length} fonts to public/fonts`);
