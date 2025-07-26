'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { aiTranslationFlow, batchTranslationFlow } from '@/ai/flows/ai-translation';

interface TranslationCache {
  [key: string]: {
    text: string;
    confidence: number;
    timestamp: number;
  };
}

export const useAiTranslation = () => {
  const [mounted, setMounted] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<string>('en');
  const [translationCache, setTranslationCache] = useState<TranslationCache>({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Only use router after component is mounted
  const router = mounted ? useRouter() : null;
  const pathname = mounted ? usePathname() : '';

  // Get locale from URL or default to 'en'
  const locale = useMemo(() => {
    if (typeof window !== 'undefined') {
      const pathSegments = window.location.pathname.split('/');
      const localeFromPath = pathSegments[1];
      if (['en', 'ka', 'tn', 'hi'].includes(localeFromPath)) {
        return localeFromPath;
      }
    }
    return 'en';
  }, []);

  // Initialize currentLocale with the detected locale
  useEffect(() => {
    setCurrentLocale(locale);
  }, [locale]);

  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  const changeLanguage = useCallback(async (newLocale: string) => {
    if (newLocale === currentLocale || !router) return;
    
    setIsTranslating(true);
    try {
      // Update the URL to include the new locale
      const newPath = `/${newLocale}${pathname}`;
      router.push(newPath);
      
      // Update current locale
      setCurrentLocale(newLocale);
      
      // Trigger translation of dynamic content
      setTimeout(() => {
        translateDynamicContent(currentLocale, newLocale);
      }, 100);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsTranslating(false);
    }
  }, [router, pathname, currentLocale]);

  const getLocaleName = useCallback((localeCode: string) => {
    const localeNames: Record<string, string> = {
      'en': 'English',
      'ka': 'ಕನ್ನಡ',
      'tn': 'தமிழ்',
      'hi': 'हिन्दी'
    };
    return localeNames[localeCode] || localeCode;
  }, []);

  // Translate a single text with caching
  const translateText = useCallback(async (
    text: string, 
    targetLang?: string, 
    context?: string
  ): Promise<string> => {
    const targetLanguage = targetLang || locale || 'en';
    
    // Check cache first
    const cacheKey = `${text}_${targetLanguage}`;
    const cached = translationCache[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes cache
      return cached.text;
    }

    try {
      const result = await aiTranslationFlow({
        text,
        sourceLanguage: 'en', // Assuming English as source
        targetLanguage,
        context,
      });

      // Update cache
      setTranslationCache(prev => ({
        ...prev,
        [cacheKey]: {
          text: result.translatedText,
          confidence: result.confidence,
          timestamp: Date.now(),
        }
      }));

      return result.translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original text
    }
  }, [locale, translationCache]);

  // Translate multiple texts in batch
  const translateBatch = useCallback(async (
    texts: Array<{ key: string; text: string; context?: string }>,
    targetLang?: string
  ): Promise<Record<string, string>> => {
    const targetLanguage = targetLang || locale || 'en';
    
    try {
      const result = await batchTranslationFlow({
        texts,
        sourceLanguage: 'en', // Assuming English as source
        targetLanguage,
      });

      // Update cache
      const newCacheEntries: TranslationCache = {};
      result.translations.forEach(translation => {
        const cacheKey = `${translation.key}_${targetLanguage}`;
        newCacheEntries[cacheKey] = {
          text: translation.translatedText,
          confidence: translation.confidence,
          timestamp: Date.now(),
        };
      });

      setTranslationCache(prev => ({
        ...prev,
        ...newCacheEntries,
      }));

      // Return as key-value pairs
      const translations: Record<string, string> = {};
      result.translations.forEach(translation => {
        translations[translation.key] = translation.translatedText;
      });

      return translations;
    } catch (error) {
      console.error('Batch translation error:', error);
      // Fallback to original texts
      const fallback: Record<string, string> = {};
      texts.forEach(item => {
        fallback[item.key] = item.text;
      });
      return fallback;
    }
  }, [locale]);

  // Translate dynamic content on the page
  const translateDynamicContent = useCallback(async (
    sourceLang: string, 
    targetLang: string
  ) => {
    // Get all translatable elements on the page
    const translatableElements = document.querySelectorAll('[data-translate]');
    const textsToTranslate: Array<{ key: string; text: string; context?: string }> = [];

    translatableElements.forEach((element, index) => {
      const text = element.textContent?.trim();
      const context = element.getAttribute('data-translate-context');
      const key = element.getAttribute('data-translate-key') || `dynamic_${index}`;
      
      if (text) {
        textsToTranslate.push({
          key,
          text,
          context: context || undefined,
        });
      }
    });

    if (textsToTranslate.length > 0) {
      try {
        const translations = await translateBatch(textsToTranslate, targetLang);
        
        // Apply translations to DOM elements
        translatableElements.forEach((element, index) => {
          const key = element.getAttribute('data-translate-key') || `dynamic_${index}`;
          const translatedText = translations[key];
          
          if (translatedText && element.textContent) {
            element.textContent = translatedText;
          }
        });
      } catch (error) {
        console.error('Error translating dynamic content:', error);
      }
    }
  }, [translateBatch]);

  // Clear translation cache
  const clearCache = useCallback(() => {
    setTranslationCache({});
  }, []);

  // Get cached translation or null if not cached
  const getCachedTranslation = useCallback((text: string, targetLang?: string): string | null => {
    const targetLanguage = targetLang || locale;
    const cacheKey = `${text}_${targetLanguage}`;
    const cached = translationCache[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached.text;
    }
    
    return null;
  }, [locale, translationCache]);

  // Return fallback values if not mounted yet
  if (!mounted) {
    return {
      locale: 'en',
      changeLanguage: async () => {},
      getLocaleName,
      translateText: async (text: string) => text,
      translateBatch: async (texts: any[]) => ({}),
      translateDynamicContent: async () => {},
      clearCache: () => {},
      getCachedTranslation: () => null,
      isTranslating: false,
      isRTL: false,
    };
  }

  return {
    locale,
    changeLanguage,
    getLocaleName,
    translateText,
    translateBatch,
    translateDynamicContent,
    clearCache,
    getCachedTranslation,
    isTranslating,
    isRTL: false,
  };
}; 