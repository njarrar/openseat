interface ImportMetaEnv { readonly VITE_API_URL?: string; readonly VITE_SAMPLE_DATA?: string }

/** The language files in languages/, loaded as text (see vite.config.ts). */
declare module '*.xml' {
  const text: string;
  export default text;
}
