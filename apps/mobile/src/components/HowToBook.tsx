import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform, View } from 'react-native';
import { CARRIER_BY_ID, type CabinId, type Itinerary } from '@openseat/shared';
import { useLang } from '../i18n';
import { useTheme } from '../theme';
import { Sheet } from './Sheet';
import { Button, Txt } from './ui';

/** The booking steps for one flight, with the total for the group and a link to the airline. */
export function HowToBook({ it, cabin, pax, onClose, inline }: { it: Itinerary | null; cabin: CabinId; pax: number; onClose: () => void; inline?: boolean }) {
  const th = useTheme();
  const { t, a, f } = useLang();
  const ios = th.look === 'ios';
  if (!it) return null;

  const carrier = CARRIER_BY_ID[it.carrier];
  const fare = it.cabins[cabin];
  const ok = fare.seats !== null && fare.seats >= pax;
  const nums = it.legs.length ? it.legs.map((l) => l.flight) : [it.key];
  const paxText = t.search.pax(pax);
  const steps = [
    t.flight.step1(f.programOnly(it.carrier), carrier.site),
    t.flight.step2(it.origin, it.destination, f.dateLong(it.date), f.term(it.carrier)),
    ok ? a.day.choose(nums.join(t.flight.and), f.cabin(cabin)) : t.flight.step3None(f.cabin(cabin), paxText),
  ];
  // The airline sites do not take reward searches in a link, so this opens the home page.
  const open = () => {
    if (Platform.OS === 'web') Linking.openURL(carrier.url);
    else WebBrowser.openBrowserAsync(carrier.url).catch(() => Linking.openURL(carrier.url));
  };

  const body = (
    <>
      <View style={{ gap: ios ? 12 : 14 }}>
        {steps.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: ios ? 8 : 12 }}>
            <View style={{ width: ios ? 22 : 28, height: ios ? 22 : 28, borderRadius: 999, backgroundColor: ios ? th.tintFill : th.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
              <Txt center style={{ fontSize: ios ? 12 : 14, fontWeight: ios ? '700' : '500', color: ios ? th.tint : th.onPrimaryContainer }}>{f.num(i + 1)}</Txt>
            </View>
            <Txt style={{ flex: 1, fontSize: ios ? 15 : 16, lineHeight: ios ? 21 : 24 }}>{s}</Txt>
          </View>
        ))}
      </View>
      {ok && (
        <View style={ios
          ? { backgroundColor: th.bg, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }
          : { borderTopWidth: 1, borderTopColor: th.sep, paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}
        >
          <Txt style={{ fontSize: ios ? 15 : 14, color: th.text2 }}>{a.day.total(paxText)}</Txt>
          <Txt style={{ flexShrink: 1, fontSize: ios ? 15 : 14, fontWeight: ios ? '600' : '500', fontVariant: ['tabular-nums'] }}>
            {a.day.totalValue(f.num(fare.miles! * pax), f.unit(it.carrier), f.money(fare.tax! * pax, it.currency))}
          </Txt>
        </View>
      )}
      <Button label={t.flight.open(carrier.site)} trailingIcon="external" onPress={open} style={ios ? { height: 44 } : { height: 48 }} />
    </>
  );

  // Tablets show the steps inside the flight card, under a heading.
  if (inline) {
    return (
      <View style={{ gap: 12, paddingTop: 4 }}>
        <Txt accessibilityRole="header" style={{ fontSize: ios ? 15 : 16, fontWeight: '600' }}>{t.flight.howToBook}</Txt>
        {body}
      </View>
    );
  }
  return (
    <Sheet open onClose={onClose} title={t.flight.howToBook} sub={`${nums.join(' + ')} · ${it.origin} → ${it.destination} · ${f.dateShort(it.date)}`}>
      {body}
    </Sheet>
  );
}
