import { useEffect, useRef, useState } from 'react';
import type { DayResult, SearchParams } from '@openseat/shared';
import { openSearch } from './stream';

export type Phase = 'starting' | 'streaming' | 'done' | 'stopped';

export interface SearchState {
  dates: string[];
  days: Map<string, DayResult>;
  phase: Phase;
  done: number;
  total: number;
  /** Dates we could not read this time and have nothing saved for. */
  failed: Set<string>;
  stop: () => void;
  restart: () => void;
}

type Data = Omit<SearchState, 'stop' | 'restart'>;
const empty = (): Data => ({ dates: [], days: new Map(), phase: 'starting', done: 0, total: 0, failed: new Set() });

/** Runs one streaming search per set of params. A new search replaces the old one. */
export function useSearch(p: SearchParams | null): SearchState {
  const [run, setRun] = useState(0);
  const [state, setState] = useState<Data>(empty);
  const close = useRef<() => void>(() => {});
  const key = p ? `${p.carrier}:${p.origin}:${p.destination}:${p.pax}` : '';

  useEffect(() => {
    if (!p) return;
    setState(empty());
    close.current = openSearch(p, {
      onEvent: (e) => {
        setState((s) => {
          switch (e.type) {
            case 'meta':
              return { ...s, dates: e.dates, phase: 'streaming' };
            case 'days': {
              const days = new Map(s.days);
              const failed = new Set(s.failed);
              for (const d of e.days) {
                days.set(d.date, d);
                failed.delete(d.date);
              }
              return { ...s, days, failed };
            }
            case 'progress':
              return { ...s, done: e.done, total: e.total };
            case 'error': {
              const failed = new Set(s.failed);
              for (const d of e.dates ?? s.dates) if (!s.days.has(d)) failed.add(d);
              return { ...s, failed };
            }
            case 'done':
              return { ...s, phase: s.phase === 'stopped' ? 'stopped' : 'done' };
          }
        });
      },
    });
    return () => close.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, run]);

  return {
    ...state,
    stop: () => {
      close.current();
      setState((s) => ({ ...s, phase: 'stopped' }));
    },
    restart: () => setRun((n) => n + 1),
  };
}
