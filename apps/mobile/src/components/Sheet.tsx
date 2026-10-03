import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLang } from '../i18n';
import { useTheme } from '../theme';
import { Icon } from './Icon';
import { Press, Txt } from './ui';

const native = Platform.OS !== 'web';

/**
 * Bottom sheet. Floats inset with large corners on iOS (like a medium detent
 * sheet), and sits flush with a drag handle on Android (ModalBottomSheet).
 */
export function Sheet({ open, onClose, title, sub, children }: { open: boolean; onClose: () => void; title: string; sub?: string; children: ReactNode }) {
  const th = useTheme();
  const { rtl, t } = useLang();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(400)).current;
  const ios = th.look === 'ios';

  useEffect(() => {
    if (open) {
      y.setValue(400);
      Animated.spring(y, { toValue: 0, useNativeDriver: native, damping: 24, stiffness: 220, mass: 0.9 }).start();
    }
  }, [open, y]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end', direction: rtl ? 'rtl' : 'ltr' }}>
        <Pressable accessibilityLabel={t.picker.close} onPress={onClose} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: th.scrim }} />
        <Animated.View
          accessibilityViewIsModal
          style={[
            { transform: [{ translateY: y }], backgroundColor: th.sheet, maxHeight: '86%', maxWidth: 640, alignSelf: 'center' },
            ios
              ? { width: '96%', marginBottom: Math.max(8, insets.bottom - 20), borderRadius: 40, boxShadow: '0 -10px 40px rgba(0,0,0,0.15)' }
              : { width: '100%', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: insets.bottom },
          ]}
        >
          <View style={{ alignItems: 'center', paddingTop: ios ? 8 : 22, paddingBottom: ios ? 6 : 10 }}>
            <View style={{ width: ios ? 36 : 32, height: ios ? 5 : 4, borderRadius: 999, backgroundColor: th.grabber }} />
          </View>
          <View style={{ paddingHorizontal: ios ? 20 : 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt accessibilityRole="header" style={ios ? { fontSize: 20, fontWeight: '700' } : { fontSize: 22, lineHeight: 28 }}>{title}</Txt>
              {sub ? <Txt style={{ fontSize: ios ? 13 : 14, color: th.text2 }}>{sub}</Txt> : null}
            </View>
            {ios && (
              <Press onPress={onClose} accessibilityRole="button" accessibilityLabel={t.picker.close} style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: th.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="close" size={18} color={th.text2} />
              </Press>
            )}
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: ios ? 20 : 24, paddingTop: 14, paddingBottom: ios ? 28 : 24, gap: 14 }}>{children}</ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** A list of options inside a sheet, for cabins, travellers and trip length. */
export function ChoiceSheet<T extends string | number>({ open, onClose, title, options, value, onPick }: {
  open: boolean;
  onClose: () => void;
  title: string;
  options: { value: T; label: string; sub?: string }[];
  value: T;
  onPick: (v: T) => void;
}) {
  const th = useTheme();
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <View style={{ gap: 4, marginHorizontal: -8 }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Press
              key={String(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => {
                onPick(o.value);
                onClose();
              }}
              style={{ minHeight: 52, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: on ? th.tintFill : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Txt style={{ fontWeight: on ? '600' : '400' }}>{o.label}</Txt>
                {o.sub ? <Txt style={{ fontSize: 13, color: th.text2 }}>{o.sub}</Txt> : null}
              </View>
              {on && <Icon name="check" size={20} color={th.tint} />}
            </Press>
          );
        })}
      </View>
    </Sheet>
  );
}
