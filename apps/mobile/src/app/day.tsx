import { useEffect, useState } from 'react';
import { Share, View } from 'react-native';
import { FlightCard } from '../components/FlightCard';
import { HowToBook } from '../components/HowToBook';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { IconButton, Press, Screen, TopBar, Txt, WIDE } from '../components/ui';
import { useLang } from '../i18n';
import { human } from '../lib/botcheck';
import { WEB_URL } from '../lib/config';
import { queryString } from '../lib/query';
import { useTrip } from '../lib/search';
import { requestRefresh } from '../lib/stream';
import { useWatch } from '../lib/useWatch';
import { useTheme } from '../theme';

export default function DayScreen() {
  return <DayView />;
}

/** One day's flights. As a tablet pane it has no back button and the booking steps open inside the card. */
export function DayView({ pane }: { pane?: boolean }) {
  const th = useTheme();
  const { t, a, f, lang } = useLang();
  const trip = useTrip();
  const { q, day, summary, selIdx, minIdx, cur, O, D } = trip;
  const { watching, toggle } = useWatch();
  const toast = useToast();
  const [book, setBook] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const ios = th.look === 'ios';

  useEffect(() => setBook(null), [day?.date, q.cabin]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const canPrev = selIdx > minIdx;
  const canNext = selIdx < cur.dates.length - 1;
  const nav = (
    <View style={{ flexDirection: 'row', ...(ios ? { height: 44, borderRadius: 999, backgroundColor: th.glass, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' } : null) }}>
      <NavButton icon="prevDay" label={t.day.prev} disabled={!canPrev} onPress={() => trip.step(-1)} />
      <NavButton icon="nextDay" label={t.day.next} disabled={!canNext} onPress={() => trip.step(1)} />
    </View>
  );
  const header = <TopBar noBack={pane} title={pane && day ? f.dateShort(day.date) : ios ? f.cabin(q.cabin) : day ? f.dateShort(day.date) : ''} trailing={nav} />;

  if (!day || !summary) {
    return (
      <Screen pane={pane} header={header}>
        <View style={{ marginHorizontal: 20, gap: 12 }}>
          <View style={{ height: 30, width: '60%', borderRadius: 8, backgroundColor: th.skeleton }} />
          <View style={{ height: 18, width: '85%', borderRadius: 8, backgroundColor: th.skeleton }} />
          <View style={{ height: 160, borderRadius: 22, backgroundColor: th.skeleton }} />
        </View>
      </Screen>
    );
  }

  const s = summary[q.cabin];
  const total = day.itineraries.length;
  const out = trip.out.dates[trip.outIdx], back = trip.back.dates[trip.retIdx];
  const tripLine = q.ret > 0 && out && back ? t.day.trip(f.dateShort(out), f.dateShort(back), trip.retIdx - trip.outIdx) : null;
  const booking = day.itineraries.find((it) => it.key === book) ?? null;

  const onRefresh = async () => {
    if (!trip.params) return;
    setRefreshing(true);
    const check = await human(lang);
    if (!check.ok) {
      setRefreshing(false);
      return toast(t.alert.robot);
    }
    const r = await requestRefresh(trip.params, check.token);
    setRefreshing(false);
    if (r === 'ok') cur.restart();
    else toast(r === 'wait' ? t.day.refreshWait : t.day.refreshFailed);
  };
  const onShare = () => {
    Share.share({ message: `${a.day.shareText(f.city(O), f.city(D), f.cabin(q.cabin))}\n${WEB_URL}/${queryString(q)}` }).catch(() => {});
  };

  const pill = (icon: 'bell' | 'bellOn' | 'share' | 'refresh', label: string, onPress: () => void, on = false, disabled = false) => (
    <Press
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: on, disabled }}
      style={{ height: 36, paddingHorizontal: 14, borderRadius: ios ? 999 : 8, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: on ? th.chip : ios ? th.card : 'transparent', borderWidth: ios ? 0 : 1, borderColor: on ? th.chip : th.outline, opacity: disabled ? 0.5 : 1 }}
    >
      <Icon name={icon} size={16} color={on ? th.onChip : th.tint} />
      <Txt style={{ fontSize: 14, fontWeight: '500', color: on ? th.onChip : th.text }}>{label}</Txt>
    </Press>
  );

  return (
    <Screen pane={pane} header={header} style={pane ? undefined : WIDE}>
      {ios && !pane && <Txt accessibilityRole="header" style={{ paddingHorizontal: 20, fontSize: 28, lineHeight: 32, fontWeight: '700' }}>{f.dateLong(day.date)}</Txt>}
      <Txt style={{ paddingHorizontal: ios ? 20 : 16, fontSize: ios ? 15 : 14, lineHeight: 20, color: th.text2 }}>
        {total ? t.day.sub(s.qualifying, total, O, D, f.cabin(q.cabin)) : t.day.noFlights(O, D)}
      </Txt>
      {tripLine && (
        <View style={{ paddingHorizontal: ios ? 20 : 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="trip" size={16} color={th.text2} />
          <Txt style={{ flex: 1, fontSize: 14, color: th.text2 }}>{tripLine}</Txt>
        </View>
      )}
      <View style={{ paddingHorizontal: 16, paddingVertical: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {pill(watching ? 'bellOn' : 'bell', watching ? t.day.alertOn : t.day.alertOff, toggle, watching)}
        {WEB_URL ? pill('share', a.day.share, onShare) : null}
      </View>
      <View style={{ paddingHorizontal: ios ? 20 : 16, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Txt style={{ flex: 1, fontSize: 13, color: th.text2 }}>{t.day.updated(f.ago(day.checkedAt, now))}</Txt>
        <Press onPress={onRefresh} disabled={refreshing} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, opacity: refreshing ? 0.5 : 1 }}>
          <Icon name="refresh" size={14} color={th.tint} />
          <Txt style={{ fontSize: 13, fontWeight: '600', color: th.tint }}>{refreshing ? t.day.refreshing : t.day.refresh}</Txt>
        </Press>
      </View>
      <View style={{ gap: 12 }}>
        {day.itineraries.map((it) => {
          const open = book === it.key;
          return (
            <FlightCard
              key={it.key + it.date}
              it={it}
              cabin={q.cabin}
              pax={q.pax}
              // In a pane, Book opens the steps inside the card, one card at a time.
              expanded={pane ? open : undefined}
              onBook={() => setBook(pane && open ? null : it.key)}
              onCabin={(cabin) => trip.update({ cabin }, true)}
            >
              {pane && open ? <HowToBook inline it={it} cabin={q.cabin} pax={q.pax} onClose={() => setBook(null)} /> : null}
            </FlightCard>
          );
        })}
      </View>
      {!pane && <HowToBook it={booking} cabin={q.cabin} pax={q.pax} onClose={() => setBook(null)} />}
    </Screen>
  );
}

function NavButton({ icon, label, disabled, onPress }: { icon: 'prevDay' | 'nextDay'; label: string; disabled: boolean; onPress: () => void }) {
  const th = useTheme();
  if (th.look === 'android') return <IconButton name={icon} label={label} disabled={disabled} onPress={onPress} />;
  return (
    <Press onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : 1 }}>
      <Icon name={icon} size={18} color={th.text} />
    </Press>
  );
}
