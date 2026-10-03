import type { AlertChannel } from '@openseat/shared';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { Button, Choice, Press, Txt } from '../components/ui';
import { useLang } from '../i18n';
import { checkAddress } from '../lib/address';
import { savedAddress } from '../lib/alerts';
import { human } from '../lib/botcheck';
import { BASIC, features } from '../lib/features';
import { useTrip } from '../lib/search';
import { useAlerts } from '../lib/useAlerts';
import { useTheme } from '../theme';

/**
 * Asks how to send alerts (email, WhatsApp or Telegram, as the API offers) and
 * turns one on for the route and cabin on screen. Telegram has no address: the
 * app opens the bot and the person taps Start there.
 */
export default function AlertScreen() {
  const th = useTheme();
  const { t, f, rtl, lang } = useLang();
  const { q, O, D } = useTrip();
  const { on } = useAlerts();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [channels, setChannels] = useState(BASIC.channels);
  const [channel, setChannel] = useState<AlertChannel>('email');
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const ios = th.look === 'ios';

  useEffect(() => {
    features().then((x) => setChannels(x.channels));
    savedAddress('email').then((e) => setValue((cur) => cur || e));
  }, []);

  const pick = (c: AlertChannel) => {
    setChannel(c);
    setError(false);
    setValue('');
    if (c !== 'telegram') savedAddress(c).then(setValue);
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const cabinName = f.cabin(q.cabin);
  const submit = async () => {
    const address = checkAddress(channel, value);
    if (address === null) return setError(true);
    setBusy(true);
    const check = await human(lang);
    if (!check.ok) {
      setBusy(false);
      return toast(t.alert.robot);
    }
    const r = await on({ carrier: q.carrier, origin: O, destination: D, cabin: q.cabin, pax: q.pax, channel, address }, check.token);
    setBusy(false);
    if (!r.ok) return toast(r.robot ? t.alert.robot : t.alert.failed);
    close();
    if (r.link) {
      // Telegram: the alert starts once the person taps Start in the bot.
      toast(t.alert.telegramNext);
      Linking.openURL(r.link).catch(() => WebBrowser.openBrowserAsync(r.link!).catch(() => {}));
      return;
    }
    toast(channel === 'email' ? t.alert.on(cabinName, O, D) : t.alert.onMessage(cabinName, O, D));
  };

  const field = channel === 'whatsapp'
    ? { label: t.alert.phone, help: t.alert.phoneHelp, invalid: t.alert.phoneInvalid }
    : { label: t.alert.email, help: t.alert.help, invalid: t.alert.invalid };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: ios ? th.bg : th.sheet, direction: rtl ? 'rtl' : 'ltr' }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: ios ? 16 : insets.top + 16, paddingBottom: insets.bottom + 24, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Txt accessibilityRole="header" style={{ flex: 1, fontSize: ios ? 22 : 24, fontWeight: ios ? '700' : '400' }}>{t.alert.title}</Txt>
          <Press onPress={close} accessibilityRole="button" accessibilityLabel={t.alert.cancel} style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: ios ? th.track : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={20} color={th.text2} />
          </Press>
        </View>
        <Txt style={{ fontSize: 15, lineHeight: 21, color: th.text2 }}>{t.alert.body(cabinName, O, D, f.program(q.carrier), t.search.pax(q.pax))}</Txt>
        {channels.length > 1 && (
          <View style={{ gap: 8, marginHorizontal: ios ? -20 : -16 }}>
            <Txt style={{ fontSize: 14, fontWeight: '500', paddingHorizontal: ios ? 20 : 16 }}>{t.alert.channel}</Txt>
            <Choice label={t.alert.channel} options={channels.map((c) => ({ value: c, label: t.alert.channels[c] }))} value={channel} onChange={pick} />
          </View>
        )}
        {channel === 'telegram' ? (
          <Txt style={{ fontSize: 13, lineHeight: 18, color: th.text2 }}>{t.alert.telegramHelp}</Txt>
        ) : (
          <View style={{ gap: 6 }}>
            <Txt nativeID="alert-address" style={{ fontSize: 14, fontWeight: '500' }}>{field.label}</Txt>
            <TextInput
              key={channel}
              value={value}
              onChangeText={(v) => {
                setValue(v);
                setError(false);
              }}
              accessibilityLabel={field.label}
              accessibilityLabelledBy="alert-address"
              {...(channel === 'whatsapp'
                ? { autoComplete: 'tel' as const, textContentType: 'telephoneNumber' as const, keyboardType: 'phone-pad' as const }
                : { autoComplete: 'email' as const, textContentType: 'emailAddress' as const, keyboardType: 'email-address' as const })}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={channels.length === 1}
              returnKeyType="send"
              onSubmitEditing={submit}
              style={{ height: ios ? 46 : 56, paddingHorizontal: 14, borderRadius: ios ? 12 : 4, borderWidth: 1, borderColor: error ? th.warn : ios ? th.sep : th.outline, backgroundColor: ios ? th.card : 'transparent', fontSize: 17, color: th.text, textAlign: 'left', writingDirection: 'ltr' }}
            />
            <Txt style={{ fontSize: 13, lineHeight: 18, color: th.text2 }}>{field.help}</Txt>
            {error && <Txt accessibilityRole="alert" style={{ fontSize: 13, color: th.warn }}>{field.invalid}</Txt>}
          </View>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
          <Button kind="plain" label={t.alert.cancel} onPress={close} />
          <Button kind="filled" label={t.alert.submit} onPress={submit} disabled={busy} style={{ height: 44 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
