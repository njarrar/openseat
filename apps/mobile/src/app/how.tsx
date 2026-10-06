import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { CARRIERS } from '@openseat/shared';
import { EXAMPLES } from '../../../web/src/content/how';
import { Button, Screen, TopBar, Txt, WIDE } from '../components/ui';
import { useLang } from '../i18n';
import { useTrip } from '../lib/search';
import { useTheme } from '../theme';

function Card({ children }: { children: ReactNode }) {
  const th = useTheme();
  return <View style={{ marginHorizontal: 16, padding: 16, gap: 10, borderRadius: th.look === 'ios' ? 22 : 12, backgroundColor: th.card }}>{children}</View>;
}

function H2({ children }: { children: string }) {
  return <Txt accessibilityRole="header" style={{ marginTop: 16, paddingHorizontal: 20, fontSize: 22, fontWeight: '700' }}>{children}</Txt>;
}

function Steps({ items }: { items: string[] }) {
  const th = useTheme();
  const { f } = useLang();
  return (
    <View style={{ gap: 10 }}>
      {items.map((s, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: th.tintFill, alignItems: 'center', justifyContent: 'center' }}>
            <Txt center style={{ fontSize: 12, fontWeight: '700', color: th.tint }}>{f.num(i + 1)}</Txt>
          </View>
          <Txt style={{ flex: 1, fontSize: 15, lineHeight: 21 }}>{s}</Txt>
        </View>
      ))}
    </View>
  );
}

/** The website's How to use page, plus the How it works notes from its search page. */
export default function HowScreen() {
  const th = useTheme();
  const { t, f } = useLang();
  const { update } = useTrip();
  const router = useRouter();
  const c = t.howPage;
  const muted = { fontSize: 15, lineHeight: 21, color: th.text2 };

  return (
    <Screen header={<TopBar title={t.nav.howToUse} />} style={WIDE}>
      <Txt accessibilityRole="header" style={{ paddingHorizontal: 20, fontSize: 28, lineHeight: 34, fontWeight: '700' }}>{c.title}</Txt>
      <Txt style={{ paddingHorizontal: 20, marginBottom: 8, ...muted }}>{c.lede}</Txt>

      <H2>{c.basics}</H2>
      <Card>
        {c.moves.map(([title, text]) => (
          <View key={title} style={{ gap: 2 }}>
            <Txt style={{ fontSize: 16, fontWeight: '600' }}>{title}</Txt>
            <Txt style={muted}>{text}</Txt>
          </View>
        ))}
      </Card>

      <H2>{c.examples}</H2>
      {EXAMPLES.map((ex, i) => (
        <Card key={i}>
          <Txt style={{ fontSize: 17, fontWeight: '600' }}>{t.examples[i]?.title}</Txt>
          <Txt style={muted}>
            {[f.program(ex.q.carrier), f.cabin(ex.q.cabin), t.search.pax(ex.q.pax), t.picker.routeAria(f.city(ex.q.from), f.city(ex.q.to)), t.search.ret(ex.q.ret)].join(' · ')}
          </Txt>
          <Steps items={t.examples[i]?.tips ?? []} />
          <Button
            kind="tonal"
            label={c.tryIt}
            trailingIcon="forward"
            style={{ alignSelf: 'flex-start' }}
            onPress={() => {
              update(ex.q);
              router.navigate('/calendar');
            }}
          />
        </Card>
      ))}

      <H2>{t.how.reading}</H2>
      <Card>
        {t.how.key.map((k, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: th.heat[Math.min(i, 3)].bg, borderWidth: i === 0 ? 1 : 0, borderColor: th.heat[0].bd }} />
            <Txt style={{ flex: 1, ...muted }}>{k}</Txt>
          </View>
        ))}
      </Card>

      <H2>{t.how.notesTitle}</H2>
      {CARRIERS.map((carrier) => (
        <Card key={carrier.id}>
          <Txt style={{ fontSize: 16, fontWeight: '600' }}>{f.program(carrier.id)}</Txt>
          {t.how.notes[carrier.id].map((n) => <Txt key={n} style={muted}>{n}</Txt>)}
        </Card>
      ))}

      <H2>{t.how.goodTitle}</H2>
      <Card>
        {t.how.good.map((g) => <Txt key={g} style={muted}>{g}</Txt>)}
      </Card>

      <H2>{c.faqTitle}</H2>
      <Card>
        {c.faq.map(([qq, ans]) => (
          <View key={qq} style={{ gap: 2 }}>
            <Txt style={{ fontSize: 16, fontWeight: '600' }}>{qq}</Txt>
            <Txt style={muted}>{ans}</Txt>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
