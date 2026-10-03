import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { I18nManager, View } from 'react-native';
import { ToastProvider } from '../components/Toast';
import { LangProvider, useLang } from '../i18n';
import { SearchProvider } from '../lib/search';
import { AlertsProvider } from '../lib/useAlerts';
import { useTheme } from '../theme';

// The app mirrors its own layout for Arabic (see app.config.ts), so the
// system-wide right-to-left switch stays off and the language can change at once.
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

function Root() {
  const th = useTheme();
  const { rtl } = useLang();
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(th.bg).catch(() => {});
  }, [th.bg]);
  const nav = th.dark ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={{ ...nav, colors: { ...nav.colors, background: th.bg, card: th.bg, primary: th.tint, text: th.text, border: th.sep } }}>
      <View style={{ flex: 1, backgroundColor: th.bg, direction: rtl ? 'rtl' : 'ltr' }}>
        <StatusBar style={th.dark ? 'light' : 'dark'} />
        <AlertsProvider>
          <SearchProvider>
            <ToastProvider>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: th.bg } }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="day" />
                <Stack.Screen name="how" />
                <Stack.Screen name="terms" />
                <Stack.Screen name="airport" options={{ presentation: 'modal' }} />
                <Stack.Screen name="alert" options={{ presentation: 'modal' }} />
              </Stack>
            </ToastProvider>
          </SearchProvider>
        </AlertsProvider>
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <LangProvider>
      <Root />
    </LangProvider>
  );
}
