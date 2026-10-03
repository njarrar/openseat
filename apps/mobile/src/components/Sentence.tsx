import { View } from 'react-native';
import type { ChipId } from '../i18n/dicts';
import { useLang } from '../i18n';
import type { Query } from '../lib/query';
import { useTheme } from '../theme';
import { Txt } from './ui';

/**
 * The website's search sentence: "Using [Emirates Skywards], show me [Business]
 * seats for [1 traveller] from [Dubai DXB] to [London LHR], [one way]."
 * Each green part opens its picker.
 */
export function Sentence({ q, onOpen }: { q: Query; onOpen: (id: ChipId) => void }) {
  const th = useTheme();
  const { t, f } = useLang();
  const what: Record<ChipId, string> = { program: t.picker.program, cabin: t.picker.cabin, pax: t.picker.pax, from: t.picker.from, to: t.picker.to, ret: t.picker.ret };
  const value: Record<ChipId, string> = {
    program: f.program(q.carrier),
    cabin: f.cabin(q.cabin),
    pax: t.search.pax(q.pax),
    from: `${f.city(q.from)} ${q.from}`,
    to: `${f.city(q.to)} ${q.to}`,
    ret: t.search.ret(q.ret),
  };
  const ios = th.look === 'ios';
  return (
    <View style={{ marginHorizontal: ios ? 20 : 16, padding: 16, borderRadius: ios ? 22 : 12, backgroundColor: th.card }}>
      <Txt style={{ fontSize: 21, lineHeight: 34, fontWeight: '500' }}>
        {t.search.sentence().map((s, i) => {
          if (typeof s === 'string') {
            // Punctuation hugs the chip before it.
            return /^[,.،]/.test(s) ? s : (i > 0 ? ' ' : '') + s;
          }
          return [
            i > 0 ? ' ' : '',
            <Txt
              key={s.chip}
              accessibilityRole="button"
              accessibilityLabel={t.search.chipLabel(what[s.chip], value[s.chip])}
              onPress={() => onOpen(s.chip)}
              style={{ fontSize: 21, color: th.tint, fontWeight: '600', backgroundColor: th.tintFill }}
            >
              {' ' + value[s.chip] + ' '}
            </Txt>,
          ];
        })}
      </Txt>
    </View>
  );
}
