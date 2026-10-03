import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AlertRequest } from '@openseat/shared';
import { human } from './botcheck';
import { loadAlerts, turnOff, turnOn, type AlertMap, type TurnOnResult } from './alerts';

interface AlertsValue {
  alerts: AlertMap;
  on: (req: AlertRequest, turnstileToken?: string) => Promise<TurnOnResult>;
  off: (key: string) => Promise<boolean>;
  /** Turns a removed alert back on (the Undo in the toast), with a bot check when the API wants one. */
  restore: (req: AlertRequest, lang: string) => Promise<boolean>;
}

const Ctx = createContext<AlertsValue | null>(null);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertMap>({});
  useEffect(() => {
    loadAlerts().then(setAlerts);
  }, []);
  const on = useCallback(async (req: AlertRequest, turnstileToken?: string) => {
    const r = await turnOn(req, turnstileToken);
    if (r.ok) setAlerts(r.all);
    return r;
  }, []);
  const off = useCallback(async (key: string) => {
    const next = await turnOff(key);
    if (next) setAlerts(next);
    return !!next;
  }, []);
  const restore = useCallback(async (req: AlertRequest, lang: string) => {
    const check = await human(lang);
    return check.ok && (await on(req, check.token)).ok;
  }, [on]);
  const value = useMemo(() => ({ alerts, on, off, restore }), [alerts, on, off, restore]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAlerts() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAlerts outside AlertsProvider');
  return v;
}
