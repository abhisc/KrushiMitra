'use client';

import React, { useState } from 'react';
import { ChevronDown, Globe, Loader2, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { SUPPORTED_LANGUAGES } from '@/utils/language';

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage, isTranslating } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage) {
      setIsOpen(false);
      return;
    }

    console.log(`LanguageSelector: Changing language from ${currentLanguage} to ${languageCode}`);
    setLanguage(languageCode as any);
    setIsOpen(false);
  };

  const currentLanguageData = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTranslating}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLanguageData?.nativeName || currentLanguageData?.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        {isTranslating && (
          <div className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin text-green-600" />
            <span className="text-xs text-green-600">AI</span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {SUPPORTED_LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                disabled={isTranslating}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 ${
                  currentLanguage === language.code ? 'bg-green-50 text-green-700' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{language.nativeName}</span>
                    {currentLanguage === language.code && (
                      <Check className="w-3 h-3 text-green-600" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{language.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 