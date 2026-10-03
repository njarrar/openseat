import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AlertRequest } from '@openseat/shared';
import { loadAlerts, turnOff, turnOn, type AlertMap } from './alerts';

interface AlertsValue {
  alerts: AlertMap;
  on: (req: AlertRequest) => Promise<boolean>;
  off: (key: string) => Promise<boolean>;
}

const Ctx = createContext<AlertsValue | null>(null);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertMap>({});
  useEffect(() => {
    loadAlerts().then(setAlerts);
  }, []);
  const on = useCallback(async (req: AlertRequest) => {
    const next = await turnOn(req);
    if (next) setAlerts(next);
    return !!next;
  }, []);
  const off = useCallback(async (key: string) => {
    const next = await turnOff(key);
    if (next) setAlerts(next);
    return !!next;
  }, []);
  const value = useMemo(() => ({ alerts, on, off }), [alerts, on, off]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAlerts() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAlerts outside AlertsProvider');
  return v;
}
