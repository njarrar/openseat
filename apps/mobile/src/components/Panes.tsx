import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLang } from '../i18n';
import { useTopCleared } from '../lib/useSize';
import { useTheme } from '../theme';

/**
 * Tablet layout from the design handoff: search, calendar and day side by
 * side. iPad puts the calendar in a light glass panel; Android puts the side
 * day pane on a tinted surface. Without a day pane, the calendar takes the rest.
 */
export function Panes({ search, calendar, day }: { search: ReactNode; calendar: ReactNode; day: ReactNode | null }) {
  const th = useTheme();
  const { rtl } = useLang();
  const insets = useSafeAreaInsets();
  const cleared = useTopCleared();
  const ios = th.look === 'ios';
  const side: ViewStyle = ios
    ? { borderRadius: 30 }
    : { borderRadius: 16, backgroundColor: th.dark ? 'rgba(255,255,255,0.04)' : 'rgba(29,122,82,0.05)' };
  const main: ViewStyle = ios
    ? { borderRadius: 30, backgroundColor: th.dark ? 'rgba(44,44,46,0.9)' : 'rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }
    : { borderRadius: 16 };
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        gap: ios ? 20 : 16,
        paddingTop: (cleared ? 0 : insets.top) + (ios ? 8 : 16),
        paddingBottom: insets.bottom + 16,
        paddingStart: ios ? 24 : 0,
        paddingEnd: ios ? 24 : 16,
        backgroundColor: th.bg,
        direction: rtl ? 'rtl' : 'ltr',
      }}
    >
      {/* Android fields cut their label out of the page colour, so the search pane stays on it. */}
      <View style={[{ width: day ? 330 : 320, overflow: 'hidden' }, ios ? side : null]}>{search}</View>
      <View style={[{ flex: 1, overflow: 'hidden' }, main]}>{calendar}</View>
      {day && <View style={[{ width: 370, overflow: 'hidden' }, side]}>{day}</View>}
    </View>
  );
}
