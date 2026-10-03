import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, Pressable, View } from 'react-native';
import { addDays, weekday, type CabinId, type CabinSummary } from '@openseat/shared';
import { useLang } from '../i18n';
import { countText, level, useTheme, type Heat } from '../theme';
import { Txt } from './ui';

type CellState = 'ready' | 'pending' | 'failed';

interface CellProps {
  idx: number;
  day: number;
  count: number;
  state: CellState;
  selected: boolean;
  fit: boolean;
  label: string;
  heat: Heat;
  ring: string;
  fitColor: string;
  pulse: Animated.Value;
  skeleton: string;
  ios: boolean;
  onPick: (idx: number) => void;
}

// Memoised so that moving the selection only re-renders the cells that changed.
const DayCell = memo(function DayCell({ idx, day, count, state, selected, fit, label, heat, ring, fitColor, pulse, skeleton, ios, onPick }: CellProps) {
  const radius = ios ? 12 : 16;
  const h = ios ? 48 : 50;
  const bg = state === 'ready' ? heat.bg : skeleton;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={() => onPick(idx)}
      style={({ pressed }) => ({ flex: 1, height: h, transform: [{ scale: pressed ? 0.94 : 1 }] })}
    >
      <Animated.View
        style={{
          flex: 1,
          borderRadius: radius,
          backgroundColor: bg,
          borderWidth: state === 'ready' && level(count) === 0 ? (Platform.OS === 'web' ? 1 : 0.5) : 0,
          borderColor: heat.bd,
          alignItems: 'center',
          paddingTop: ios ? 5 : 6,
          opacity: state === 'pending' ? pulse : 1,
        }}
      >
        <Txt center style={{ fontSize: 12, fontWeight: ios ? '500' : '400', color: state === 'ready' ? heat.fg : undefined, opacity: state === 'ready' ? 1 : 0.6 }}>{day}</Txt>
        <Txt center ltr style={{ fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'], color: heat.fg }}>{state === 'ready' ? countText(count) : state === 'failed' ? '–' : ''}</Txt>
        {fit && <View style={{ position: 'absolute', bottom: 5, width: 16, height: 3, borderRadius: 999, backgroundColor: fitColor }} />}
      </Animated.View>
      {selected && (
        <View pointerEvents="none" style={{ position: 'absolute', top: -4, bottom: -4, left: -4, right: -4, borderRadius: radius + 4, borderWidth: 2, borderColor: ring }} />
      )}
    </Pressable>
  );
});

interface Props {
  dates: string[];
  summaries: Map<string, Record<CabinId, CabinSummary>>;
  failed: Set<string>;
  cabin: CabinId;
  selIdx: number;
  minIdx: number;
  fitRange: [number, number] | null;
  unit: string;
  onSelect: (idx: number) => void;
}

/** 90 days as month grids, Monday first. In Arabic the weeks run right to left. */
export function Calendar({ dates, summaries, failed, cabin, selIdx, minIdx, fitRange, unit, onSelect }: Props) {
  const th = useTheme();
  const { t, f, lang } = useLang();
  const ios = th.look === 'ios';
  const select = useRef(onSelect);
  select.current = onSelect;
  const onPick = useMemo(() => (idx: number) => select.current(idx), []);

  // One shared pulse for every day still on its way.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.45, duration: 650, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const months = useMemo(() => {
    if (!dates.length) return [];
    const index = new Map(dates.map((d, i) => [d, i]));
    const out: { key: string; weeks: (string | null)[][] }[] = [];
    let cur = dates[0].slice(0, 8) + '01';
    const last = dates[dates.length - 1];
    while (cur <= last) {
      const cells: (string | null)[] = Array.from({ length: weekday(cur) }, () => null);
      const month = cur.slice(0, 7);
      let d = cur;
      for (; d.slice(0, 7) === month; d = addDays(d, 1)) cells.push(d);
      while (cells.length % 7) cells.push(null);
      const weeks: (string | null)[][] = [];
      for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
      out.push({ key: cur, weeks });
      cur = d;
    }
    return out.map((m) => ({ ...m, index }));
  }, [dates]);

  const weekdays = t.cal.weekdays.map((w) => (lang === 'en' ? (ios ? w.toUpperCase() : w[0]) : w));
  const gap = 4;

  return (
    <View style={{ gap: 8 }}>
      {months.map((m) => (
        <View key={m.key} style={{ gap: 6, paddingHorizontal: ios ? 16 : 12 }}>
          <Txt accessibilityRole="header" style={ios ? { fontSize: 20, fontWeight: '700', paddingTop: 8, paddingHorizontal: 4 } : { fontSize: 16, fontWeight: '500', paddingTop: 10, paddingHorizontal: 4 }}>{f.month(m.key)}</Txt>
          <View style={{ flexDirection: 'row', gap }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            {weekdays.map((w, i) => (
              <Txt key={i} center numberOfLines={1} adjustsFontSizeToFit style={{ flex: 1, fontSize: ios ? 11 : 12, fontWeight: ios ? '600' : '400', color: ios ? th.text3 : th.text2 }}>{w}</Txt>
            ))}
          </View>
          {m.weeks.map((week, wi) => (
            <View key={wi} style={{ flexDirection: 'row', gap }}>
              {week.map((d, j) => {
                if (!d) return <View key={'b' + j} style={{ flex: 1 }} />;
                const i = m.index.get(d);
                const dayNum = Number(d.slice(8));
                if (i === undefined || i < minIdx) {
                  return (
                    <View key={d} style={{ flex: 1, height: ios ? 48 : 50, alignItems: 'center', paddingTop: 6 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                      <Txt center style={{ fontSize: 13, color: th.past }}>{dayNum}</Txt>
                    </View>
                  );
                }
                const s = summaries.get(d)?.[cabin];
                const state: CellState = s ? 'ready' : failed.has(d) ? 'failed' : 'pending';
                const fit = !!fitRange && i >= fitRange[0] && i <= fitRange[1];
                const date = f.dateLong(d);
                const label = state === 'pending' ? t.cal.dayPending(date)
                  : state === 'failed' ? t.cal.dayFailed(date)
                  : s!.count ? t.cal.dayAria(date, t.cal.seats(s!.count), f.num(s!.minMiles), unit, fit)
                  : t.cal.dayNone(date, f.cabin(cabin));
                const count = s?.count ?? 0;
                const heat = th.heat[state === 'ready' ? level(count) : 0];
                return (
                  <DayCell
                    key={d}
                    idx={i}
                    day={dayNum}
                    count={count}
                    state={state}
                    selected={i === selIdx}
                    fit={fit}
                    label={label}
                    heat={heat}
                    ring={th.ring[1]}
                    fitColor={level(count) === 3 ? th.fitOnDark : th.fit}
                    pulse={pulse}
                    skeleton={th.skeleton}
                    ios={ios}
                    onPick={onPick}
                  />
                );
              })}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Placeholder grid while the first dates arrive. */
export function CalendarSkeleton() {
  const th = useTheme();
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 28, gap: 4 }} accessibilityState={{ busy: true }}>
      {Array.from({ length: 5 }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 4 }}>
          {Array.from({ length: 7 }, (_, c) => <View key={c} style={{ flex: 1, height: 48, borderRadius: th.look === 'ios' ? 12 : 16, backgroundColor: th.skeleton }} />)}
        </View>
      ))}
    </View>
  );
}
