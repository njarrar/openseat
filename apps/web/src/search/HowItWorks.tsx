import {
  AirplaneTilt, ArrowSquareOut, ArrowUp, ArrowsClockwise, CalendarCheck, CaretDown, Check, Handshake, Path, Receipt, TextAa, User, UsersThree,
} from '@phosphor-icons/react';
import { useState } from 'preact/hooks';
import { CARRIERS } from '@openseat/shared';
import { useLang } from '../i18n';
import { countText, level } from './Calendar';

const STEP_ICONS = [TextAa, CalendarCheck, AirplaneTilt, ArrowSquareOut];
const GOOD_ICONS = [ArrowsClockwise, User, UsersThree, Path, Receipt, Handshake];
const KEY = [
  { day: 14, count: 0, selected: false, fit: false },
  { day: 15, count: 1, selected: false, fit: false },
  { day: 16, count: 2, selected: false, fit: false },
  { day: 17, count: 4, selected: true, fit: false },
  { day: 29, count: 2, selected: false, fit: true },
];

export function HowItWorks() {
  const { t, f } = useLang();
  const [note, setNote] = useState<number | null>(0);
  return (
    <section id="how" class="how" aria-labelledby="how-title">
      <div class="how-intro">
        <h2 id="how-title">{t.how.title}</h2>
        <p>{t.how.intro} <a href="/how-to-use/">{t.how.examples}</a>.</p>
      </div>
      <div class="how-grid">
        <ol class="how-steps">
          {t.how.steps.map((s, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <li key={s.title}>
                <span class={'dot' + (i === 3 ? ' solid' : '')} aria-hidden="true"><Icon size={20} /></span>
                <div class="txt"><strong>{s.title}</strong><span>{s.text}</span></div>
              </li>
            );
          })}
        </ol>
        <div class="how-side">
          <div class="card key">
            <strong>{t.how.reading}</strong>
            {KEY.map((k, i) => (
              <div class="key-row" key={k.day}>
                <span class={`day h${level(k.count)}`} aria-hidden="true" style={k.selected ? { boxShadow: '0 0 0 2px var(--surface), 0 0 0 4px var(--ink)' } : undefined}>
                  <span class="day-n">{k.day}</span>
                  <span class="day-c">{countText(k.count)}</span>
                  {k.fit && <span class="day-fit" />}
                </span>
                <span>{t.how.key[i]}</span>
              </div>
            ))}
          </div>
          <div class="notes">
            <strong>{t.how.notesTitle}</strong>
            {CARRIERS.map((c, i) => {
              const open = note === i;
              return (
                <div class="acc" key={c.id}>
                  <button type="button" aria-expanded={open} onClick={() => setNote(open ? null : i)}>
                    <span class="code">{c.id}</span>
                    <span class="name">{f.program(c.id)}</span>
                    <CaretDown size={15} weight="bold" aria-hidden="true" />
                  </button>
                  {open && (
                    <ul>
                      {t.how.notes[c.id].map((n) => <li key={n}><Check size={15} weight="bold" aria-hidden="true" /><span>{n}</span></li>)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div class="good">
        <strong>{t.how.goodTitle}</strong>
        <div class="good-grid">
          {t.how.good.map((g, i) => {
            const Icon = GOOD_ICONS[i];
            return <div key={g}><Icon size={19} aria-hidden="true" /><span>{g}</span></div>;
          })}
        </div>
      </div>
      <a class="btn dark" href="#top"><ArrowUp size={16} aria-hidden="true" />{t.how.back}</a>
    </section>
  );
}
