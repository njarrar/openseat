import { useLocales } from 'expo-localization';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { load, save } from '../lib/storage';
import { APP_DICTS, DICTS, pickLang, type AppDict, type Dict, type Lang } from './dicts';
import { makeFormat, type Format } from './format';

export type { Lang } from './dicts';

/** 'system' follows the device language; the others are a choice made in Settings. */
export type LangSetting = 'system' | Lang;

const KEY = 'openseat-lang';

interface LangValue {
  lang: Lang;
  rtl: boolean;
  setting: LangSetting;
  deviceLang: Lang;
  setSetting: (s: LangSetting) => void;
  t: Dict;
  a: AppDict;
  f: Format;
}

const Ctx = createContext<LangValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [setting, setSettingState] = useState<LangSetting>('system');
  // Updates when the device language changes while the app is open.
  const deviceLang = pickLang(useLocales()[0]?.languageCode);

  useEffect(() => {
    load<LangSetting>(KEY).then((s) => {
      if (s === 'en' || s === 'ar') setSettingState(s);
    });
  }, []);

  const lang = setting === 'system' ? deviceLang : setting;
  const value = useMemo<LangValue>(() => ({
    lang,
    rtl: lang === 'ar',
    setting,
    deviceLang,
    setSetting: (s) => {
      setSettingState(s);
      save(KEY, s === 'system' ? null : s);
    },
    t: DICTS[lang],
    a: APP_DICTS[lang],
    f: makeFormat(lang),
  }), [lang, setting, deviceLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLang outside LangProvider');
  return v;
}
