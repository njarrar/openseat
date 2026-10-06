// Types for scripts/lang.mjs, so tests and the Vite config can import it.

export const LANG_DIR: string;
export const OUT_FILE: string;
export function readLangs(dir?: string): { langs: { code: string; name: string; dir: 'ltr' | 'rtl'; strings: Record<string, unknown> }[]; warnings: string[] };
export function buildLangs(opts?: { check?: boolean; quiet?: boolean }): { code: string; name: string; dir: 'ltr' | 'rtl' }[];
