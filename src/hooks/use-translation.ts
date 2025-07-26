'use client';

import { useCallback, useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { translateText, translateBatch } from '@/utils/language';

interface UseTranslationOptions {
  priority?: 'high' | 'normal' | 'low';
  cacheTimeout?: number;
}

export const useTranslation = (options: UseTranslationOptions = {}) => {
  const { currentLanguage, isTranslating } = useLanguage();
  const [translationCache, setTranslationCache] = useState<Map<string, { text: string; timestamp: number }>>(new Map());
  const [isTranslatingLocal, setIsTranslatingLocal] = useState(false);

  const { priority = 'normal', cacheTimeout = 300000 } = options;

  // Fast translation with local caching
  const translate = useCallback(async (text: string): Promise<string> => {
    if (currentLanguage === 'en') {
      return text;
    }

    if (!text || !text.trim()) {
      return text;
    }

    const cacheKey = `${text}_${currentLanguage}`;
    const cached = translationCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.text;
    }

    setIsTranslatingLocal(true);
    
    try {
      const translatedText = await translateText(text, currentLanguage);
      
      // Update local cache
      setTranslationCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, {
          text: translatedText,
          timestamp: Date.now(),
        });
        return newCache;
      });
      
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    } finally {
      setIsTranslatingLocal(false);
    }
  }, [currentLanguage, translationCache, cacheTimeout]);

  // Batch translation for multiple texts
  const translateBatch = useCallback(async (texts: string[]): Promise<string[]> => {
    if (currentLanguage === 'en') {
      return texts;
    }

    const validTexts = texts.filter(text => text && text.trim());
    if (validTexts.length === 0) {
      return texts;
    }

    setIsTranslatingLocal(true);
    
    try {
      const results = await Promise.allSettled(
        validTexts.map(text => translate(text))
      );

      return results.map(result => 
        result.status === 'fulfilled' ? result.value : ''
      );
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts;
    } finally {
      setIsTranslatingLocal(false);
    }
  }, [currentLanguage, translate]);

  // Clear local cache
  const clearCache = useCallback(() => {
    setTranslationCache(new Map());
  }, []);

  // Preload common translations
  const preloadTranslations = useCallback(async (commonTexts: string[]) => {
    if (currentLanguage === 'en') return;
    
    const textsToTranslate = commonTexts.filter(text => {
      const cacheKey = `${text}_${currentLanguage}`;
      const cached = translationCache.get(cacheKey);
      return !cached || Date.now() - cached.timestamp > cacheTimeout;
    });

    if (textsToTranslate.length > 0) {
      await translateBatch(textsToTranslate);
    }
  }, [currentLanguage, translationCache, cacheTimeout, translateBatch]);

  return {
    translate,
    translateBatch,
    clearCache,
    preloadTranslations,
    isTranslating: isTranslating || isTranslatingLocal,
    currentLanguage,
  };
}; 