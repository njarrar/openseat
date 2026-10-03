import { ArrowRight, ArrowUpRight, CaretDown, Warning } from '@phosphor-icons/react';
import { CABINS, CARRIER_BY_ID, type CabinId, type Itinerary } from '@openseat/shared';
import { useLang } from '../i18n';
import { productBadges } from '../lib/product';

interface Props {
  it: Itinerary;
  cabin: CabinId;
  pax: number;
  expanded: boolean;
  onToggle: () => void;
  onCabin: (c: CabinId) => void;
}

export function FlightCard({ it, cabin, pax, expanded, onToggle, onCabin }: Props) {
  const { t, f } = useLang();
  const fare = it.cabins[cabin];
  const ok = fare.seats !== null && fare.seats >= pax;
  const carrier = CARRIER_BY_ID[it.carrier];
  const unit = f.unit(it.carrier);
  const nums = it.legs.length ? it.legs.map((l) => l.flight) : [it.key];
  const others = CABINS.filter((c) => c.id !== cabin && (it.cabins[c.id].seats ?? -1) >= pax);
  const badges = productBadges(it, cabin);
  const paxText = t.search.pax(pax);
  const id = `howto-${it.key}-${it.date}`;
  const meta = [
    nums.join(' + '),
    it.aircraft,
    it.hub ? t.flight.stop(f.city(it.hub), f.duration(it.layoverMin)) : t.flight.nonstop,
    f.duration(it.durationMin),
  ].join(t.dir === 'rtl' ? '، ' : ', ');

  return (
    <article class="card flight">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span class="times ltr">
          {it.dep}
          <ArrowRight size={15} aria-hidden="true" />
          {it.arr}
          {it.dayOffset > 0 && <sup>+{it.dayOffset}</sup>}
        </span>
        <span class="meta">{meta}</span>
      </div>

      {(badges.length > 0 || it.separateTickets || (ok && !fare.saver)) && (
        <div class="badges">
          {badges.includes('qsuite') && <span class="badge">Qsuite</span>}
          {badges.includes('a380') && <span class="badge">A380</span>}
          {ok && !fare.saver && <span class="badge" title={t.flight.flexTitle}>{t.flight.flex}</span>}
          {it.separateTickets && <span class="badge warn"><Warning size={13} weight="bold" aria-hidden="true" />{t.flight.separate}</span>}
        </div>
      )}

      <div class="price">
        {ok ? (
          <>
            <span class="price-main">{f.num(fare.miles!)} <small>{unit}</small></span>
            <span class="price-sub">
              {t.flight.taxes(f.money(fare.tax!, it.currency), fare.seats!)}
              {fare.saver && <>{' '}<span class="badge saver" style={{ height: '20px', marginInlineStart: '4px' }}>{t.flight.saver}</span></>}
            </span>
          </>
        ) : (
          <span class="unavail">{fare.seats === null ? t.flight.notOffered(f.cabin(cabin)) : t.flight.noSeats(f.cabin(cabin))}</span>
        )}
      </div>

      {it.separateTickets && <p class="note-warn">{t.flight.separateNote}</p>}

      {others.length > 0 && (
        <div class="others">
          <span>{t.flight.alsoOpen}</span>
          {others.map((c) => (
            <button type="button" key={c.id} class="other" onClick={() => onCabin(c.id)}>
              {f.cabinShort(c.id)}
              <span class="mono">{Math.round((it.cabins[c.id].miles ?? 0) / 1000)}k</span>
            </button>
          ))}
        </div>
      )}

      <button type="button" class="disclose" aria-expanded={expanded} aria-controls={id} onClick={onToggle}>
        {t.flight.howToBook}
        <CaretDown size={15} weight="bold" aria-hidden="true" />
      </button>
      {expanded && (
        <div class="howto" id={id}>
          <ol class="steps">
            <li>{t.flight.step1(f.programOnly(it.carrier), carrier.site)}</li>
            <li>{t.flight.step2(it.origin, it.destination, f.dateLong(it.date), f.term(it.carrier))}</li>
            <li>
              {ok
                ? t.flight.step3(nums.join(t.flight.and), f.cabin(cabin), paxText, f.num(fare.miles! * pax), unit, f.money(fare.tax! * pax, it.currency))
                : t.flight.step3None(f.cabin(cabin), paxText)}
            </li>
          </ol>
          {/* The airline sites do not take reward searches in the URL, so this opens the home page. */}
          <a class="btn" href={carrier.url} target="_blank" rel="noopener noreferrer">
            {t.flight.open(carrier.site)}
            <ArrowUpRight size={16} class="flip" aria-hidden="true" />
          </a>
        </div>
      )}
    </article>
  );
}
