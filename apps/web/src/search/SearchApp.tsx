import { BellRinging, X } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { summarise, type CabinId, type CabinSummary, type DayResult, type SearchParams } from '@openseat/shared';
import { Footer, Header } from '../components/Shell';
import { useLang } from '../i18n';
import type { ChipId } from '../i18n/types';
import { alertKey, turnOff, turnOn, watchedKeys } from '../lib/alerts';
import { requestRefresh } from '../lib/api';
import { backdropClose, useMedia, useModal } from '../lib/hooks';
import { readQuery, shareUrl, writeQuery, type Query } from '../lib/url';
import { useSearch, type SearchState } from '../lib/useSearch';
import { AlertDialog } from './AlertDialog';
import { Calendar } from './Calendar';
import { DayPanel } from './DayPanel';
import { HowItWorks } from './HowItWorks';
import { Picker } from './Picker';
import { Sentence } from './Sentence';

const SAMPLE = import.meta.env.VITE_SAMPLE_DATA !== 'false';

function useSummaries(days: Map<string, DayResult>, pax: number) {
  return useMemo(() => {
    const out = new Map<string, Record<CabinId, CabinSummary>>();
    for (const [d, day] of days) out.set(d, summarise(day, pax));
    return out;
  }, [days, pax]);
}

function firstOpen(s: SearchState, sums: Map<string, Record<CabinId, CabinSummary>>, cabin: CabinId, lo: number, hi: number) {
  for (let i = Math.max(0, lo); i <= hi && i < s.dates.length; i++) if ((sums.get(s.dates[i])?.[cabin].count ?? 0) > 0) return i;
  return -1;
}

export function SearchApp() {
  const { t, f } = useLang();
  const [q, setQ] = useState<Query>(() => readQuery(location.search));
  const [leg, setLeg] = useState<'out' | 'ret'>('out');
  const [sel, setSel] = useState<{ out?: number; ret?: number }>({});
  const [open, setOpen] = useState<ChipId | null>(null);
  const anchor = useRef<HTMLElement | null>(null);
  const [sheet, setSheet] = useState(false);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const isMobile = useMedia('(max-width: 760px)');
  const [watched, setWatched] = useState(watchedKeys);
  const [toast, setToast] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertBusy, setAlertBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const timers = useRef<Record<string, number>>({});

  useEffect(() => writeQuery(q), [q]);
  useEffect(() => {
    if (!isMobile) setSheet(false);
  }, [isMobile]);

  const showToast = (msg: string) => {
    clearTimeout(timers.current.toast);
    setToast(msg);
    timers.current.toast = window.setTimeout(() => setToast(''), 3200);
  };

  const invalid = q.from === q.to;
  const outP = useMemo<SearchParams | null>(() => (invalid ? null : { carrier: q.carrier, origin: q.from, destination: q.to, pax: q.pax }), [q.carrier, q.from, q.to, q.pax, invalid]);
  const retP = useMemo<SearchParams | null>(() => (invalid || !q.ret ? null : { carrier: q.carrier, origin: q.to, destination: q.from, pax: q.pax }), [q.carrier, q.from, q.to, q.pax, q.ret, invalid]);
  const out = useSearch(outP);
  const back = useSearch(retP);
  const sumOut = useSummaries(out.days, q.pax);
  const sumRet = useSummaries(back.days, q.pax);

  // Default day: the first with seats. For a return, the first that fits the trip length.
  const last = Math.max(0, out.dates.length - 1);
  let outIdx = sel.out ?? firstOpen(out, sumOut, q.cabin, 0, last);
  if (outIdx < 0) outIdx = 0;
  let retIdx = 0;
  let fitRange: [number, number] | null = null;
  if (q.ret > 0) {
    const target = outIdx + q.ret;
    const lastRet = Math.max(0, back.dates.length - 1);
    fitRange = [Math.min(lastRet, target - 3), Math.min(lastRet, target + 3)];
    if (sel.ret != null && sel.ret >= outIdx) retIdx = sel.ret;
    else {
      let i = firstOpen(back, sumRet, q.cabin, fitRange[0], fitRange[1]);
      if (i < 0) i = firstOpen(back, sumRet, q.cabin, outIdx, lastRet);
      retIdx = i < 0 ? Math.min(lastRet, target) : i;
    }
  }
  const isRet = q.ret > 0 && leg === 'ret';
  const cur = isRet ? back : out;
  const sums = isRet ? sumRet : sumOut;
  const selIdx = isRet ? retIdx : outIdx;
  const minIdx = isRet ? outIdx : 0;
  const O = isRet ? q.to : q.from;
  const D = isRet ? q.from : q.to;
  const date = cur.dates[selIdx];
  const day = date ? cur.days.get(date) : undefined;
  const summary = date ? sums.get(date) : undefined;
  const curParams = isRet ? retP : outP;

  const onSelect = useCallback((idx: number, fromKeyboard: boolean) => {
    setSel((s) => ({ ...s, [isRet ? 'ret' : 'out']: idx }));
    if (!fromKeyboard && isMobile) setSheet(true);
  }, [isRet, isMobile]);

  const openPicker = (id: ChipId, el: HTMLElement) => {
    if (open === id) return setOpen(null);
    anchor.current = el;
    setOpen(id);
  };
  const closePicker = useCallback(() => {
    setOpen(null);
    anchor.current?.focus();
  }, []);
  const pick = (patch: Partial<Query>) => {
    setQ((prev) => ({ ...prev, ...patch }));
    setSel({});
    if ('ret' in patch) setLeg('out');
    closePicker();
  };

  useModal(sheetRef, sheet && isMobile, useCallback(() => setSheet(false), []));

  // Calendar heading and summary line.
  const unit = f.unit(q.carrier);
  const cabinName = f.cabin(q.cabin);
  const loaded = cur.dates.filter((d, i) => i >= minIdx && sums.has(d));
  const openDays = loaded.filter((d) => sums.get(d)![q.cabin].count > 0);
  const offered = [...sums.values()].some((s) => s[q.cabin].offered);
  const total = cur.dates.length - minIdx;
  const settled = cur.phase !== 'starting' && cur.phase !== 'streaming';
  const calSub = !settled && openDays.length === 0 ? t.cal.subLoading
    : !offered && settled ? t.cal.subNotOffered(f.programOnly(q.carrier), cabinName)
    : openDays.length ? t.cal.subFrom(cabinName, f.num(Math.min(...openDays.map((d) => sums.get(d)![q.cabin].minMiles))), unit, openDays.length, total)
    : t.cal.subNone(cabinName);
  const remaining = cur.dates.filter((d) => !cur.days.has(d) && !cur.failed.has(d)).length;

  const wk = alertKey({ carrier: q.carrier, origin: O, destination: D, cabin: q.cabin });
  const watching = watched.has(wk);
  const onWatch = async () => {
    if (!watching) return setAlertOpen(true);
    if (await turnOff(wk)) {
      setWatched(watchedKeys());
      showToast(t.alert.off);
    } else showToast(t.alert.failed);
  };
  const submitAlert = async (address: string) => {
    setAlertBusy(true);
    const ok = await turnOn({ carrier: q.carrier, origin: O, destination: D, cabin: q.cabin, pax: q.pax, channel: 'email', address });
    setAlertBusy(false);
    setAlertOpen(false);
    if (ok) {
      setWatched(watchedKeys());
      showToast(t.alert.on(cabinName, O, D));
    } else showToast(t.alert.failed);
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard?.writeText(shareUrl(q));
    } catch {
      /* clipboard blocked; the address bar has the same link */
    }
    setCopied(true);
    clearTimeout(timers.current.copy);
    timers.current.copy = window.setTimeout(() => setCopied(false), 1600);
  };

  const onRefresh = async () => {
    if (!curParams) return;
    setRefreshing(true);
    const r = await requestRefresh(curParams);
    setRefreshing(false);
    if (r === 'ok') cur.restart();
    else showToast(r === 'wait' ? t.day.refreshWait : t.day.refreshFailed);
  };

  const shortDate = (s: SearchState, i: number) => (s.dates[i] ? f.dateShort(s.dates[i]) : '');
  const nights = retIdx - outIdx;
  const panel = (
    <DayPanel
      day={day}
      summary={summary}
      origin={O}
      destination={D}
      cabin={q.cabin}
      pax={q.pax}
      tripLine={q.ret > 0 && out.dates.length && back.dates.length ? t.day.trip(shortDate(out, outIdx), shortDate(back, retIdx), nights) : null}
      canPrev={selIdx > minIdx}
      canNext={selIdx < cur.dates.length - 1}
      onPrev={() => setSel((s) => ({ ...s, [isRet ? 'ret' : 'out']: Math.max(minIdx, selIdx - 1) }))}
      onNext={() => setSel((s) => ({ ...s, [isRet ? 'ret' : 'out']: Math.min(cur.dates.length - 1, selIdx + 1) }))}
      onCabin={(c) => setQ((prev) => ({ ...prev, cabin: c }))}
      watching={watching}
      onWatch={onWatch}
      onCopy={onCopy}
      copied={copied}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );

  return (
    <>
      <Header page="search" />
      <main class="wrap" id="top">
        <Sentence q={q} open={open} onOpen={openPicker} />

        {!invalid && (
          <section class="results" aria-label={t.cal.title(cabinName, 'one')}>
            <div class="card cal">
              {q.ret > 0 && (
                <div class="legs" role="tablist" aria-label={t.cal.tablist}>
                  {(['out', 'ret'] as const).map((id) => {
                    const s = id === 'ret' ? back : out;
                    return (
                      <button type="button" role="tab" key={id} class="leg" aria-selected={leg === id} onClick={() => setLeg(id)}>
                        <span class="leg-label">
                          {id === 'out' ? t.cal.outbound : t.cal.return}
                          <span class="mono ltr">{id === 'out' ? `${q.from} → ${q.to}` : `${q.to} → ${q.from}`}</span>
                        </span>
                        <span class="leg-date">{shortDate(s, id === 'out' ? outIdx : retIdx)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div class="cal-head">
                <h2>{t.cal.title(cabinName, q.ret > 0 ? (isRet ? 'ret' : 'out') : 'one')}</h2>
                <p aria-live="polite">{calSub}</p>
              </div>
              <ul class="legend">
                {t.cal.legend.map((label, h) => (
                  <li key={label}>
                    <span class="swatch" style={{ background: `var(--h${h}-bg)`, borderColor: `var(--h${h}-bd)`, color: `var(--h${h}-fg)` }}>{['', '1', '2', '4+'][h]}</span>
                    {label}
                  </li>
                ))}
                {isRet && <li><span class="swatch fit-key"><span /></span>{t.cal.fits(q.ret / 7)}</li>}
              </ul>

              {cur.phase === 'streaming' && cur.total > 0 && remaining > 0 && (
                <div class="status">
                  <div class="status-row">
                    <span>{t.cal.checking(remaining)}</span>
                    <button type="button" onClick={cur.stop}>{t.cal.stop}</button>
                  </div>
                  <div class="bar" role="progressbar" aria-valuemin={0} aria-valuemax={cur.total} aria-valuenow={cur.done} aria-label={t.cal.checking(remaining)}>
                    <span style={{ width: `${Math.max(4, (cur.done / cur.total) * 100)}%` }} />
                  </div>
                </div>
              )}
              {(cur.phase === 'stopped' || (cur.phase === 'done' && cur.failed.size > 0)) && (
                <div class="status">
                  <div class="status-row">
                    <span>{cur.phase === 'stopped' ? t.cal.stopped : t.cal.failed}</span>
                    <button type="button" onClick={cur.restart}>{t.cal.retry}</button>
                  </div>
                </div>
              )}

              {cur.dates.length === 0 ? (
                <div class="grid7" aria-busy="true" style={{ paddingTop: '28px' }}>
                  {Array.from({ length: 35 }, (_, i) => <span key={i} class="skel" style={{ animationDelay: `${(i % 7) * 0.05}s` }} />)}
                </div>
              ) : (
                <>
                  <Calendar
                    dates={cur.dates}
                    summaries={sums}
                    failed={cur.failed}
                    cabin={q.cabin}
                    selIdx={selIdx}
                    minIdx={minIdx}
                    fitRange={isRet ? fitRange : null}
                    unit={unit}
                    ariaLabel={t.cal.aria(O, D, cabinName)}
                    onSelect={onSelect}
                  />
                  <p class="cal-foot">{t.cal.keys}</p>
                </>
              )}
            </div>

            {isMobile ? (
              <dialog ref={sheetRef} class="sheet" aria-label={day ? f.dateLong(day.date) : t.cal.title(cabinName, 'one')} onClick={backdropClose}>
                <div class="sheet-bar">
                  <span />
                  <button type="button" onClick={() => sheetRef.current?.close()} aria-label={t.day.close}><X size={20} aria-hidden="true" /></button>
                </div>
                <div class="panel">{sheet && panel}</div>
              </dialog>
            ) : (
              <aside class="panel desk" aria-live="polite">{panel}</aside>
            )}
          </section>
        )}

        <HowItWorks />
        <Footer page="search" sample={SAMPLE} />
      </main>

      <Picker kind={open} anchor={anchor.current} q={q} isMobile={isMobile} onPick={pick} onClose={closePicker} />
      <AlertDialog
        open={alertOpen}
        busy={alertBusy}
        summary={t.alert.body(cabinName, O, D, f.program(q.carrier), t.search.pax(q.pax))}
        onSubmit={submitAlert}
        onClose={() => setAlertOpen(false)}
      />
      <div role="status" aria-live="polite">
        {toast && <div class="toast"><BellRinging size={16} aria-hidden="true" />{toast}</div>}
      </div>
    </>
  );
}

