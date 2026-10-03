// Building blocks drawn after each platform's own controls: inset grouped
// lists and segmented controls on iOS, Material 3 chips and fields on Android.
// Layout direction comes from the app language, so Arabic mirrors at once.

import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Switch as RNSwitch, Text, View, type PressableProps, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLang } from '../i18n';
import { useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

/** Text that aligns to the reading direction. `ltr` keeps codes and times left to right. */
export function Txt({ style, center, ltr, ...rest }: TextProps & { center?: boolean; ltr?: boolean }) {
  const { rtl } = useLang();
  const th = useTheme();
  const r = rtl && !ltr;
  return <Text {...rest} style={[{ color: th.text, fontSize: 17, textAlign: center ? 'center' : r ? 'right' : 'left', writingDirection: r ? 'rtl' : 'ltr' }, style]} />;
}

/** Root of every screen: background, safe area and the layout direction. */
export function Screen({ children, scroll = true, top, bottom = 0, header, style }: {
  children: ReactNode;
  scroll?: boolean;
  /** Extra space above the content, below the status bar. */
  top?: number;
  /** Space kept free at the bottom, for the tab bar. */
  bottom?: number;
  /** Pinned above the scrolling content. */
  header?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const th = useTheme();
  const { rtl } = useLang();
  const insets = useSafeAreaInsets();
  const content = [{ paddingTop: header ? 4 : insets.top + (top ?? 8), paddingBottom: insets.bottom + bottom + 24, gap: 8 }, style];
  return (
    <View style={{ flex: 1, backgroundColor: th.bg, direction: rtl ? 'rtl' : 'ltr' }}>
      {header && <View style={{ paddingTop: insets.top }}>{header}</View>}
      {scroll ? (
        <ScrollView contentContainerStyle={content} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      ) : (
        <View style={[{ flex: 1 }, content]}>{children}</View>
      )}
    </View>
  );
}

/** Max width for content on tablets and the web preview. */
export const WIDE: ViewStyle = { width: '100%', maxWidth: 720, alignSelf: 'center' };

export function Press({ style, ...rest }: PressableProps & { style?: StyleProp<ViewStyle> }) {
  return <Pressable {...rest} style={({ pressed }) => [style, pressed && { opacity: 0.6 }]} />;
}

/** Small uppercase heading over an iOS group, or a Material label. */
export function SectionLabel({ children }: { children: string }) {
  const th = useTheme();
  const ios = th.look === 'ios';
  return (
    <Txt accessibilityRole="header" style={ios ? { paddingHorizontal: 36, fontSize: 13, color: th.text2, textTransform: 'uppercase' } : { paddingHorizontal: 16, fontSize: 14, fontWeight: '500', color: th.text2 }}>
      {children}
    </Txt>
  );
}

export function Note({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const th = useTheme();
  return <Txt style={[{ paddingHorizontal: th.look === 'ios' ? 36 : 16, fontSize: 13, lineHeight: 18, color: th.text2 }, style]}>{children}</Txt>;
}

/** iOS inset grouped list. */
export function Group({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const th = useTheme();
  return <View style={[{ marginHorizontal: 20, backgroundColor: th.card, borderRadius: 22, overflow: 'hidden' }, style]}>{children}</View>;
}

export function Sep({ inset = 48 }: { inset?: number }) {
  const th = useTheme();
  return <View style={{ height: Platform.OS === 'web' ? 1 : 0.5, marginStart: inset, backgroundColor: th.sep }} />;
}

/** A row in an iOS group: icon, label, value, trailing control. */
export function Row({ icon, label, value, valueTint, trailing, chevron, onPress, a11y, sub }: {
  icon?: IconName;
  label: string;
  sub?: string;
  value?: string;
  valueTint?: boolean;
  trailing?: ReactNode;
  chevron?: 'forward' | 'menu';
  onPress?: () => void;
  a11y?: string;
}) {
  const th = useTheme();
  const body = (
    <View style={{ minHeight: 52, paddingHorizontal: 16, paddingVertical: sub ? 8 : 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {icon && <Icon name={icon} size={20} color={th.tint} />}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt>{label}</Txt>
        {sub ? <Txt style={{ fontSize: 13, color: th.text2 }}>{sub}</Txt> : null}
      </View>
      {value ? <Txt style={{ color: valueTint ? th.tint : th.text2, flexShrink: 1 }} numberOfLines={1}>{value}</Txt> : null}
      {trailing}
      {chevron === 'forward' && <Icon name="forward" size={16} color={th.outline} />}
      {chevron === 'menu' && <Icon name="menu" size={16} color={th.tint} />}
    </View>
  );
  if (!onPress) return body;
  return <Press onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y}>{body}</Press>;
}

export interface Option<T> {
  value: T;
  label: string;
}

/** Single choice: a segmented control on iOS, filter chips on Android. */
export function Choice<T extends string>({ options, value, onChange, scroll, label }: { options: Option<T>[]; value: T; onChange: (v: T) => void; scroll?: boolean; label?: string }) {
  const th = useTheme();
  if (th.look === 'ios') {
    return (
      <View accessibilityRole="tablist" accessibilityLabel={label} style={{ marginHorizontal: 20, padding: 2, borderRadius: 9, backgroundColor: th.track, flexDirection: 'row', gap: 2 }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => onChange(o.value)}
              style={[{ flex: 1, minHeight: 32, borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }, on && { backgroundColor: th.segOn, boxShadow: '0 3px 8px rgba(0,0,0,0.12), 0 3px 1px rgba(0,0,0,0.04)' }]}
            >
              <Txt center numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: 13, fontWeight: on ? '600' : '500' }}>{o.label}</Txt>
            </Pressable>
          );
        })}
      </View>
    );
  }
  const chips = options.map((o) => {
    const on = o.value === value;
    return (
      <Pressable
        key={o.value}
        accessibilityRole="radio"
        accessibilityState={{ checked: on }}
        onPress={() => onChange(o.value)}
        style={{ height: 32, paddingStart: on ? 8 : 16, paddingEnd: 16, borderRadius: 8, borderWidth: 1, borderColor: on ? th.chip : th.outline, backgroundColor: on ? th.chip : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        {on && <Icon name="check" size={18} color={th.onChip} />}
        <Txt style={{ fontSize: 14, fontWeight: '500', color: on ? th.onChip : th.text }}>{o.label}</Txt>
      </Pressable>
    );
  });
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={label} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {chips}
      </ScrollView>
    );
  }
  return <View accessibilityLabel={label} style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{chips}</View>;
}

export function Switch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const th = useTheme();
  return (
    <RNSwitch
      value={value}
      onValueChange={onChange}
      accessibilityLabel={label}
      trackColor={{ true: th.tint, false: th.look === 'ios' ? 'rgba(120,120,128,0.16)' : th.track }}
      thumbColor={th.look === 'android' ? (value ? th.onTint : th.outline) : '#ffffff'}
      ios_backgroundColor="rgba(120,120,128,0.16)"
    />
  );
}

export function Button({ label, onPress, icon, kind = 'filled', disabled, style, trailingIcon }: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  trailingIcon?: IconName;
  kind?: 'filled' | 'tonal' | 'plain';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const th = useTheme();
  const ios = th.look === 'ios';
  const bg = kind === 'filled' ? th.tint : kind === 'tonal' ? (ios ? th.tintFill : th.chip) : 'transparent';
  const fg = kind === 'filled' ? th.onTint : kind === 'tonal' ? (ios ? th.tint : th.onChip) : th.tint;
  const h = kind === 'filled' ? (ios ? 52 : 56) : 40;
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[{ height: h, paddingHorizontal: 20, borderRadius: 999, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disabled ? 0.4 : 1 }, style]}
    >
      {icon && <Icon name={icon} size={20} color={fg} />}
      <Txt style={{ color: fg, fontSize: kind === 'filled' ? (ios ? 17 : 16) : ios ? 15 : 14, fontWeight: ios ? '600' : '500' }}>{label}</Txt>
      {trailingIcon && <Icon name={trailingIcon} size={16} color={fg} />}
    </Press>
  );
}

/** Round icon button. On iOS it floats as a glass circle. */
export function IconButton({ name, onPress, label, active, disabled, color }: { name: IconName; onPress: () => void; label: string; active?: boolean; disabled?: boolean; color?: string }) {
  const th = useTheme();
  const ios = th.look === 'ios';
  const bg = active ? (ios ? th.tint : th.chip) : ios ? th.glass : 'transparent';
  const fg = color ?? (active ? (ios ? th.onTint : th.onChip) : th.text);
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      style={{ width: ios ? 44 : 48, height: ios ? 44 : 48, borderRadius: 999, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : 1, ...(ios ? { boxShadow: '0 2px 10px rgba(0,0,0,0.08)' } : null) }}
    >
      <Icon name={name} size={ios ? 20 : 24} color={fg} />
    </Press>
  );
}

/** Screen top bar: a floating back button and centred title on iOS, a Material top app bar on Android. */
export function TopBar({ title, sub, trailing, ltrTitle }: { title: string; sub?: string; trailing?: ReactNode; ltrTitle?: boolean }) {
  const th = useTheme();
  const { a } = useLang();
  const router = useRouter();
  const back = <IconButton name="back" label={a.cal.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;
  if (th.look === 'ios') {
    return (
      <View style={{ height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {back}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Txt center ltr={ltrTitle} numberOfLines={1} accessibilityRole="header" style={{ fontWeight: '600' }}>{title}</Txt>
          {sub ? <Txt center numberOfLines={1} style={{ fontSize: 12, color: th.text2 }}>{sub}</Txt> : null}
        </View>
        <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{trailing}</View>
      </View>
    );
  }
  return (
    <View style={{ minHeight: 64, paddingHorizontal: 4, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {back}
      <View style={{ flex: 1 }}>
        <Txt numberOfLines={1} accessibilityRole="header" style={{ fontSize: 22, lineHeight: 28 }}>{title}</Txt>
        {sub ? <Txt numberOfLines={1} style={{ fontSize: 14, color: th.text2 }}>{sub}</Txt> : null}
      </View>
      {trailing}
    </View>
  );
}

/** Material outlined field with a floating label. */
export function Field({ label, icon, children, onPress, a11y, style }: { label: string; icon?: IconName; children: ReactNode; onPress?: () => void; a11y?: string; style?: StyleProp<ViewStyle> }) {
  const th = useTheme();
  const inner = (
    <View style={[{ height: 56, borderWidth: 1, borderColor: th.outline, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 }, style]}>
      <Txt style={{ position: 'absolute', top: -9, start: 12, paddingHorizontal: 4, backgroundColor: th.bg, fontSize: 12, color: th.text2 }}>{label}</Txt>
      {icon && <Icon name={icon} size={24} color={th.text2} />}
      {children}
    </View>
  );
  if (!onPress) return inner;
  return <Press onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y}>{inner}</Press>;
}
