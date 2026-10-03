import { ArrowsClockwise, ArrowsLeftRight, Bell, BellRinging, CaretLeft, CaretRight, Check, Link } from '@phosphor-icons/react';
import { useEffect, useState } from 'preact/hooks';
import type { CabinId, CabinSummary, DayResult } from '@openseat/shared';
import { useLang } from '../i18n';
import { FlightCard } from './FlightCard';

interface Props {
  day: DayResult | undefined;
  summary: Record<CabinId, CabinSummary> | undefined;
  origin: string;
  destination: string;
  cabin: CabinId;
  pax: number;
  tripLine: string | null;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onCabin: (c: CabinId) => void;
  watching: boolean;
  onWatch: () => void;
  onCopy: () => void;
  copied: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export function DayPanel(p: Props) {
  const { t, f } = useLang();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => setExpanded(null), [p.day?.date, p.cabin]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  if (!p.day || !p.summary) {
    return (
      <div class="panel-head" aria-busy="true">
        <span class="skel" style={{ height: '30px', width: '60%' }} />
        <span class="skel" style={{ height: '18px', width: '85%' }} />
        <span class="skel" style={{ height: '160px', borderRadius: '20px' }} />
      </div>
    );
  }

  const s = p.summary[p.cabin];
  const total = p.day.itineraries.length;
  return (
    <>
      <div class="panel-head">
        <div class="panel-title">
          <h3>{f.dateLong(p.day.date)}</h3>
          <button type="button" class="round" onClick={p.onPrev} disabled={!p.canPrev} aria-label={t.day.prev}>
            <CaretLeft size={16} class="flip" aria-hidden="true" />
          </button>
          <button type="button" class="round" onClick={p.onNext} disabled={!p.canNext} aria-label={t.day.next}>
            <CaretRight size={16} class="flip" aria-hidden="true" />
          </button>
        </div>
        <p class="panel-sub">
          {total ? t.day.sub(s.qualifying, total, p.origin, p.destination, f.cabin(p.cabin)) : t.day.noFlights(p.origin, p.destination)}
        </p>
        {p.tripLine && (
          <p class="trip"><ArrowsLeftRight size={16} aria-hidden="true" />{p.tripLine}</p>
        )}
        <div class="actions">
          <button type="button" class="action watch" aria-pressed={p.watching} onClick={p.onWatch}>
            {p.watching ? <BellRinging size={16} weight="fill" aria-hidden="true" /> : <Bell size={16} aria-hidden="true" />}
            {p.watching ? t.day.alertOn : t.day.alertOff}
          </button>
          <button type="button" class="action" onClick={p.onCopy}>
            {p.copied ? <Check size={16} aria-hidden="true" /> : <Link size={16} aria-hidden="true" />}
            {p.copied ? t.day.copied : t.day.copy}
          </button>
        </div>
        <div class="actions">
          <span class="fresh">{t.day.updated(f.ago(p.day.checkedAt, now))}</span>
          <button type="button" class="action" onClick={p.onRefresh} disabled={p.refreshing} style={{ height: '32px', fontSize: '13px', padding: '0 12px' }}>
            <ArrowsClockwise size={14} aria-hidden="true" />
            {p.refreshing ? t.day.refreshing : t.day.refresh}
          </button>
        </div>
      </div>
      {p.day.itineraries.map((it) => (
        <FlightCard
          key={it.key + it.date}
          it={it}
          cabin={p.cabin}
          pax={p.pax}
          expanded={expanded === it.key}
          onToggle={() => setExpanded(expanded === it.key ? null : it.key)}
          onCabin={p.onCabin}
        />
      ))}
    </>
  );
}
