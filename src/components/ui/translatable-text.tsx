'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAiTranslation } from '@/hooks/use-ai-translation';

interface TranslatableTextProps {
  children: string;
  context?: string;
  className?: string;
  fallback?: string;
  showOriginal?: boolean;
}

export const TranslatableText: React.FC<TranslatableTextProps> = ({
  children,
  context,
  className = '',
  fallback,
  showOriginal = false,
}) => {
  const { locale, translateText, getCachedTranslation } = useAiTranslation();
  const [translatedText, setTranslatedText] = useState<string>(children);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginalText, setShowOriginalText] = useState(showOriginal);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const translateContent = async () => {
      if (!children || locale === 'en') {
        setTranslatedText(children);
        return;
      }

      // Check cache first
      const cached = getCachedTranslation(children, locale);
      if (cached) {
        setTranslatedText(cached);
        return;
      }

      setIsTranslating(true);
      try {
        const result = await translateText(children, locale, context);
        setTranslatedText(result);
        
        // Update the data attribute for dynamic content translation
        if (elementRef.current) {
          elementRef.current.setAttribute('data-translate', 'true');
          elementRef.current.setAttribute('data-translate-key', children);
          if (context) {
            elementRef.current.setAttribute('data-translate-context', context);
          }
        }
      } catch (error) {
        console.error('Translation error:', error);
        setTranslatedText(fallback || children);
      } finally {
        setIsTranslating(false);
      }
    };

    translateContent();
  }, [children, locale, context, translateText, getCachedTranslation, fallback]);

  const handleToggleOriginal = () => {
    setShowOriginalText(!showOriginalText);
  };

  return (
    <span
      ref={elementRef}
      className={`translatable-text ${className}`}
      data-translate="true"
      data-translate-key={children}
      data-translate-context={context}
    >
      {isTranslating ? (
        <span className="opacity-50">{children}</span>
      ) : (
        <>
          {showOriginalText ? children : translatedText}
          {showOriginal && translatedText !== children && (
            <button
              onClick={handleToggleOriginal}
              className="ml-1 text-xs text-blue-500 hover:text-blue-700 underline"
              title="Toggle original text"
            >
              {showOriginalText ? 'Show translated' : 'Show original'}
            </button>
          )}
        </>
      )}
    </span>
  );
};

// Higher-order component for translating dynamic content
export const withTranslation = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { locale } = useAiTranslation();

    useEffect(() => {
      // This will be called when the component mounts or locale changes
      // The actual translation will be handled by the TranslatableText components
    }, [locale]);

    return <Component {...(props as P)} ref={ref} />;
  });
}; 