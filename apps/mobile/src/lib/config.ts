// Build-time settings. Expo inlines EXPO_PUBLIC_* variables when it bundles.

const trim = (v: string | undefined) => (v ?? '').trim().replace(/\/$/, '');

/** The openseat API. Empty means the app runs on built-in sample data. */
export const API_URL = trim(process.env.EXPO_PUBLIC_API_URL);
export const offline = !API_URL;

/** The website, used for shared links. Empty hides the Share button. */
export const WEB_URL = trim(process.env.EXPO_PUBLIC_WEB_URL);
