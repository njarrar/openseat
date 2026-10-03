import Tabs from 'expo-router/js-tabs';
import { TabBar } from '../../components/TabBar';
import { useLang } from '../../i18n';

export default function TabsLayout() {
  const { a } = useLang();
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="(search)" options={{ title: a.tabs.search }} />
      <Tabs.Screen name="alerts" options={{ title: a.tabs.alerts }} />
      <Tabs.Screen name="settings" options={{ title: a.tabs.settings }} />
    </Tabs>
  );
}
