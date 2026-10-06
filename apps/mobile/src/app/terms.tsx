import { View } from 'react-native';
import { Screen, TopBar, Txt, WIDE } from '../components/ui';
import { useLang } from '../i18n';
import { useTheme } from '../theme';

export default function TermsScreen() {
  const th = useTheme();
  const { t, f } = useLang();
  const c = t.terms;
  const body = { fontSize: 15, lineHeight: 22, color: th.text2 };
  return (
    <Screen header={<TopBar title={t.nav.terms} />} style={WIDE}>
      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        <Txt accessibilityRole="header" style={{ fontSize: 28, lineHeight: 34, fontWeight: '700' }}>{c.title}</Txt>
        <Txt style={{ fontSize: 13, color: th.text3 }}>{c.updated}</Txt>
        <Txt style={{ fontSize: 17, lineHeight: 24 }}>{c.intro}</Txt>
        {c.sections.map(([title, paras], i) => (
          <View key={title} style={{ gap: 8, marginTop: 12 }}>
            <Txt accessibilityRole="header" style={{ fontSize: 19, fontWeight: '600' }}>{`${f.num(i + 1)}. ${title}`}</Txt>
            {paras.map((p) => <Txt key={p} style={body}>{p}</Txt>)}
          </View>
        ))}
        <Txt style={{ marginTop: 20, fontSize: 13, lineHeight: 18, color: th.text3 }}>{t.footer.disclaimer}</Txt>
      </View>
    </Screen>
  );
}
