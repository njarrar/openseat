import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLang } from '../i18n';
import { useTheme } from '../theme';
import { Icon } from './Icon';
import { Press, Txt } from './ui';

interface ToastMsg {
  text: string;
  undo?: () => void;
  id: number;
}

const Ctx = createContext<(text: string, undo?: () => void) => void>(() => {});

/** A short message above the tab bar: a Material snackbar on Android, a capsule on iOS. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback((text: string, undo?: () => void) => {
    clearTimeout(timer.current);
    setMsg({ text, undo, id: Date.now() });
    timer.current = setTimeout(() => setMsg(null), 3500);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Ctx.Provider value={show}>
      {children}
      {msg && <Toast msg={msg} onDone={() => setMsg(null)} />}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

function Toast({ msg, onDone }: { msg: ToastMsg; onDone: () => void }) {
  const th = useTheme();
  const { a, rtl } = useLang();
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const ios = th.look === 'ios';
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [msg.id, fade]);
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 12, right: 12, bottom: insets.bottom + (ios ? 96 : 92), alignItems: 'center', direction: rtl ? 'rtl' : 'ltr' }}>
      <Animated.View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={{
          opacity: fade,
          width: '100%',
          maxWidth: 560,
          minHeight: 48,
          paddingStart: 16,
          paddingEnd: msg.undo ? 8 : 16,
          paddingVertical: 6,
          borderRadius: ios ? 999 : 4,
          backgroundColor: th.snackBg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 3px 12px rgba(0,0,0,0.2)',
        }}
      >
        {ios && <Icon name="bellOn" size={16} color={th.snackAction} />}
        <Txt style={{ flex: 1, fontSize: 14, lineHeight: 20, color: th.snackFg }}>{msg.text}</Txt>
        {msg.undo && (
          <Press
            accessibilityRole="button"
            onPress={() => {
              msg.undo?.();
              onDone();
            }}
            style={{ height: 40, paddingHorizontal: 12, justifyContent: 'center' }}
          >
            <Txt style={{ color: th.snackAction, fontSize: 14, fontWeight: '600' }}>{a.alerts.undo}</Txt>
          </Press>
        )}
      </Animated.View>
    </View>
  );
}
