'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, LocaleKey } from '@omniflow/shared';

interface I18nContextType {
  locale: LocaleKey;
  setLocale: (l: LocaleKey) => void;
  t: (typeof translations)['en'];
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: translations.en,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleKey>('en');

  useEffect(() => {
    const saved = localStorage.getItem('omniflow_locale') as LocaleKey;
    if (saved && (saved === 'en' || saved === 'bn')) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (l: LocaleKey) => {
    setLocaleState(l);
    localStorage.setItem('omniflow_locale', l);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
