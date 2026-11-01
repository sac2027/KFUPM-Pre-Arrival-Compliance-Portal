import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import ar from './ar.json';
import en from './en.json';

export type Locale = 'en' | 'ar';
export type Dir = 'ltr' | 'rtl';
export type MessageKey = keyof typeof en;

const DICTS: Record<Locale, Record<string, string>> = { en, ar };
const STORAGE_KEY = 'pacf.locale';

/** Looks up `key`. Strict mode (dev/test) throws on a missing key; production returns the key itself. */
export function translate(dict: Record<string, string>, key: string, strict: boolean): string {
  const value = dict[key];
  if (value !== undefined) return value;
  if (strict) throw new Error(`Missing translation key: ${key}`);
  return key;
}

export function detectLocale(language: string | undefined): Locale {
  return language?.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

function readStoredLocale(): Locale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'ar' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

interface I18nValue {
  locale: Locale;
  dir: Dir;
  t: (key: MessageKey) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    () => initialLocale ?? readStoredLocale() ?? detectLocale(globalThis.navigator?.language),
  );
  const dir: Dir = locale === 'ar' ? 'rtl' : 'ltr';

  const t = useCallback(
    (key: MessageKey) => translate(DICTS[locale], key, import.meta.env.DEV),
    [locale],
  );

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next); // convenience only; never PII
    } catch {
      /* storage unavailable (private mode, blocked): the app still works */
    }
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
    document.title = `${translate(DICTS[locale], 'app.title', false)} | KFUPM`;
  }, [locale, dir]);

  const value = useMemo(() => ({ locale, dir, t, setLocale }), [locale, dir, t, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
