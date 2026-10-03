import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AIRPORTS } from '@openseat/shared';
import { Icon } from '../components/Icon';
import { Press, Sep, Txt } from '../components/ui';
import { useLang } from '../i18n';
import { useTrip } from '../lib/search';
import { useTheme } from '../theme';

const POPULAR: [string, string][] = [['DXB', 'LHR'], ['DOH', 'NRT'], ['AUH', 'BKK'], ['DXB', 'MLE'], ['RUH', 'LHR'], ['KWI', 'JFK']];

/** Airport search: city, code, country or the Arabic name, like the website's picker. */
export default function AirportScreen() {
  const th = useTheme();
  const { t, f, lang, rtl } = useLang();
  const { q, update } = useTrip();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { field: raw } = useLocalSearchParams<{ field?: string }>();
  const field = raw === 'to' ? 'to' : 'from';
  const [query, setQuery] = useState('');
  const ios = th.look === 'ios';

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const pick = (patch: { from?: string; to?: string }) => {
    update(patch);
    close();
  };

  const text = query.trim(), qq = text.toLowerCase();
  const list = AIRPORTS.filter((a) => !text || a.code.toLowerCase().includes(qq) || a.city.toLowerCase().includes(qq) || a.country.toLowerCase().includes(qq) || a.cityAr.includes(text) || a.countryAr.includes(text));

  const head = (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      {!text && (
        <View style={{ gap: 8 }}>
          <Txt style={{ fontSize: 13, color: th.text2, textTransform: ios ? 'uppercase' : 'none' }}>{t.picker.popular}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {POPULAR.map(([o, d]) => (
              <Press
                key={o + d}
                onPress={() => pick({ from: o, to: d })}
                accessibilityRole="button"
                accessibilityLabel={t.picker.routeAria(f.city(o), f.city(d))}
                style={{ height: 34, paddingHorizontal: 12, borderRadius: ios ? 999 : 8, backgroundColor: ios ? th.card : 'transparent', borderWidth: ios ? 0 : 1, borderColor: th.outline, justifyContent: 'center' }}
              >
                <Txt ltr style={{ fontSize: 14, fontVariant: ['tabular-nums'] }}>{`${o} → ${d}`}</Txt>
              </Press>
            ))}
          </View>
          <Txt style={{ paddingTop: 8, fontSize: 13, color: th.text2, textTransform: ios ? 'uppercase' : 'none' }}>{t.picker.all}</Txt>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: th.bg, direction: rtl ? 'rtl' : 'ltr', paddingTop: ios ? 12 : insets.top + 8 }}>
      <View style={{ paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Txt accessibilityRole="header" style={{ flex: 1, fontSize: ios ? 20 : 22, fontWeight: ios ? '700' : '400' }}>{field === 'from' ? t.picker.from : t.picker.to}</Txt>
        <Press onPress={close} accessibilityRole="button" accessibilityLabel={t.picker.close} style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: ios ? th.track : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={20} color={th.text2} />
        </Press>
      </View>
      <View style={{ margin: 16, marginBottom: 8, height: ios ? 40 : 56, paddingHorizontal: 12, borderRadius: ios ? 12 : 28, backgroundColor: ios ? th.track : th.card, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="search" size={18} color={th.text2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.picker.airportPlaceholder}
          placeholderTextColor={th.text3}
          accessibilityLabel={t.picker.airportLabel}
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={() => list[0] && pick({ [field]: list[0].code })}
          style={{ flex: 1, height: '100%', fontSize: 17, color: th.text, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }}
        />
      </View>
      <FlatList
        data={list}
        keyExtractor={(a) => a.code}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={head}
        ItemSeparatorComponent={() => <Sep inset={0} />}
        ListEmptyComponent={<Txt style={{ paddingVertical: 16, fontSize: 15, color: th.text2 }}>{t.picker.empty}</Txt>}
        renderItem={({ item: a }) => {
          const on = a.code === q[field];
          // Show the name in the other script too, so both work as search terms.
          const alt = lang === 'ar' ? a.city : a.cityAr;
          return (
            <Press onPress={() => pick({ [field]: a.code })} accessibilityRole="button" accessibilityState={{ selected: on }} style={{ minHeight: 56, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt style={{ fontWeight: on ? '600' : '400' }}>{`${f.city(a.code)} (${a.code})`}</Txt>
                <Txt style={{ fontSize: 13, color: th.text2 }}>{f.country(a.code)}</Txt>
              </View>
              <Txt style={{ fontSize: 15, color: th.text2, writingDirection: lang === 'ar' ? 'ltr' : 'rtl' }}>{alt}</Txt>
              <View style={{ width: 22 }}>{on && <Icon name="check" size={20} color={th.tint} />}</View>
            </Press>
          );
        }}
      />
    </View>
  );
}
