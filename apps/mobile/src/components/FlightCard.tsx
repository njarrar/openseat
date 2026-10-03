import { View } from 'react-native';
import { CABINS, type CabinId, type Itinerary } from '@openseat/shared';
import { productBadges } from '../../../web/src/lib/product';
import { useLang } from '../i18n';
import { useTheme } from '../theme';
import { Icon } from './Icon';
import { Button, Press, Txt } from './ui';

interface Props {
  it: Itinerary;
  cabin: CabinId;
  pax: number;
  onBook: () => void;
  onCabin: (c: CabinId) => void;
}

function Badge({ label, warn }: { label: string; warn?: boolean }) {
  const th = useTheme();
  return (
    <View style={{ height: 24, paddingHorizontal: 8, borderRadius: 999, backgroundColor: warn ? th.warnBg : th.track, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {warn && <Icon name="warning" size={13} color={th.warn} />}
      <Txt style={{ fontSize: 12, fontWeight: '600', color: warn ? th.warn : th.text2 }}>{label}</Txt>
    </View>
  );
}

export function FlightCard({ it, cabin, pax, onBook, onCabin }: Props) {
  const th = useTheme();
  const { t, a, f } = useLang();
  const ios = th.look === 'ios';
  const fare = it.cabins[cabin];
  const ok = fare.seats !== null && fare.seats >= pax;
  const nums = it.legs.length ? it.legs.map((l) => l.flight) : [it.key];
  const others = CABINS.filter((c) => c.id !== cabin && (it.cabins[c.id].seats ?? -1) >= pax);
  const badges = productBadges(it, cabin);
  const meta = [nums.join(' + '), it.aircraft, it.hub ? t.flight.stop(f.city(it.hub), f.duration(it.layoverMin)) : t.flight.nonstop, f.duration(it.durationMin)].join(' · ');

  return (
    <View style={{ marginHorizontal: 16, padding: 16, gap: ios ? 10 : 12, borderRadius: ios ? 22 : 12, backgroundColor: th.card }}>
      <View style={{ gap: 3 }}>
        {/* Times read left to right in both languages. */}
        <View style={{ direction: 'ltr', flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}>
          <Txt ltr style={{ fontSize: 22, fontWeight: ios ? '600' : '400', fontVariant: ['tabular-nums'] }}>{it.dep}</Txt>
          {ios ? <Icon name="arrow" size={15} color={th.text3} /> : <Txt style={{ fontSize: 22, color: th.text3 }}>–</Txt>}
          <Txt ltr style={{ fontSize: 22, fontWeight: ios ? '600' : '400', fontVariant: ['tabular-nums'] }}>{it.arr}</Txt>
          {it.dayOffset > 0 && <Txt ltr style={{ fontSize: 12, color: th.tint, marginStart: -5, marginTop: -10 }}>{`+${it.dayOffset}`}</Txt>}
        </View>
        <Txt style={{ fontSize: ios ? 13 : 14, lineHeight: 19, color: th.text2 }}>{meta}</Txt>
      </View>

      {(badges.length > 0 || it.separateTickets || (ok && !fare.saver)) && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {badges.includes('qsuite') && <Badge label="Qsuite" />}
          {badges.includes('a380') && <Badge label="A380" />}
          {ok && !fare.saver && <Badge label={t.flight.flex} />}
          {it.separateTickets && <Badge label={t.flight.separate} warn />}
        </View>
      )}

      <View style={{ height: ios ? 0.5 : 1, backgroundColor: th.sep }} />

      {ok ? (
        <View style={{ flexDirection: ios ? 'row' : 'column', alignItems: ios ? 'center' : 'stretch', gap: 12 }}>
          <View style={{ flex: ios ? 1 : undefined, gap: 2 }}>
            <Txt style={{ fontSize: ios ? 20 : 22, fontWeight: ios ? '700' : '500', fontVariant: ['tabular-nums'] }}>
              {f.num(fare.miles!)} <Txt style={{ fontSize: 14, fontWeight: ios ? '500' : '400', color: th.text2 }}>{f.unit(it.carrier)}</Txt>
            </Txt>
            <Txt style={{ fontSize: ios ? 13 : 14, color: th.text2 }}>
              {t.flight.taxes(f.money(fare.tax!, it.currency), fare.seats!)}
              {fare.saver ? ` · ${t.flight.saver}` : ''}
            </Txt>
          </View>
          {ios ? (
            <Press onPress={onBook} accessibilityRole="button" accessibilityLabel={`${t.flight.howToBook}, ${nums.join(' + ')}`} style={{ height: 36, paddingHorizontal: 18, borderRadius: 999, backgroundColor: th.tintFill, justifyContent: 'center' }}>
              <Txt style={{ fontSize: 15, fontWeight: '600', color: th.tint }}>{a.day.book}</Txt>
            </Press>
          ) : (
            <Button kind="tonal" label={t.flight.howToBook} onPress={onBook} style={{ alignSelf: 'flex-start', paddingHorizontal: 24 }} />
          )}
        </View>
      ) : (
        <Txt style={{ fontSize: ios ? 15 : 14, color: th.text2 }}>{fare.seats === null ? t.flight.notOffered(f.cabin(cabin)) : t.flight.noSeats(f.cabin(cabin))}</Txt>
      )}

      {it.separateTickets && <Txt style={{ fontSize: 13, lineHeight: 18, color: th.warn }}>{t.flight.separateNote}</Txt>}

      {others.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: ios ? 6 : 8, alignItems: 'center' }}>
          {ios && <Txt style={{ fontSize: 13, color: th.text2 }}>{t.flight.alsoOpen}</Txt>}
          {others.map((c) => (
            <Press
              key={c.id}
              onPress={() => onCabin(c.id)}
              accessibilityRole="button"
              accessibilityLabel={`${t.flight.alsoOpen}: ${f.cabin(c.id)}`}
              style={ios
                ? { height: 28, paddingHorizontal: 10, borderRadius: 999, backgroundColor: th.bg, flexDirection: 'row', alignItems: 'center', gap: 4 }
                : { height: 32, paddingStart: 8, paddingEnd: 16, borderRadius: 8, borderWidth: 1, borderColor: th.outline, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              {!ios && <Icon name="seat" size={18} color={th.tint} />}
              <Txt style={{ fontSize: ios ? 13 : 14, fontWeight: ios ? '400' : '500' }}>{`${f.cabinShort(c.id)} ${Math.round((it.cabins[c.id].miles ?? 0) / 1000)}k`}</Txt>
            </Press>
          ))}
        </View>
      )}
    </View>
  );
}
