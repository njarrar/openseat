import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { CABINS, CARRIERS, MAX_PAX, RETURN_OPTIONS, type CabinId, type CarrierId } from '@openseat/shared';
import { Icon } from '../../../components/Icon';
import { Sentence } from '../../../components/Sentence';
import { ChoiceSheet } from '../../../components/Sheet';
import { TAB_SPACE } from '../../../components/TabBar';
import { Button, Choice, Field, Group, Note, Press, Row, Screen, SectionLabel, Sep, Switch, Txt, WIDE } from '../../../components/ui';
import { useLang } from '../../../i18n';
import type { ChipId } from '../../../i18n/dicts';
import { hasQuery, readParams } from '../../../lib/query';
import { useTrip } from '../../../lib/search';
import { useTheme } from '../../../theme';

type Picker = 'program' | 'cabin' | 'pax' | 'ret' | null;

export default function SearchScreen() {
  const th = useTheme();
  const { t, a, f, setSetting } = useLang();
  const { q, update, invalid } = useTrip();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [picker, setPicker] = useState<Picker>(null);
  const ios = th.look === 'ios';

  // A deep link such as openseat://?p=QR&o=DOH&d=NRT opens that search.
  useEffect(() => {
    if (hasQuery(params)) update(readParams(params, q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.p, params.o, params.d, params.c, params.n, params.r]);

  const openChip = (id: ChipId) => (id === 'from' || id === 'to' ? router.push({ pathname: '/airport', params: { field: id } }) : setPicker(id));
  const find = () => router.push('/calendar');
  const programs = CARRIERS.map((c) => ({ value: c.id, label: a.search.airlines[c.id] }));

  const langSwitch = (
    <Press
      onPress={() => setSetting(t.nav.switchLang)}
      accessibilityRole="button"
      accessibilityLabel={t.nav.switchLabel}
      style={{ height: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: ios ? th.card : 'transparent', borderWidth: ios ? 0 : 1, borderColor: th.outline, flexDirection: 'row', alignItems: 'center', gap: 6 }}
    >
      <Icon name="language" size={17} color={th.text2} />
      <Txt style={{ fontSize: 15 }}>{t.nav.switchTo}</Txt>
    </Press>
  );

  const pickers = (
    <>
      <ChoiceSheet<CarrierId>
        open={picker === 'program'}
        onClose={() => setPicker(null)}
        title={t.picker.program}
        value={q.carrier}
        options={CARRIERS.map((c) => ({ value: c.id, label: f.program(c.id), sub: t.picker.programSub(f.unit(c.id), f.city(c.hub)) }))}
        onPick={(carrier) => update({ carrier })}
      />
      <ChoiceSheet<CabinId>
        open={picker === 'cabin'}
        onClose={() => setPicker(null)}
        title={t.picker.cabin}
        value={q.cabin}
        options={CABINS.map((c) => ({ value: c.id, label: f.cabin(c.id), sub: c.id === 'premium' ? t.picker.premiumSub : undefined }))}
        onPick={(cabin) => update({ cabin })}
      />
      <ChoiceSheet<number>
        open={picker === 'pax'}
        onClose={() => setPicker(null)}
        title={t.picker.pax}
        value={q.pax}
        options={Array.from({ length: MAX_PAX }, (_, i) => i + 1).map((n) => ({ value: n, label: t.search.pax(n), sub: t.picker.paxSub(n) || undefined }))}
        onPick={(pax) => update({ pax })}
      />
      <ChoiceSheet<number>
        open={picker === 'ret'}
        onClose={() => setPicker(null)}
        title={t.picker.ret}
        value={q.ret}
        options={RETURN_OPTIONS.map((r) => ({ value: r, label: t.picker.retOption(r), sub: t.picker.retSub(r) }))}
        onPick={(ret) => update({ ret })}
      />
    </>
  );

  const error = invalid ? (
    <View style={{ marginHorizontal: ios ? 36 : 16, flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityRole="alert">
      <Icon name="warning" size={18} color={th.warn} />
      <Txt style={{ flex: 1, fontSize: 15, color: th.warn }}>{t.search.sameAirport}</Txt>
    </View>
  ) : null;

  const paxStepper = (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 32, borderRadius: 8, backgroundColor: th.track }}>
      <Press onPress={() => update({ pax: Math.max(1, q.pax - 1) })} disabled={q.pax <= 1} accessibilityRole="button" accessibilityLabel={a.search.fewer} style={{ width: 46, height: 32, alignItems: 'center', justifyContent: 'center', opacity: q.pax <= 1 ? 0.35 : 1 }}>
        <Icon name="remove" size={18} color={th.text} />
      </Press>
      <View style={{ width: 1, height: 18, backgroundColor: th.sep }} />
      <Press onPress={() => update({ pax: Math.min(MAX_PAX, q.pax + 1) })} disabled={q.pax >= MAX_PAX} accessibilityRole="button" accessibilityLabel={a.search.more} style={{ width: 46, height: 32, alignItems: 'center', justifyContent: 'center', opacity: q.pax >= MAX_PAX ? 0.35 : 1 }}>
        <Icon name="add" size={18} color={th.text} />
      </Press>
    </View>
  );

  if (ios) {
    return (
      <Screen bottom={TAB_SPACE} style={WIDE}>
        <View style={{ paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt style={{ fontSize: 15, fontWeight: '700', letterSpacing: -0.3, color: th.tint }}>openseat</Txt>
          {langSwitch}
        </View>
        <Txt accessibilityRole="header" style={{ marginTop: 4, paddingHorizontal: 20, fontSize: 34, lineHeight: 41, fontWeight: '700' }}>{a.search.title}</Txt>
        <Txt style={{ marginBottom: 8, paddingHorizontal: 20, fontSize: 15, lineHeight: 21, color: th.text2 }}>{a.search.sub}</Txt>
        <Sentence q={q} onOpen={openChip} />
        <View style={{ height: 12 }} />

        <SectionLabel>{a.search.program}</SectionLabel>
        <Choice<CarrierId> label={a.search.program} options={programs} value={q.carrier} onChange={(carrier) => update({ carrier })} />
        <Note style={{ marginBottom: 12 }}>{`${f.program(q.carrier)}. ${t.picker.programSub(f.unit(q.carrier), f.city(CARRIERS.find((c) => c.id === q.carrier)!.hub))}`}</Note>

        <SectionLabel>{a.search.route}</SectionLabel>
        <Group style={{ marginBottom: 16 }}>
          <Row icon="takeoff" label={a.search.from} value={`${f.city(q.from)}  ${q.from}`} chevron="forward" a11y={t.search.chipLabel(t.picker.from, `${f.city(q.from)} ${q.from}`)} onPress={() => openChip('from')} />
          <Sep />
          <Row icon="land" label={a.search.to} value={`${f.city(q.to)}  ${q.to}`} chevron="forward" a11y={t.search.chipLabel(t.picker.to, `${f.city(q.to)} ${q.to}`)} onPress={() => openChip('to')} />
        </Group>

        <SectionLabel>{a.search.trip}</SectionLabel>
        <Group>
          <Row icon="seat" label={t.picker.cabin} value={f.cabin(q.cabin)} valueTint chevron="menu" onPress={() => setPicker('cabin')} a11y={t.search.chipLabel(t.picker.cabin, f.cabin(q.cabin))} />
          <Sep />
          <Row icon="people" label={t.picker.pax} value={String(q.pax)} trailing={paxStepper} />
          <Sep />
          <Row icon="trip" label={a.search.returnTrip} trailing={<Switch value={q.ret > 0} label={a.search.returnTrip} onChange={(on) => update({ ret: on ? 14 : 0 })} />} />
          {q.ret > 0 && (
            <>
              <Sep />
              <Row label={a.search.backAfter} value={a.search.weeks(q.ret / 7)} valueTint chevron="menu" onPress={() => setPicker('ret')} />
            </>
          )}
        </Group>
        <Note style={{ marginTop: 6, marginBottom: 12 }}>{a.search.note}</Note>
        {error}
        <Button label={a.search.find} onPress={find} disabled={invalid} style={{ marginHorizontal: 20, marginTop: 8 }} />
        {pickers}
      </Screen>
    );
  }

  // Android, Material 3.
  return (
    <Screen bottom={TAB_SPACE} top={0} style={WIDE}>
      <View style={{ height: 56, paddingStart: 16, paddingEnd: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt style={{ fontSize: 22, fontWeight: '500', color: th.tint }}>openseat</Txt>
        {langSwitch}
      </View>
      <Txt accessibilityRole="header" style={{ marginTop: 4, paddingHorizontal: 16, fontSize: 28, lineHeight: 36 }}>{a.search.androidTitle}</Txt>
      <Txt style={{ marginBottom: 12, paddingHorizontal: 16, fontSize: 14, lineHeight: 20, color: th.text2 }}>{a.search.androidSub}</Txt>
      <Sentence q={q} onOpen={openChip} />
      <View style={{ height: 12 }} />
      <SectionLabel>{a.search.program}</SectionLabel>
      <Choice<CarrierId> label={a.search.program} options={programs} value={q.carrier} onChange={(carrier) => update({ carrier })} />
      <View style={{ height: 16 }} />
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        <Field label={a.search.from} icon="takeoff" onPress={() => openChip('from')} a11y={t.search.chipLabel(t.picker.from, `${f.city(q.from)} ${q.from}`)} style={{ paddingEnd: 56 }}>
          <Txt style={{ fontSize: 16 }}>{`${f.city(q.from)} (${q.from})`}</Txt>
        </Field>
        <Field label={a.search.to} icon="land" onPress={() => openChip('to')} a11y={t.search.chipLabel(t.picker.to, `${f.city(q.to)} ${q.to}`)} style={{ paddingEnd: 56 }}>
          <Txt style={{ fontSize: 16 }}>{`${f.city(q.to)} (${q.to})`}</Txt>
        </Field>
        <Press
          onPress={() => update({ from: q.to, to: q.from })}
          accessibilityRole="button"
          accessibilityLabel={a.search.swap}
          style={{ position: 'absolute', end: 28, top: 36, width: 40, height: 40, borderRadius: 999, backgroundColor: th.chip, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="swap" size={22} color={th.onChip} />
        </Press>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', gap: 12 }}>
        <Field label={t.picker.cabin} onPress={() => setPicker('cabin')} a11y={t.search.chipLabel(t.picker.cabin, f.cabin(q.cabin))} style={{ flex: 1, paddingEnd: 4 }}>
          <Txt numberOfLines={1} style={{ flex: 1, fontSize: 16 }}>{f.cabin(q.cabin)}</Txt>
          <Icon name="menu" size={24} color={th.text2} />
        </Field>
        <Field label={t.picker.pax} style={{ flex: 1, paddingEnd: 0 }}>
          <Txt style={{ flex: 1, fontSize: 16 }}>{String(q.pax)}</Txt>
          <Press onPress={() => update({ pax: Math.max(1, q.pax - 1) })} disabled={q.pax <= 1} accessibilityRole="button" accessibilityLabel={a.search.fewer} style={{ width: 40, height: 48, alignItems: 'center', justifyContent: 'center', opacity: q.pax <= 1 ? 0.35 : 1 }}>
            <Icon name="remove" size={22} color={th.text2} />
          </Press>
          <Press onPress={() => update({ pax: Math.min(MAX_PAX, q.pax + 1) })} disabled={q.pax >= MAX_PAX} accessibilityRole="button" accessibilityLabel={a.search.more} style={{ width: 40, height: 48, alignItems: 'center', justifyContent: 'center', opacity: q.pax >= MAX_PAX ? 0.35 : 1 }}>
            <Icon name="add" size={22} color={th.text2} />
          </Press>
        </Field>
      </View>
      <Press onPress={() => update({ ret: q.ret > 0 ? 0 : 14 })} accessibilityRole="switch" accessibilityState={{ checked: q.ret > 0 }} style={{ marginTop: 12, minHeight: 72, paddingStart: 16, paddingEnd: 24, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt style={{ fontSize: 16 }}>{a.search.returnTrip}</Txt>
          <Txt style={{ fontSize: 14, color: th.text2 }}>{t.picker.retOption(q.ret)}</Txt>
        </View>
        <View pointerEvents="none" importantForAccessibility="no-hide-descendants" aria-hidden>
          <Switch value={q.ret > 0} label={a.search.returnTrip} onChange={() => {}} />
        </View>
      </Press>
      {q.ret > 0 && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Field label={a.search.backAfter} onPress={() => setPicker('ret')} a11y={`${a.search.backAfter}: ${a.search.weeks(q.ret / 7)}`} style={{ paddingEnd: 4 }}>
            <Txt style={{ flex: 1, fontSize: 16 }}>{a.search.weeks(q.ret / 7)}</Txt>
            <Icon name="menu" size={24} color={th.text2} />
          </Field>
        </View>
      )}
      <Note>{a.search.note}</Note>
      {error}
      <Button label={a.search.findAndroid} icon="search" onPress={find} disabled={invalid} style={{ marginHorizontal: 16, marginTop: 12 }} />
      {pickers}
    </Screen>
  );
}
