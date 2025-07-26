'use client';

import React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useAiTranslation } from '@/hooks/use-ai-translation';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { locale, changeLanguage, getLocaleName, isTranslating } = useAiTranslation();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ka', name: 'ಕನ್ನಡ' },
    { code: 'tn', name: 'தமிழ்' },
    { code: 'hi', name: 'हिन्दी' }
  ];

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale !== locale) {
      await changeLanguage(newLocale);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={locale || 'en'}
        onChange={(e) => handleLanguageChange(e.target.value)}
        disabled={isTranslating}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      {isTranslating && (
        <Loader2 className="absolute right-8 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500 animate-spin" />
      )}
    </div>
  );
}; 