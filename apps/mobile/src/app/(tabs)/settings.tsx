import { useRouter } from 'expo-router';
import { Fragment } from 'react';
import { View } from 'react-native';
import { Icon } from '../../components/Icon';
import { TAB_SPACE } from '../../components/TabBar';
import { Group, Note, Press, Row, Screen, SectionLabel, Sep, Txt, WIDE } from '../../components/ui';
import { useLang, type LangSetting } from '../../i18n';
import { offline } from '../../lib/config';
import { useTheme } from '../../theme';

// Each language is named in its own script, so it can be found from either one.
const NAMES = { en: 'English', ar: 'العربية' } as const;

export default function SettingsScreen() {
  const th = useTheme();
  const { t, a, setting, setSetting, deviceLang } = useLang();
  const router = useRouter();
  const ios = th.look === 'ios';
  const options: { value: LangSetting; label: string; sub?: string }[] = [
    { value: 'system', label: a.settings.system, sub: a.settings.systemSub(NAMES[deviceLang]) },
    { value: 'en', label: NAMES.en },
    { value: 'ar', label: NAMES.ar },
  ];
  const card = ios ? undefined : { marginHorizontal: 16, borderRadius: 12 };

  return (
    <Screen bottom={TAB_SPACE} style={WIDE}>
      <Txt accessibilityRole="header" style={ios ? { marginTop: 40, marginBottom: 8, paddingHorizontal: 20, fontSize: 34, lineHeight: 41, fontWeight: '700' } : { marginTop: 16, marginBottom: 8, paddingHorizontal: 16, fontSize: 28, lineHeight: 36 }}>{a.settings.title}</Txt>

      <SectionLabel>{a.settings.language}</SectionLabel>
      <Group style={card}>
        {options.map((o, i) => {
          const on = setting === o.value;
          return (
            <Fragment key={o.value}>
              {i > 0 && <Sep inset={16} />}
              <Press onPress={() => setSetting(o.value)} accessibilityRole="radio" accessibilityState={{ checked: on }} style={{ minHeight: 52, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt>{o.label}</Txt>
                  {o.sub ? <Txt style={{ fontSize: 13, color: th.text2 }}>{o.sub}</Txt> : null}
                </View>
                {on && <Icon name="check" size={20} color={th.tint} />}
              </Press>
            </Fragment>
          );
        })}
      </Group>
      <Note style={{ marginBottom: 16 }}>{a.settings.languageNote}</Note>

      <SectionLabel>{a.settings.appearance}</SectionLabel>
      <Note style={{ marginBottom: 16 }}>{a.settings.appearanceNote}</Note>

      <SectionLabel>{a.settings.help}</SectionLabel>
      <Group style={[card, { marginBottom: 16 }]}>
        <Row icon="help" label={t.nav.howToUse} chevron="forward" onPress={() => router.push('/how')} />
        <Sep />
        <Row icon="doc" label={t.nav.terms} chevron="forward" onPress={() => router.push('/terms')} />
      </Group>

      <SectionLabel>{a.settings.data}</SectionLabel>
      <Note style={{ marginBottom: 16 }}>{offline ? a.settings.sample : a.settings.live}</Note>

      <SectionLabel>{a.settings.about}</SectionLabel>
      <Note>{t.footer.disclaimer}</Note>
      <Note>{t.footer.copyright}</Note>
    </Screen>
  );
}
