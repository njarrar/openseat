import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { CABINS, type CabinId } from '@openseat/shared';
import { Calendar, CalendarSkeleton } from '../../../components/Calendar';
import { TAB_SPACE } from '../../../components/TabBar';
import { Choice, IconButton, Press, Screen, TopBar, Txt, WIDE } from '../../../components/ui';
import { useLang } from '../../../i18n';
import { hasQuery, readParams } from '../../../lib/query';
import { useTrip, type Leg } from '../../../lib/search';
import { useWatch } from '../../../lib/useWatch';
import { useTheme } from '../../../theme';

export default function CalendarScreen() {
  const th = useTheme();
  const { t, a, f } = useLang();
  const trip = useTrip();
  const { q, cur, sums, minIdx, selIdx, isRet, O, D } = trip;
  const { watching, toggle } = useWatch();
  const router = useRouter();
  const ios = th.look === 'ios';
  const params = useLocalSearchParams();

  // A link straight to the calendar, such as openseat://calendar?p=QR&o=DOH&d=NRT.
  useEffect(() => {
    if (hasQuery(params)) trip.update(readParams(params, q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.p, params.o, params.d, params.c, params.n, params.r]);

  const unit = f.unit(q.carrier);
  const cabinName = f.cabin(q.cabin);
  const loaded = cur.dates.filter((d, i) => i >= minIdx && sums.has(d));
  const openDays = loaded.filter((d) => sums.get(d)![q.cabin].count > 0);
  const offered = [...sums.values()].some((s) => s[q.cabin].offered);
  const total = cur.dates.length - minIdx;
  const settled = cur.phase !== 'starting' && cur.phase !== 'streaming';
  // The stream ended before it sent any dates: the API could not be reached.
  const noReply = settled && cur.phase !== 'stopped' && cur.dates.length === 0;
  const summary = noReply ? a.cal.noReply
    : !settled && openDays.length === 0 ? t.cal.subLoading
    : !offered && settled ? t.cal.subNotOffered(f.programOnly(q.carrier), cabinName)
    : openDays.length ? t.cal.subFrom(cabinName, f.num(Math.min(...openDays.map((d) => sums.get(d)![q.cabin].minMiles))), unit, openDays.length, total)
    : t.cal.subNone(cabinName);
  const remaining = cur.dates.filter((d) => !cur.days.has(d) && !cur.failed.has(d)).length;

  const title = ios ? a.cal.route(O, D) : t.picker.routeAria(f.city(O), f.city(D));
  const sub = a.cal.navSub(cabinName, t.search.pax(q.pax), watching);
  const bell = <IconButton name={watching ? 'bellOn' : 'bell'} active={watching} label={watching ? t.day.alertOn : t.day.alertOff} onPress={toggle} />;
  const shortDate = (leg: Leg) => {
    const s = leg === 'ret' ? trip.back : trip.out;
    const i = leg === 'ret' ? trip.retIdx : trip.outIdx;
    return s.dates[i] ? f.dateShort(s.dates[i]) : '';
  };
  const legend = t.cal.legend.map((label, h) => ({ label, ...th.heat[h] }));

  return (
    <Screen bottom={TAB_SPACE} header={<TopBar title={title} ltrTitle={ios} sub={sub} trailing={bell} />} style={WIDE}>
      <Choice<CabinId>
        label={t.picker.cabin}
        options={CABINS.map((c) => ({ value: c.id, label: f.cabinShort(c.id) }))}
        value={q.cabin}
        onChange={(cabin) => trip.update({ cabin })}
      />

      {q.ret > 0 && (
        <View accessibilityRole="tablist" accessibilityLabel={t.cal.tablist} style={{ marginHorizontal: 16, marginTop: 6, padding: 4, borderRadius: ios ? 14 : 999, backgroundColor: th.track, flexDirection: 'row', gap: 4 }}>
          {(['out', 'ret'] as const).map((id) => {
            const on = trip.leg === id;
            return (
              <Press
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => trip.setLeg(id)}
                style={{ flex: 1, minHeight: 48, paddingHorizontal: 10, paddingVertical: 6, borderRadius: ios ? 10 : 999, justifyContent: 'center', backgroundColor: on ? (ios ? th.segOn : th.chip) : 'transparent', ...(on && ios ? { boxShadow: '0 1px 3px rgba(0,0,0,0.12)' } : null) }}
              >
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'baseline' }}>
                  <Txt style={{ fontSize: 14, fontWeight: '600' }}>{id === 'out' ? t.cal.outbound : t.cal.return}</Txt>
                  <Txt ltr style={{ fontSize: 12, color: th.text2, fontVariant: ['tabular-nums'] }}>{id === 'out' ? `${q.from} → ${q.to}` : `${q.to} → ${q.from}`}</Txt>
                </View>
                <Txt style={{ fontSize: 12, color: th.text2 }}>{shortDate(id)}</Txt>
              </Press>
            );
          })}
        </View>
      )}

      <Txt accessibilityLiveRegion="polite" style={{ marginTop: 6, paddingHorizontal: ios ? 20 : 16, fontSize: ios ? 15 : 14, lineHeight: 20, color: ios ? th.text2 : th.text2 }}>{summary}</Txt>
      <View style={{ paddingHorizontal: ios ? 20 : 16, flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 }}>
        {legend.map((l, h) => (
          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 14, height: 14, borderRadius: ios ? 4 : 999, backgroundColor: l.bg, borderWidth: h === 0 ? 1 : 0, borderColor: l.bd }} />
            <Txt style={{ fontSize: 12, color: th.text2 }}>{l.label}</Txt>
          </View>
        ))}
        {isRet && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 2 }}><View style={{ width: 12, height: 3, borderRadius: 999, backgroundColor: th.fit }} /></View>
            <Txt style={{ fontSize: 12, color: th.text2 }}>{t.cal.fits(q.ret / 7)}</Txt>
          </View>
        )}
      </View>

      {cur.phase === 'streaming' && cur.total > 0 && remaining > 0 && (
        <View style={{ marginHorizontal: ios ? 20 : 16, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Txt style={{ flex: 1, fontSize: 13, color: th.text2 }}>{t.cal.checking(remaining)}</Txt>
            <Press onPress={cur.stop} accessibilityRole="button" style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
              <Txt style={{ fontSize: 13, fontWeight: '600', color: th.tint }}>{t.cal.stop}</Txt>
            </Press>
          </View>
          <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: cur.total, now: cur.done }} style={{ height: 4, borderRadius: 999, backgroundColor: th.track, overflow: 'hidden' }}>
            <View style={{ width: `${Math.max(4, (cur.done / cur.total) * 100)}%`, height: 4, borderRadius: 999, backgroundColor: th.tint }} />
          </View>
        </View>
      )}
      {(cur.phase === 'stopped' || noReply || (cur.phase === 'done' && cur.failed.size > 0)) && (
        <View style={{ marginHorizontal: ios ? 20 : 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt style={{ flex: 1, fontSize: 13, color: th.text2 }}>{cur.phase === 'stopped' ? t.cal.stopped : noReply ? '' : t.cal.failed}</Txt>
          <Press onPress={cur.restart} accessibilityRole="button" style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
            <Txt style={{ fontSize: 13, fontWeight: '600', color: th.tint }}>{t.cal.retry}</Txt>
          </Press>
        </View>
      )}

      {cur.dates.length === 0 ? (
        <CalendarSkeleton />
      ) : (
        <Calendar
          dates={cur.dates}
          summaries={sums}
          failed={cur.failed}
          cabin={q.cabin}
          selIdx={selIdx}
          minIdx={minIdx}
          fitRange={isRet ? trip.fitRange : null}
          unit={unit}
          onSelect={(i) => {
            trip.select(i);
            router.push('/day');
          }}
        />
      )}
    </Screen>
  );
}
