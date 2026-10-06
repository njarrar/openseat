import { useLocales } from 'expo-localization';
import { currencyForLocale, isCurrency, type CurrencyId } from '@openseat/shared';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { load, save } from '../lib/storage';
import { APP_DICTS, DICTS, isLang, pickLang, type AppDict, type Dict, type Lang } from './dicts';
import { makeFormat, type Format } from './format';

export type { Lang } from './dicts';
export { LANGS } from './dicts';

/** 'system' follows the device language; the others are a choice made in Settings. */
export type LangSetting = 'system' | Lang;

const KEY = 'openseat-lang';
const CURRENCY_KEY = 'openseat-currency';

interface LangValue {
  lang: Lang;
  rtl: boolean;
  setting: LangSetting;
  deviceLang: Lang;
  setSetting: (s: LangSetting) => void;
  /** Currency for taxes. Defaults to the device region (Saudi Arabia gives SAR). */
  currency: CurrencyId;
  setCurrency: (c: CurrencyId) => void;
  t: Dict;
  a: AppDict;
  f: Format;
}

const Ctx = createContext<LangValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [setting, setSettingState] = useState<LangSetting>('system');
  // Updates when the device language changes while the app is open.
  const locale = useLocales()[0];
  const deviceLang = pickLang(locale?.languageTag ?? locale?.languageCode);
  const [chosen, setChosen] = useState<CurrencyId | null>(null);
  const currency = chosen ?? currencyForLocale(`x-${locale?.regionCode ?? ''}`);

  useEffect(() => {
    load<LangSetting>(KEY).then((s) => {
      if (isLang(s)) setSettingState(s);
    });
    load<string>(CURRENCY_KEY).then((c) => {
      if (isCurrency(c)) setChosen(c);
    });
  }, []);

  const lang = setting === 'system' ? deviceLang : setting;
  const value = useMemo<LangValue>(() => ({
    lang,
    rtl: DICTS[lang].dir === 'rtl',
    setting,
    deviceLang,
    setSetting: (s) => {
      setSettingState(s);
      save(KEY, s === 'system' ? null : s);
    },
    currency,
    setCurrency: (c) => {
      setChosen(c);
      save(CURRENCY_KEY, c);
    },
    t: DICTS[lang],
    a: APP_DICTS[lang],
    f: makeFormat(lang, currency),
  }), [lang, setting, deviceLang, currency]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLang outside LangProvider');
  return v;
}
