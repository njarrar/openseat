import { memo } from 'preact/compat';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import { addDays, weekday, type CabinId, type CabinSummary } from '@openseat/shared';
import { useLang } from '../i18n';

export const level = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3);
export const countText = (n: number) => (n === 0 ? '' : n >= 4 ? '4+' : String(n));

type CellState = 'ready' | 'pending' | 'failed';

interface CellProps {
  idx: number;
  day: number;
  count: number;
  state: CellState;
  selected: boolean;
  fit: boolean;
  label: string;
  onPick: (idx: number) => void;
}

// Memoised so that moving the selection only re-renders the two cells that changed.
const DayCell = memo(function DayCell({ idx, day, count, state, selected, fit, label, onPick }: CellProps) {
  const cls = state === 'ready' ? `day h${level(count)}` : `day ${state}`;
  return (
    <button
      type="button"
      class={cls}
      data-idx={idx}
      tabIndex={selected ? 0 : -1}
      aria-pressed={selected}
      aria-label={label}
      onClick={() => onPick(idx)}
    >
      <span class="day-n" aria-hidden="true">{day}</span>
      <span class="day-c" aria-hidden="true">{state === 'ready' ? countText(count) : ''}</span>
      {fit && <span class="day-fit" aria-hidden="true" />}
    </button>
  );
});

interface Props {
  dates: string[];
  summaries: Map<string, Record<CabinId, CabinSummary>>;
  failed: Set<string>;
  cabin: CabinId;
  selIdx: number;
  minIdx: number;
  fitRange: [number, number] | null;
  unit: string;
  ariaLabel: string;
  onSelect: (idx: number, fromKeyboard: boolean) => void;
}

export function Calendar({ dates, summaries, failed, cabin, selIdx, minIdx, fitRange, unit, ariaLabel, onSelect }: Props) {
  const { t, f } = useLang();
  const root = useRef<HTMLDivElement>(null);
  const focusNext = useRef(false);
  // Where the last key press sent us, so fast repeats keep counting before the re-render lands.
  const pending = useRef<number | null>(null);
  const select = useRef(onSelect);
  select.current = onSelect;
  const onPick = useMemo(() => (idx: number) => {
    pending.current = null;
    select.current(idx, false);
  }, []);

  // Month grids, Monday first. Days before the window (or before the outbound day) are plain numbers.
  const months = useMemo(() => {
    if (!dates.length) return [];
    const index = new Map(dates.map((d, i) => [d, i]));
    const out: { key: string; cells: (string | null)[] }[] = [];
    let cur = dates[0].slice(0, 8) + '01';
    const last = dates[dates.length - 1];
    while (cur <= last) {
      const cells: (string | null)[] = Array.from({ length: weekday(cur) }, () => null);
      const month = cur.slice(0, 7);
      for (let d = cur; d.slice(0, 7) === month; d = addDays(d, 1)) cells.push(d);
      out.push({ key: cur, cells });
      cur = addDays(cells[cells.length - 1]!, 1);
    }
    return out.map((m) => ({ ...m, index }));
  }, [dates]);

  useEffect(() => {
    if (!focusNext.current) return;
    // Wait for the last requested day if more key presses are still landing.
    if (pending.current !== null && pending.current !== selIdx) return;
    pending.current = null;
    focusNext.current = false;
    root.current?.querySelector<HTMLElement>(`[data-idx="${selIdx}"]`)?.focus();
  }, [selIdx]);

  const onKey = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement;
    if (el.dataset.idx == null) return;
    // In right-to-left layout the next day sits to the left.
    const rtl = t.dir === 'rtl';
    const step = ({ ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[e.key];
    if (step == null) return;
    e.preventDefault();
    const from = pending.current ?? Number(el.dataset.idx);
    const next = Math.max(minIdx, Math.min(dates.length - 1, from + step));
    pending.current = next;
    focusNext.current = true;
    select.current(next, true);
  };

  return (
    <div class="months" role="group" aria-label={ariaLabel} ref={root} onKeyDown={onKey}>
      {months.map((m) => (
        <div class="month" key={m.key}>
          <h3>{f.month(m.key)}</h3>
          <div class="grid7 dow" aria-hidden="true">{t.cal.weekdays.map((w) => <span key={w}>{w}</span>)}</div>
          <div class="grid7">
            {m.cells.map((d, j) => {
              if (!d) return <span key={'b' + j} aria-hidden="true" />;
              const i = m.index.get(d);
              const dayNum = Number(d.slice(8));
              if (i === undefined || i < minIdx) {
                return <span key={d} class="day static" aria-hidden="true"><span class="day-n">{dayNum}</span></span>;
              }
              const s = summaries.get(d)?.[cabin];
              const state: CellState = s ? 'ready' : failed.has(d) ? 'failed' : 'pending';
              const fit = !!fitRange && i >= fitRange[0] && i <= fitRange[1];
              const date = f.dateLong(d);
              const label = state === 'pending' ? t.cal.dayPending(date)
                : state === 'failed' ? t.cal.dayFailed(date)
                : s!.count ? t.cal.dayAria(date, t.cal.seats(s!.count), f.num(s!.minMiles), unit, fit)
                : t.cal.dayNone(date, f.cabin(cabin));
              return (
                <DayCell key={d} idx={i} day={dayNum} count={s?.count ?? 0} state={state} selected={i === selIdx} fit={fit} label={label} onPick={onPick} />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
