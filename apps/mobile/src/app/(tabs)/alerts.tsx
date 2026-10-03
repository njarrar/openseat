import { useRouter } from 'expo-router';
import { Fragment } from 'react';
import { View } from 'react-native';
import { Icon } from '../../components/Icon';
import { TAB_SPACE } from '../../components/TabBar';
import { useToast } from '../../components/Toast';
import { Group, Press, Screen, Sep, Switch, Txt, WIDE } from '../../components/ui';
import { useLang } from '../../i18n';
import { useTrip } from '../../lib/search';
import { useAlerts } from '../../lib/useAlerts';
import { useTheme } from '../../theme';

/** Every alert turned on from this device. Tap one to open its calendar. */
export default function AlertsScreen() {
  const th = useTheme();
  const { t, a, f, lang } = useLang();
  const { alerts, off, restore } = useAlerts();
  const { update } = useTrip();
  const toast = useToast();
  const router = useRouter();
  const ios = th.look === 'ios';
  const list = Object.entries(alerts);

  const remove = async (key: string) => {
    const { id: _id, token: _token, ...req } = alerts[key];
    if (!(await off(key))) return toast(t.alert.failed);
    if (req.channel === 'telegram') return toast(t.alert.off);
    toast(t.alert.off, () => {
      restore(req, lang).then((ok) => !ok && toast(t.alert.failed));
    });
  };

  return (
    <Screen bottom={TAB_SPACE} style={WIDE}>
      <Txt accessibilityRole="header" style={ios ? { marginTop: 40, paddingHorizontal: 20, fontSize: 34, lineHeight: 41, fontWeight: '700' } : { marginTop: 16, paddingHorizontal: 16, fontSize: 28, lineHeight: 36 }}>{a.alerts.title}</Txt>
      <Txt style={{ paddingHorizontal: ios ? 20 : 16, marginBottom: 12, fontSize: ios ? 15 : 14, lineHeight: 20, color: th.text2 }}>{a.alerts.sub}</Txt>
      {list.length === 0 ? (
        <View style={{ marginHorizontal: ios ? 20 : 16, padding: 20, borderRadius: ios ? 22 : 12, backgroundColor: th.card, alignItems: 'center', gap: 10 }}>
          <Icon name="bell" size={28} color={th.tint} />
          <Txt center style={{ fontSize: 15, lineHeight: 21, color: th.text2 }}>{a.alerts.empty}</Txt>
        </View>
      ) : (
        <Group style={ios ? undefined : { marginHorizontal: 16, borderRadius: 12 }}>
          {list.map(([key, al], i) => (
            <Fragment key={key}>
              {i > 0 && <Sep inset={16} />}
              <View style={{ minHeight: 64, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Press
                  style={{ flex: 1, gap: 2 }}
                  accessibilityRole="button"
                  onPress={() => {
                    update({ carrier: al.carrier, from: al.origin, to: al.destination, cabin: al.cabin, pax: al.pax, ret: 0 });
                    router.navigate('/calendar');
                  }}
                >
                  <Txt style={{ fontWeight: '600' }}>{t.picker.routeAria(f.city(al.origin), f.city(al.destination))}</Txt>
                  <Txt style={{ fontSize: 13, color: th.text2 }}>{`${f.programOnly(al.carrier)} · ${f.cabin(al.cabin)} · ${t.search.pax(al.pax)}`}</Txt>
                  <Txt style={{ fontSize: 13, color: th.text2 }}>{al.channel === 'telegram' ? a.alerts.telegram : a.alerts.to(al.address)}</Txt>
                </Press>
                <Switch value label={a.alerts.turnOff(`${al.origin} → ${al.destination}`)} onChange={() => remove(key)} />
              </View>
            </Fragment>
          ))}
        </Group>
      )}
    </Screen>
  );
}
