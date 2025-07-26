'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { translateText } from '@/utils/language';

interface PlaceholderTranslatorProps {
  children: React.ReactNode;
  className?: string;
}

export const PlaceholderTranslator: React.FC<PlaceholderTranslatorProps> = ({ 
  children, 
  className = '' 
}) => {
  const { currentLanguage } = useLanguage();
  const [translatedChildren, setTranslatedChildren] = useState<React.ReactNode>(children);

  // Function to translate placeholder attributes
  const translatePlaceholders = useCallback(async (node: React.ReactNode): Promise<React.ReactNode> => {
    if (typeof node === 'string') {
      return node;
    } else if (typeof node === 'number') {
      return node;
    } else if (React.isValidElement(node)) {
      const newProps = { ...node.props };
      
      // Translate placeholder attributes
      if (newProps.placeholder) {
        try {
          const translatedPlaceholder = await translateText(newProps.placeholder, currentLanguage);
          newProps.placeholder = translatedPlaceholder;
        } catch (error) {
          console.error('Placeholder translation error:', error);
        }
      }

      // Translate title attributes
      if (newProps.title) {
        try {
          const translatedTitle = await translateText(newProps.title, currentLanguage);
          newProps.title = translatedTitle;
        } catch (error) {
          console.error('Title translation error:', error);
        }
      }

      // Translate aria-label attributes
      if (newProps['aria-label']) {
        try {
          const translatedAriaLabel = await translateText(newProps['aria-label'], currentLanguage);
          newProps['aria-label'] = translatedAriaLabel;
        } catch (error) {
          console.error('Aria-label translation error:', error);
        }
      }

      // Recursively translate children
      if (newProps.children) {
        if (Array.isArray(newProps.children)) {
          newProps.children = await Promise.all(
            newProps.children.map((child: React.ReactNode) => translatePlaceholders(child))
          );
        } else {
          newProps.children = await translatePlaceholders(newProps.children);
        }
      }

      return React.cloneElement(node, newProps);
    }

    return node;
  }, [currentLanguage]);

  useEffect(() => {
    const updateTranslations = async () => {
      if (currentLanguage === 'en') {
        setTranslatedChildren(children);
        return;
      }

      try {
        const translated = await translatePlaceholders(children);
        setTranslatedChildren(translated);
      } catch (error) {
        console.error('Placeholder translation error:', error);
        setTranslatedChildren(children);
      }
    };

    updateTranslations();
  }, [children, currentLanguage, translatePlaceholders]);

  return (
    <div className={className}>
      {translatedChildren}
    </div>
  );
}; 