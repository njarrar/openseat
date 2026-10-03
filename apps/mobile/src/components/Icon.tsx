import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { StyleProp, TextStyle } from 'react-native';
import { useLang } from '../i18n';
import { LOOK } from '../theme';

// One name per meaning, drawn with each platform's usual icon set:
// SF-like Ionicons on iOS, Material icons on Android.
type Glyph = ['ion' | 'mi' | 'mci', string];

const ICONS = {
  back: { ios: ['ion', 'chevron-back'], android: ['mi', 'arrow-back'], flip: true },
  forward: { ios: ['ion', 'chevron-forward'], android: ['mi', 'chevron-right'], flip: true },
  prevDay: { ios: ['ion', 'chevron-up'], android: ['mi', 'chevron-left'], flip: true },
  nextDay: { ios: ['ion', 'chevron-down'], android: ['mi', 'chevron-right'], flip: true },
  takeoff: { ios: ['mi', 'flight-takeoff'], android: ['mi', 'flight-takeoff'], flip: true },
  land: { ios: ['mi', 'flight-land'], android: ['mi', 'flight-land'], flip: true },
  seat: { ios: ['mi', 'airline-seat-recline-normal'], android: ['mi', 'airline-seat-recline-normal'], flip: true },
  people: { ios: ['ion', 'people-outline'], android: ['mi', 'group'] },
  swap: { ios: ['ion', 'swap-horizontal'], android: ['mi', 'swap-vert'] },
  trip: { ios: ['ion', 'swap-horizontal'], android: ['mi', 'swap-horiz'] },
  bell: { ios: ['ion', 'notifications-outline'], android: ['mi', 'notifications-none'] },
  bellOn: { ios: ['ion', 'notifications'], android: ['mi', 'notifications-active'] },
  search: { ios: ['ion', 'search'], android: ['mi', 'search'] },
  settings: { ios: ['ion', 'settings-outline'], android: ['mi', 'settings'] },
  settingsOn: { ios: ['ion', 'settings'], android: ['mi', 'settings'] },
  check: { ios: ['ion', 'checkmark'], android: ['mi', 'check'] },
  close: { ios: ['ion', 'close'], android: ['mi', 'close'] },
  add: { ios: ['ion', 'add'], android: ['mi', 'add'] },
  remove: { ios: ['ion', 'remove'], android: ['mi', 'remove'] },
  external: { ios: ['mci', 'arrow-top-right'], android: ['mi', 'open-in-new'], flip: true },
  refresh: { ios: ['ion', 'refresh'], android: ['mi', 'refresh'] },
  share: { ios: ['ion', 'share-outline'], android: ['mi', 'share'] },
  help: { ios: ['ion', 'help-circle-outline'], android: ['mi', 'help-outline'] },
  doc: { ios: ['ion', 'document-text-outline'], android: ['mi', 'description'] },
  language: { ios: ['ion', 'language'], android: ['mi', 'translate'] },
  warning: { ios: ['ion', 'warning-outline'], android: ['mi', 'warning-amber'] },
  menu: { ios: ['ion', 'chevron-expand'], android: ['mi', 'arrow-drop-down'] },
  arrow: { ios: ['ion', 'arrow-forward'], android: ['mi', 'arrow-forward'] },
  info: { ios: ['ion', 'information-circle-outline'], android: ['mi', 'info-outline'] },
} satisfies Record<string, { ios: Glyph; android: Glyph; flip?: boolean }>;

export type IconName = keyof typeof ICONS;

interface Props {
  name: IconName;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle>;
}

export function Icon({ name, size = 20, color, style }: Props) {
  const { rtl } = useLang();
  const def: { ios: Glyph; android: Glyph; flip?: boolean } = ICONS[name];
  const [set, glyph] = def[LOOK];
  // Arrows and planes point the other way in right-to-left layout.
  const flip = rtl && def.flip ? { transform: [{ scaleX: -1 }] } : null;
  const p = { size, color, style: [flip, style], 'aria-hidden': true, importantForAccessibility: 'no-hide-descendants' as const };
  if (set === 'ion') return <Ionicons name={glyph as keyof typeof Ionicons.glyphMap} {...p} />;
  if (set === 'mci') return <MaterialCommunityIcons name={glyph as keyof typeof MaterialCommunityIcons.glyphMap} {...p} />;
  return <MaterialIcons name={glyph as keyof typeof MaterialIcons.glyphMap} {...p} />;
}
