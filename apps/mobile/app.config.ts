import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ExpoConfig } from 'expo/config';

// Every language in lang/*.xml, so the phone offers the app in each of them.
const LOCALES = readdirSync(join(__dirname, '../../lang')).filter((f) => f.endsWith('.xml')).map((f) => f.slice(0, -4));

// App identity, in one place. Change these before the first store upload:
// the bundle id and package name cannot change once an app is published.
const APP = {
  name: 'openseat',
  slug: 'openseat',
  scheme: 'openseat',
  version: '1.0.0',
  iosBundleId: 'app.openseat',
  androidPackage: 'app.openseat',
  // From `eas init`. Optional until you build with EAS.
  easProjectId: process.env.EAS_PROJECT_ID,
};

const GREEN = '#1d7a52';

const config: ExpoConfig = {
  name: APP.name,
  slug: APP.slug,
  scheme: APP.scheme,
  version: APP.version,
  orientation: 'default',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#f2f2f7',
  ios: {
    bundleIdentifier: APP.iosBundleId,
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: APP.androidPackage,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-foreground.png',
      monochromeImage: './assets/adaptive-monochrome.png',
      backgroundColor: GREEN,
    },
  },
  web: {
    output: 'single',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 120,
        backgroundColor: '#f3f3f1',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#0f1513' },
      },
    ],
    // The app mirrors its own layout for right-to-left languages, so the language
    // setting can switch at once without a restart. Native RTL stays off.
    ['expo-localization', { supportsRTL: false, supportedLocales: LOCALES }],
  ],
  extra: {
    ...(APP.easProjectId ? { eas: { projectId: APP.easProjectId } } : {}),
  },
};

export default config;
