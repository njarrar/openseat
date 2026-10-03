import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLang } from '../i18n';
import { useRouter } from 'expo-router';
import { useSize } from '../lib/useSize';
import { useTheme } from '../theme';
import { Icon, type IconName } from './Icon';
import { Txt } from './ui';

const TABS: Record<string, { icon: IconName; iconOn: IconName; label: 'search' | 'alerts' | 'settings' }> = {
  '(search)': { icon: 'search', iconOn: 'search', label: 'search' },
  alerts: { icon: 'bell', iconOn: 'bellOn', label: 'alerts' },
  settings: { icon: 'settings', iconOn: 'settingsOn', label: 'settings' },
};

/**
 * iOS: a floating capsule over the content on phones, and centred at the top
 * on tablets. Android: a Material navigation bar on phones, and a navigation
 * rail down the side on tablets.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const th = useTheme();
  const { a, t, rtl } = useLang();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const wide = useSize() !== 'compact';
  const ios = th.look === 'ios';
  const rail = wide && !ios;

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
          : rail ? { width: 80, alignItems: 'center', gap: 4, paddingVertical: 6 } : { flex: 1, alignItems: 'center', gap: 4 }}
      >
        <View style={ios ? null : { width: rail ? 56 : 64, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? th.chip : 'transparent' }}>
          <Icon name={focused ? tab.iconOn : tab.icon} size={24} color={color} />
        </View>
        <Txt center style={{ fontSize: ios ? 10 : 12, fontWeight: focused ? (ios ? '600' : '700') : '500', color: ios ? color : th.text }}>{a.tabs[tab.label]}</Txt>
      </Pressable>
    );
  });

  if (ios && wide) {
    // iPad: wordmark at the start, tabs centred, in a bar along the top.
    return (
      <View style={{ paddingTop: insets.top + 8, paddingBottom: 8, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: th.bg, direction: rtl ? 'rtl' : 'ltr' }}>
        <View style={{ flex: 1 }}>
          <Txt style={{ fontSize: 17, fontWeight: '700', letterSpacing: -0.3, color: th.tint }}>openseat</Txt>
        </View>
        <View accessibilityRole="tablist" style={{ width: 360, height: 62, padding: 4, borderRadius: 999, backgroundColor: th.tabBar, flexDirection: 'row', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.10)', borderWidth: 0.5, borderColor: th.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
          {items}
        </View>
        <View style={{ flex: 1 }} />
      </View>
    );
  }
  if (rail) {
    // Android tablet: a navigation rail with a button to turn on an alert.
    return (
      <View accessibilityRole="tablist" style={{ width: 96, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16, alignItems: 'center', gap: 12, backgroundColor: th.bg, direction: rtl ? 'rtl' : 'ltr' }}>
        <Pressable
          onPress={() => router.push('/alert')}
          accessibilityRole="button"
          accessibilityLabel={t.day.alertOff}
          style={({ pressed }) => ({ width: 56, height: 56, borderRadius: 16, marginBottom: 28, backgroundColor: th.primaryContainer, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' })}
        >
          <Icon name="bell" size={24} color={th.onPrimaryContainer} />
        </Pressable>
        {items}
      </View>
    );
  }
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
