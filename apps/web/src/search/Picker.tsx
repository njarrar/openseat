import { Check, X } from '@phosphor-icons/react';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { AIRPORTS, CABINS, CARRIERS, MAX_PAX, RETURN_OPTIONS } from '@openseat/shared';
import { useLang } from '../i18n';
import type { ChipId } from '../i18n/types';
import { backdropClose, useModal } from '../lib/hooks';
import type { Query } from '../lib/url';

const POPULAR: [string, string][] = [['DXB', 'LHR'], ['DOH', 'NRT'], ['AUH', 'BKK'], ['DXB', 'MLE'], ['RUH', 'LHR'], ['KWI', 'JFK']];

interface Option {
  key: string;
  label: string;
  sub?: string;
  alt?: { text: string; lang: 'ar' | 'en' };
  selected: boolean;
  patch: Partial<Query>;
}

interface Props {
  kind: ChipId | null;
  anchor: HTMLElement | null;
  q: Query;
  isMobile: boolean;
  onPick: (patch: Partial<Query>) => void;
  onClose: () => void;
}

export function Picker({ kind, anchor, q, isMobile, onPick, onClose }: Props) {
  const { t, f, lang } = useLang();
  const ref = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  useModal(ref, !!kind, onClose);

  // On desktop the picker sits 8px under the button that opened it.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !kind) return;
    setQuery('');
    if (isMobile || !anchor) {
      el.style.top = el.style.left = el.style.right = '';
      return;
    }
    const r = anchor.getBoundingClientRect();
    const w = Math.min(380, document.documentElement.clientWidth - 24);
    const vw = document.documentElement.clientWidth;
    const left = lang === 'ar' ? Math.max(12, Math.min(r.right - w, vw - w - 12)) : Math.max(12, Math.min(r.left, vw - w - 12));
    const top = Math.min(r.bottom + 8, window.innerHeight - 200);
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
    el.style.maxHeight = `${Math.min(460, window.innerHeight - top - 12)}px`;
  }, [kind, anchor, isMobile]);

  let title = '';
  let options: Option[] = [];
  const search = kind === 'from' || kind === 'to';
  if (kind === 'program') {
    title = t.picker.program;
    options = CARRIERS.map((c) => ({ key: c.id, label: f.program(c.id), sub: t.picker.programSub(f.unit(c.id), f.city(c.hub)), selected: c.id === q.carrier, patch: { carrier: c.id } }));
  } else if (kind === 'cabin') {
    title = t.picker.cabin;
    options = CABINS.map((c) => ({ key: c.id, label: f.cabin(c.id), sub: c.id === 'premium' ? t.picker.premiumSub : undefined, selected: c.id === q.cabin, patch: { cabin: c.id } }));
  } else if (kind === 'pax') {
    title = t.picker.pax;
    options = Array.from({ length: MAX_PAX }, (_, i) => i + 1).map((n) => ({ key: String(n), label: t.search.pax(n), sub: t.picker.paxSub(n) || undefined, selected: n === q.pax, patch: { pax: n } }));
  } else if (kind === 'ret') {
    title = t.picker.ret;
    options = RETURN_OPTIONS.map((r) => ({ key: String(r), label: t.picker.retOption(r), sub: t.picker.retSub(r), selected: r === q.ret, patch: { ret: r } }));
  } else if (search) {
    title = kind === 'from' ? t.picker.from : t.picker.to;
    const raw = query.trim(), qq = raw.toLowerCase();
    options = AIRPORTS.filter((a) => !raw || a.code.toLowerCase().includes(qq) || a.city.toLowerCase().includes(qq) || a.country.toLowerCase().includes(qq) || a.cityAr.includes(raw) || a.countryAr.includes(raw))
      .map((a) => ({
        key: a.code,
        label: `${f.city(a.code)} (${a.code})`,
        sub: f.country(a.code),
        // Show the name in the other script, so both work as search terms.
        alt: lang === 'ar' ? { text: a.city, lang: 'en' } : { text: a.cityAr, lang: 'ar' },
        selected: a.code === q[kind],
        patch: { [kind]: a.code },
      }));
  }

  return (
    <dialog ref={ref} class="picker" aria-label={title} onClick={backdropClose}>
      {kind && (
        <>
          <div class="picker-head">
            <h2>{title}</h2>
            <button type="button" class="icon-btn" onClick={() => ref.current?.close()} aria-label={t.picker.close}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          {search && (
            <label class="field">
              {t.picker.airportLabel}
              <input
                class="input"
                value={query}
                onInput={(e) => setQuery(e.currentTarget.value)}
                placeholder={t.picker.airportPlaceholder}
                autoFocus
                autocomplete="off"
                spellcheck={false}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && options[0]) {
                    e.preventDefault();
                    onPick(options[0].patch);
                  }
                }}
              />
            </label>
          )}
          <div class="options">
            {search && !query.trim() && (
              <div class="popular">
                <span>{t.picker.popular}</span>
                <div class="popular-list">
                  {POPULAR.map(([o, d]) => (
                    <button type="button" key={o + d} onClick={() => onPick({ from: o, to: d })} aria-label={t.picker.routeAria(f.city(o), f.city(d))}>
                      {o} → {d}
                    </button>
                  ))}
                </div>
                <span style={{ paddingTop: '8px' }}>{t.picker.all}</span>
              </div>
            )}
            {options.map((o) => (
              <button type="button" key={o.key} class="option" aria-current={o.selected} autoFocus={!search && o.selected} onClick={() => onPick(o.patch)}>
                <span class="option-text">
                  <span class="option-label">{o.label}</span>
                  {o.sub && <span class="option-sub">{o.sub}</span>}
                </span>
                {o.alt && <span class="option-alt" lang={o.alt.lang} dir={o.alt.lang === 'ar' ? 'rtl' : 'ltr'}>{o.alt.text}</span>}
                <span class="option-check">{o.selected && <Check size={18} weight="bold" aria-hidden="true" />}</span>
              </button>
            ))}
            {search && options.length === 0 && <p class="options-empty">{t.picker.empty}</p>}
          </div>
        </>
      )}
    </dialog>
  );
}
