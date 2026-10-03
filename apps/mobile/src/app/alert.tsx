import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { Button, Press, Txt } from '../components/ui';
import { useLang } from '../i18n';
import { EMAIL_RE, savedEmail } from '../lib/alerts';
import { useTrip } from '../lib/search';
import { useAlerts } from '../lib/useAlerts';
import { useTheme } from '../theme';

/**
 * Asks for an email address and turns on an alert for the route and cabin on
 * screen. Email is the only channel for now; this form is the one place to
 * add others.
 */
export default function AlertScreen() {
  const th = useTheme();
  const { t, f, rtl } = useLang();
  const { q, O, D } = useTrip();
  const { on } = useAlerts();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const ios = th.look === 'ios';

  useEffect(() => {
    savedEmail().then((e) => setEmail((cur) => cur || e));
  }, []);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const cabinName = f.cabin(q.cabin);
  const submit = async () => {
    const address = email.trim();
    if (!EMAIL_RE.test(address)) return setError(true);
    setBusy(true);
    const ok = await on({ carrier: q.carrier, origin: O, destination: D, cabin: q.cabin, pax: q.pax, channel: 'email', address });
    setBusy(false);
    if (!ok) return toast(t.alert.failed);
    close();
    toast(t.alert.on(cabinName, O, D));
  };

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
        <View style={{ gap: 6 }}>
          <Txt nativeID="alert-email" style={{ fontSize: 14, fontWeight: '500' }}>{t.alert.email}</Txt>
          <TextInput
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError(false);
            }}
            accessibilityLabel={t.alert.email}
            accessibilityLabelledBy="alert-email"
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="send"
            onSubmitEditing={submit}
            style={{ height: ios ? 46 : 56, paddingHorizontal: 14, borderRadius: ios ? 12 : 4, borderWidth: 1, borderColor: error ? th.warn : ios ? th.sep : th.outline, backgroundColor: ios ? th.card : 'transparent', fontSize: 17, color: th.text, textAlign: 'left', writingDirection: 'ltr' }}
          />
          <Txt style={{ fontSize: 13, lineHeight: 18, color: th.text2 }}>{t.alert.help}</Txt>
          {error && <Txt accessibilityRole="alert" style={{ fontSize: 13, color: th.warn }}>{t.alert.invalid}</Txt>}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
          <Button kind="plain" label={t.alert.cancel} onPress={close} />
          <Button kind="filled" label={t.alert.submit} onPress={submit} disabled={busy} style={{ height: 44 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
