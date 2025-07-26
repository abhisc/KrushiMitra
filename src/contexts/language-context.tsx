'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language, DEFAULT_LANGUAGE, translateText } from '@/utils/language';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  translate: (text: string) => Promise<string>;
  isTranslating: boolean;
  clearCache: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [isTranslating, setIsTranslating] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage') as Language;
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const setLanguage = useCallback((language: Language) => {
    console.log(`LanguageContext: Setting language to ${language}`);
    setCurrentLanguage(language);
    localStorage.setItem('selectedLanguage', language);
  }, []);

  const clearCache = useCallback(() => {
    // No cache to clear for simple translations
  }, []);

  const translate = useCallback(async (text: string): Promise<string> => {
    if (currentLanguage === 'en') {
      return text;
    }

    // Skip empty text
    if (!text || !text.trim()) {
      return text;
    }

    console.log(`Translating "${text}" to ${currentLanguage}`);

    setIsTranslating(true);
    try {
      const translatedText = await translateText(text, currentLanguage);
      console.log(`Translated "${text}" to "${translatedText}"`);
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      console.error('Translation failed for text:', text, 'Language:', currentLanguage, 'Error:', error);
      return text; // Fallback to original text
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage]);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    translate,
    isTranslating,
    clearCache,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 