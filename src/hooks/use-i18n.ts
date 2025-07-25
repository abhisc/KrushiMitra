'use client';

import { useRouter } from 'next/router';
import { useCallback } from 'react';

export const useI18n = () => {
  const router = useRouter();
  const { locale, locales, asPath } = router;

  const changeLanguage = useCallback((newLocale: string) => {
    router.push(asPath, asPath, { locale: newLocale });
  }, [router, asPath]);

  const getLocaleName = useCallback((localeCode: string) => {
    const localeNames: Record<string, string> = {
      'en': 'English',
      'hi': 'हिन्दी',
      'kn': 'ಕನ್ನಡ',
      'ta': 'தமிழ்'
    };
    return localeNames[localeCode] || localeCode;
  }, []);

  return {
    locale,
    locales,
    changeLanguage,
    getLocaleName,
    isRTL: false // Add RTL support if needed in the future
  };
}; 