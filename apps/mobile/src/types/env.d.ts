/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_WEB_URL?: string;
  }
}

/** The language files in languages/, loaded as text (see metro.config.js). */
declare module '*.xml' {
  const text: string;
  export default text;
}
