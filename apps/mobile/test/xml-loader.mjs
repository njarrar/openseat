// Node test runs read an .xml import as its text, as Metro does for the app.
// tsx may load the app code as CommonJS or as ES modules, so both are covered.
import { readFileSync } from 'node:fs';
import { createRequire, register } from 'node:module';

const require = createRequire(import.meta.url);
require.extensions['.xml'] = (module, filename) => {
  module.exports = { __esModule: true, default: readFileSync(filename, 'utf8') };
};

register('data:text/javascript,' + encodeURIComponent(`
import { readFile } from 'node:fs/promises';
export async function load(url, context, next) {
  if (!url.endsWith('.xml')) return next(url, context);
  const text = await readFile(new URL(url), 'utf8');
  return { format: 'module', source: 'export default ' + JSON.stringify(text) + ';', shortCircuit: true };
}
`));
