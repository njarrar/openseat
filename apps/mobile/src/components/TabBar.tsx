import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLang } from '../i18n';
import { LOOK, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';
import { Txt } from './ui';

const TABS: Record<string, { icon: IconName; iconOn: IconName; label: 'search' | 'alerts' | 'settings' }> = {
  '(search)': { icon: 'search', iconOn: 'search', label: 'search' },
  alerts: { icon: 'bell', iconOn: 'bellOn', label: 'alerts' },
  settings: { icon: 'settings', iconOn: 'settingsOn', label: 'settings' },
};

/** Room the floating iOS tab bar takes over the content. On Android the bar sits below it. */
export const TAB_SPACE = LOOK === 'ios' ? 96 : 0;

/** iOS: a floating capsule over the content. Android: a Material navigation bar. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const th = useTheme();
  const { a, rtl } = useLang();
  const insets = useSafeAreaInsets();
  const ios = th.look === 'ios';

  const items = state.routes.map((route, i) => {
    const tab = TABS[route.name];
    if (!tab) return null;
    const focused = state.index === i;
    const onPress = () => {
      const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
      // A second tap on Search goes back to the form.
      else if (focused && route.name === '(search)') navigation.navigate('(search)', { screen: 'index' });
    };
    const color = focused ? (ios ? th.tint : th.onChip) : ios ? th.text : th.text2;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={a.tabs[tab.label]}
        onPress={onPress}
        style={ios
          ? { flex: 1, height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', gap: 1, backgroundColor: focused ? (th.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent' }
          : { flex: 1, alignItems: 'center', gap: 4 }}
      >
        <View style={ios ? null : { width: 64, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? th.chip : 'transparent' }}>
          <Icon name={focused ? tab.iconOn : tab.icon} size={24} color={color} />
        </View>
        <Txt center style={{ fontSize: ios ? 10 : 12, fontWeight: focused ? (ios ? '600' : '700') : '500', color: ios ? color : th.text }}>{a.tabs[tab.label]}</Txt>
      </Pressable>
    );
  });

  if (ios) {
    return (
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: Math.max(insets.bottom - 8, 16), alignItems: 'center', direction: rtl ? 'rtl' : 'ltr' }}>
        <View
          accessibilityRole="tablist"
          style={{ width: '100%', maxWidth: 480, paddingHorizontal: 20 }}
        >
          <View style={{ height: 62, padding: 4, borderRadius: 999, backgroundColor: th.tabBar, flexDirection: 'row', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.10)', borderWidth: 0.5, borderColor: th.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
            {items}
          </View>
        </View>
      </View>
    );
  }
  return (
    <View accessibilityRole="tablist" style={{ paddingTop: 12, paddingBottom: insets.bottom + 16, backgroundColor: th.tabBar, flexDirection: 'row', direction: rtl ? 'rtl' : 'ltr' }}>
      {items}
    </View>
  );
}
