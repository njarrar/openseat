import { CaretDown, WarningCircle } from '@phosphor-icons/react';
import { useLang } from '../i18n';
import type { ChipId } from '../i18n/types';
import type { Query } from '../lib/url';

interface Props {
  q: Query;
  open: ChipId | null;
  onOpen: (id: ChipId, el: HTMLElement) => void;
}

export function Sentence({ q, open, onOpen }: Props) {
  const { t, f } = useLang();
  const caret = <CaretDown class="caret" weight="bold" aria-hidden="true" />;
  const chip = (id: ChipId) => {
    const content = {
      program: [f.program(q.carrier), caret],
      cabin: [f.cabin(q.cabin), caret],
      pax: [t.search.pax(q.pax), caret],
      from: [f.city(q.from), <span class="code" key="c">{q.from}</span>, caret],
      to: [f.city(q.to), <span class="code" key="c">{q.to}</span>, caret],
      ret: [t.search.ret(q.ret), caret],
    }[id];
    const what = { program: t.picker.program, cabin: t.picker.cabin, pax: t.picker.pax, from: t.picker.from, to: t.picker.to, ret: t.picker.ret }[id];
    const value = id === 'from' || id === 'to' ? `${f.city(q[id])} ${q[id]}` : String(content[0]);
    return (
      <button
        type="button"
        class="chip"
        aria-haspopup="dialog"
        aria-expanded={open === id}
        aria-label={t.search.chipLabel(what, value)}
        onClick={(e) => onOpen(id, e.currentTarget)}
      >
        {content}
      </button>
    );
  };

  const segs = t.search.sentence();
  return (
    <form role="search" aria-labelledby="find-title" class="search-form" onSubmit={(e) => e.preventDefault()}>
      <h1 id="find-title" class="eyebrow">{t.search.eyebrow}</h1>
      <p class="sentence tight">
        {segs.map((s, i) => {
          if (typeof s !== 'string') return [i > 0 ? ' ' : '', chip(s.chip)];
          // Punctuation hugs the chip before it.
          const glued = /^[,.،]/.test(s);
          return glued ? s : (i > 0 ? ' ' : '') + s;
        })}
      </p>
      {q.from === q.to && (
        <p class="form-error" role="alert">
          <WarningCircle size={18} weight="fill" aria-hidden="true" />
          {t.search.sameAirport}
        </p>
      )}
    </form>
  );
}
