// Colours from design/HANDOFF.md: iOS system colours with the openseat green,
// and a fixed Material 3 scheme on Android. Dark palettes come from the same
// green ramp as the website's dark mode.

import { Platform, useColorScheme } from 'react-native';

export type Look = 'ios' | 'android';

export interface Heat {
  bg: string;
  fg: string;
  bd: string;
}

export interface Theme {
  look: Look;
  dark: boolean;
  /** Screen background. */
  bg: string;
  /** Cards, grouped rows. */
  card: string;
  text: string;
  text2: string;
  text3: string;
  sep: string;
  tint: string;
  /** Soft tinted fill: Book button, step numbers. */
  tintFill: string;
  onTint: string;
  /** Segmented control track, stepper, grey capsules. */
  track: string;
  segOn: string;
  /** Material secondaryContainer: selected chips, tonal buttons. */
  chip: string;
  onChip: string;
  /** Material primaryContainer: step numbers on Android. */
  primaryContainer: string;
  onPrimaryContainer: string;
  outline: string;
  outlineVariant: string;
  past: string;
  heat: [Heat, Heat, Heat, Heat];
  /** Ring around the selected day: inner gap colour, outer ring colour. */
  ring: [string, string];
  fit: string;
  fitOnDark: string;
  sheet: string;
  grabber: string;
  scrim: string;
  snackBg: string;
  snackFg: string;
  snackAction: string;
  tabBar: string;
  glass: string;
  warn: string;
  warnBg: string;
  skeleton: string;
}

const iosLight: Theme = {
  look: 'ios', dark: false,
  bg: '#f2f2f7', card: '#ffffff', text: '#000000', text2: '#6e6e73', text3: '#8e8e93', sep: 'rgba(60,60,67,0.29)',
  tint: '#1d7a52', tintFill: 'rgba(29,122,82,0.12)', onTint: '#ffffff',
  track: 'rgba(118,118,128,0.12)', segOn: '#ffffff',
  chip: 'rgba(29,122,82,0.12)', onChip: '#1d7a52', primaryContainer: 'rgba(29,122,82,0.12)', onPrimaryContainer: '#1d7a52',
  outline: '#c4c4c7', outlineVariant: 'rgba(60,60,67,0.18)', past: '#c7c7cc',
  heat: [
    { bg: '#ffffff', fg: '#8e8e93', bd: 'rgba(60,60,67,0.18)' },
    { bg: '#d4ecdd', fg: '#0b2b1b', bd: '#8cc9a5' },
    { bg: '#5fb184', fg: '#06170e', bd: '#5fb184' },
    { bg: '#1b6a47', fg: '#ffffff', bd: '#1b6a47' },
  ],
  ring: ['#f2f2f7', '#000000'], fit: '#14201b', fitOnDark: '#ffffff',
  sheet: '#ffffff', grabber: '#d1d1d6', scrim: 'rgba(0,0,0,0.22)',
  snackBg: '#1c1c1e', snackFg: '#ffffff', snackAction: '#6fd3a0',
  tabBar: 'rgba(255,255,255,0.97)', glass: 'rgba(255,255,255,0.9)',
  warn: '#8a5a00', warnBg: '#fdf3dc', skeleton: '#e5e5ea',
};

const iosDark: Theme = {
  ...iosLight, dark: true,
  bg: '#000000', card: '#1c1c1e', text: '#ffffff', text2: 'rgba(235,235,245,0.6)', text3: 'rgba(235,235,245,0.3)', sep: 'rgba(84,84,88,0.6)',
  tint: '#4dbb88', tintFill: 'rgba(77,187,136,0.18)', onTint: '#0b1410',
  track: 'rgba(118,118,128,0.24)', segOn: '#636366',
  chip: 'rgba(77,187,136,0.18)', onChip: '#4dbb88', primaryContainer: 'rgba(77,187,136,0.18)', onPrimaryContainer: '#4dbb88',
  outline: '#48484a', outlineVariant: 'rgba(84,84,88,0.6)', past: '#3a3a3c',
  heat: [
    { bg: '#1c1c1e', fg: '#8e8e93', bd: 'rgba(84,84,88,0.6)' },
    { bg: '#183a2c', fg: '#e7eee9', bd: '#2d6e50' },
    { bg: '#2f8a5d', fg: '#f2f7f4', bd: '#2f8a5d' },
    { bg: '#74d3a2', fg: '#0b1410', bd: '#74d3a2' },
  ],
  ring: ['#000000', '#ffffff'], fit: '#e7eee9', fitOnDark: '#0b1410',
  sheet: '#1c1c1e', grabber: '#48484a', scrim: 'rgba(0,0,0,0.5)',
  snackBg: '#e7eee9', snackFg: '#0f1513', snackAction: '#1d7a52',
  tabBar: 'rgba(30,30,32,0.97)', glass: 'rgba(44,44,46,0.9)',
  warn: '#f1c46b', warnBg: '#2e2612', skeleton: '#2c2c2e',
};

const androidLight: Theme = {
  look: 'android', dark: false,
  bg: '#f6fbf3', card: '#eaefe8', text: '#171d19', text2: '#414942', text3: '#717971', sep: '#c1c9c0',
  tint: '#2b6a46', tintFill: '#d0e8d5', onTint: '#ffffff',
  track: '#dee4dd', segOn: '#d0e8d5',
  chip: '#d0e8d5', onChip: '#0b1f13', primaryContainer: '#b1f1c3', onPrimaryContainer: '#002110',
  outline: '#717971', outlineVariant: '#c1c9c0', past: '#c1c9c0',
  heat: [
    { bg: '#eaefe8', fg: '#717971', bd: '#c1c9c0' },
    { bg: '#c8ebd2', fg: '#002110', bd: '#8fd5a6' },
    { bg: '#7ccd98', fg: '#002110', bd: '#7ccd98' },
    { bg: '#2b6a46', fg: '#ffffff', bd: '#2b6a46' },
  ],
  ring: ['#f6fbf3', '#171d19'], fit: '#171d19', fitOnDark: '#ffffff',
  sheet: '#f0f5ee', grabber: 'rgba(65,73,66,0.4)', scrim: 'rgba(0,0,0,0.32)',
  snackBg: '#2c322d', snackFg: '#ecf2ea', snackAction: '#95d5ab',
  tabBar: '#eaefe8', glass: '#eaefe8',
  warn: '#7a5900', warnBg: '#ffdea6', skeleton: '#dee4dd',
};

const androidDark: Theme = {
  ...androidLight, dark: true,
  bg: '#0f1511', card: '#1b211d', text: '#dfe4dd', text2: '#c1c9c0', text3: '#8b938a', sep: '#414942',
  tint: '#95d5ab', tintFill: '#374b3d', onTint: '#003920',
  track: '#303631', segOn: '#374b3d',
  chip: '#374b3d', onChip: '#d0e8d5', primaryContainer: '#0f5130', onPrimaryContainer: '#b1f1c3',
  outline: '#8b938a', outlineVariant: '#414942', past: '#414942',
  heat: [
    { bg: '#1b211d', fg: '#8b938a', bd: '#414942' },
    { bg: '#183a2c', fg: '#dfe4dd', bd: '#2d6e50' },
    { bg: '#2f8a5d', fg: '#f2f7f4', bd: '#2f8a5d' },
    { bg: '#95d5ab', fg: '#003920', bd: '#95d5ab' },
  ],
  ring: ['#0f1511', '#dfe4dd'], fit: '#dfe4dd', fitOnDark: '#003920',
  sheet: '#171d19', grabber: 'rgba(193,201,192,0.4)', scrim: 'rgba(0,0,0,0.5)',
  snackBg: '#dfe4dd', snackFg: '#2c322d', snackAction: '#2b6a46',
  tabBar: '#1b211d', glass: '#1b211d',
  warn: '#f1c46b', warnBg: '#2e2612', skeleton: '#303631',
};

/**
 * iOS and Android each get their own look. The web build (used for previews)
 * shows the iOS look, or the Android one with ?look=android.
 */
function pickLook(): Look {
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'web' && typeof location !== 'undefined' && /[?&]look=android\b/.test(location.search)) return 'android';
  return 'ios';
}

export const LOOK: Look = pickLook();

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  if (LOOK === 'android') return dark ? androidDark : androidLight;
  return dark ? iosDark : iosLight;
}

export const level = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3);
export const countText = (n: number) => (n === 0 ? '' : n >= 4 ? '4+' : String(n));
