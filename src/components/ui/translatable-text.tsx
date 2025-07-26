'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';

interface TranslatableTextProps {
  children: string;
  className?: string;
  fallback?: string;
  showLoading?: boolean;
}

export const TranslatableText: React.FC<TranslatableTextProps> = ({ 
  children, 
  className = '',
  fallback,
  showLoading = true
}) => {
  const { currentLanguage, translate, isTranslating } = useLanguage();
  const [translatedText, setTranslatedText] = useState(children);
  const [isLoading, setIsLoading] = useState(false);

  const updateTranslation = useCallback(async () => {
    if (currentLanguage === 'en') {
      setTranslatedText(children);
      return;
    }

    // Skip empty text
    if (!children || !children.trim()) {
      setTranslatedText(children);
      return;
    }

    console.log(`TranslatableText: Translating "${children}" to ${currentLanguage}`);
    setIsLoading(true);
    
    try {
      const result = await translate(children);
      console.log(`TranslatableText: Translation result "${children}" -> "${result}"`);
      setTranslatedText(result);
    } catch (error) {
      console.error('TranslatableText: Translation error:', error);
      console.error('TranslatableText: Failed to translate:', children, 'Language:', currentLanguage);
      setTranslatedText(fallback || children);
    } finally {
      setIsLoading(false);
    }
  }, [children, currentLanguage, translate, fallback]);

  useEffect(() => {
    updateTranslation();
  }, [updateTranslation]);

  // Show original text with subtle loading indicator
  const displayText = isLoading && showLoading 
    ? <span className="opacity-70 animate-pulse">{children}</span>
    : translatedText;

  return (
    <span className={className}>
      {displayText}
    </span>
  );
}; 