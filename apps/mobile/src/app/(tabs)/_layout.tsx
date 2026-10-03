import Tabs from 'expo-router/js-tabs';
import { TabBar } from '../../components/TabBar';
import { useLang } from '../../i18n';
import { TopCleared, useSize } from '../../lib/useSize';
import { LOOK } from '../../theme';

export default function TabsLayout() {
  const { a } = useLang();
  const wide = useSize() !== 'compact';
  // Tablets: iPad tabs along the top, the Android rail on the start side.
  // 'left' follows the layout direction, so in Arabic the rail sits on the right.
  const position = !wide ? 'bottom' : LOOK === 'ios' ? 'top' : 'left';
  return (
    <TopCleared.Provider value={position === 'top'}>
      <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, tabBarPosition: position }}>
        <Tabs.Screen name="(search)" options={{ title: a.tabs.search }} />
        <Tabs.Screen name="alerts" options={{ title: a.tabs.alerts }} />
        <Tabs.Screen name="settings" options={{ title: a.tabs.settings }} />
      </Tabs>
    </TopCleared.Provider>
  );
}
