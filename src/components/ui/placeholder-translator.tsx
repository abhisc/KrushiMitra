'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const observerRef = useRef<MutationObserver | null>(null);

  // Function to check if element should be excluded from translation
  const shouldExcludeFromTranslation = useCallback((element: Element): boolean => {
    // Exclude user profile and language selection areas
    const excludeSelectors = [
      '[data-no-translate]',
      '.language-selector',
      '.user-profile',
      '.profile-section',
      '[data-profile]',
      '.auth-section',
      '.user-menu',
      '.profile-menu',
      '.language-menu',
      '.user-info',
      '.profile-info',
      '.auth-form',
      '.login-form',
      '.signup-form',
      '.user-settings',
      '.profile-settings',
      '.user-avatar',
      '.user-name',
      '.user-email',
      '.user-letter',
      '.profile-avatar',
      '.profile-name',
      '.profile-email',
      '.language-option',
      '.language-code',
      '.language-name',
      '.language-native',
      '.user-details',
      '.profile-details',
      '.auth-details',
      '.user-data',
      '.profile-data',
      '.language-data',
      '.user-section',
      '.profile-section',
      '.language-section',
      '.auth-section',
      '.user-container',
      '.profile-container',
      '.language-container',
      '.auth-container',
      '.user-wrapper',
      '.profile-wrapper',
      '.language-wrapper',
      '.auth-wrapper'
    ];

    // Check if element matches any exclude selector
    for (const selector of excludeSelectors) {
      if (element.matches(selector) || element.closest(selector)) {
        console.log(`Excluding element from placeholder translation: ${selector}`);
        return true;
      }
    }

    // Check for specific text patterns that should not be translated
    const excludeTextPatterns = [
      /^[A-Z]{2}$/, // Language codes like 'EN', 'KA'
      /^[a-z]{2}$/, // Language codes like 'en', 'ka'
      /^[A-Za-z]{2,3}$/, // Short language codes
      /^[0-9]+$/, // Pure numbers
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, // Email addresses
      /^https?:\/\//, // URLs
      /^[0-9]{10,}$/, // Phone numbers
      /^[A-Za-z0-9]{8,}$/, // User IDs, tokens, etc.
      /^[A-Z]$/, // Single letters (user initials)
      /^[A-Z][a-z]+$/, // Names like "John", "Mary"
      /^[A-Z][a-z]+\s[A-Z][a-z]+$/, // Full names like "John Doe"
      /^[A-Z][a-z]+\s[A-Z][a-z]+\s[A-Z][a-z]+$/, // Three part names
      /^[A-Z][a-z]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, // Email with name
      /^[A-Z][a-z]+\s[A-Z][a-z]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, // Full name email
      /^[A-Z][a-z]+\s[A-Z][a-z]+\s[A-Z][a-z]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/ // Three part name email
    ];

    const text = element.textContent?.trim();
    if (text) {
      for (const pattern of excludeTextPatterns) {
        if (pattern.test(text)) {
          console.log(`Excluding text from placeholder translation (pattern match): "${text}"`);
          return true;
        }
      }
    }

    // Check for specific attributes that indicate user/profile content
    const excludeAttributes = [
      'data-user',
      'data-profile',
      'data-auth',
      'data-language',
      'data-email',
      'data-name',
      'data-username',
      'data-userid',
      'data-profileid',
      'data-avatar',
      'data-letter',
      'data-initial'
    ];

    for (const attr of excludeAttributes) {
      if (element.hasAttribute(attr) || element.closest(`[${attr}]`)) {
        console.log(`Excluding element from placeholder translation (attribute): ${attr}`);
        return true;
      }
    }

    // Check for specific classes that indicate user/profile content
    const excludeClasses = [
      'user',
      'profile',
      'auth',
      'login',
      'signup',
      'language',
      'avatar',
      'name',
      'email',
      'letter',
      'initial',
      'username',
      'userid',
      'profileid'
    ];

    for (const className of excludeClasses) {
      if (element.classList.contains(className) || element.closest(`.${className}`)) {
        console.log(`Excluding element from placeholder translation (class): ${className}`);
        return true;
      }
    }

    return false;
  }, []);

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

      // Translate data-translate-placeholder attributes
      if (newProps['data-translate-placeholder']) {
        try {
          const translatedPlaceholder = await translateText(newProps['data-translate-placeholder'], currentLanguage);
          newProps.placeholder = translatedPlaceholder;
          delete newProps['data-translate-placeholder'];
        } catch (error) {
          console.error('Data-translate-placeholder translation error:', error);
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

  // Function to translate dynamic placeholders in the DOM
  const translateDynamicPlaceholders = useCallback(async () => {
    if (currentLanguage === 'en') return;

    try {
      // Find all elements with placeholder attributes (excluding user profile and language areas)
      const elementsWithPlaceholders = document.querySelectorAll('input[placeholder], textarea[placeholder], [data-translate-placeholder]');
      
      for (const element of elementsWithPlaceholders) {
        // Skip if element should be excluded
        if (shouldExcludeFromTranslation(element)) {
          continue;
        }

        const input = element as HTMLInputElement | HTMLTextAreaElement;
        
        // Translate placeholder
        if (input.placeholder) {
          try {
            const translatedPlaceholder = await translateText(input.placeholder, currentLanguage);
            if (translatedPlaceholder !== input.placeholder) {
              input.placeholder = translatedPlaceholder;
            }
          } catch (error) {
            console.error('Dynamic placeholder translation error:', error);
          }
        }

        // Translate data-translate-placeholder
        const dataPlaceholder = input.getAttribute('data-translate-placeholder');
        if (dataPlaceholder) {
          try {
            const translatedPlaceholder = await translateText(dataPlaceholder, currentLanguage);
            input.placeholder = translatedPlaceholder;
            input.removeAttribute('data-translate-placeholder');
          } catch (error) {
            console.error('Dynamic data-translate-placeholder translation error:', error);
          }
        }
      }

      // Find all elements with title attributes (excluding user profile and language areas)
      const elementsWithTitles = document.querySelectorAll('[title]');
      
      for (const element of elementsWithTitles) {
        // Skip if element should be excluded
        if (shouldExcludeFromTranslation(element)) {
          continue;
        }

        const title = element.getAttribute('title');
        if (title) {
          try {
            const translatedTitle = await translateText(title, currentLanguage);
            if (translatedTitle !== title) {
              element.setAttribute('title', translatedTitle);
            }
          } catch (error) {
            console.error('Dynamic title translation error:', error);
          }
        }
      }

      // Find all elements with aria-label attributes (excluding user profile and language areas)
      const elementsWithAriaLabels = document.querySelectorAll('[aria-label]');
      
      for (const element of elementsWithAriaLabels) {
        // Skip if element should be excluded
        if (shouldExcludeFromTranslation(element)) {
          continue;
        }

        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) {
          try {
            const translatedAriaLabel = await translateText(ariaLabel, currentLanguage);
            if (translatedAriaLabel !== ariaLabel) {
              element.setAttribute('aria-label', translatedAriaLabel);
            }
          } catch (error) {
            console.error('Dynamic aria-label translation error:', error);
          }
        }
      }

    } catch (error) {
      console.error('Dynamic placeholder translation error:', error);
    }
  }, [currentLanguage, shouldExcludeFromTranslation]);

  // Set up mutation observer for dynamic placeholders
  useEffect(() => {
    if (currentLanguage === 'en') return;

    // Create mutation observer to watch for new elements with placeholders
    observerRef.current = new MutationObserver((mutations) => {
      let hasNewPlaceholders = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if ((element.hasAttribute('placeholder') || 
                   element.hasAttribute('data-translate-placeholder') ||
                   element.hasAttribute('title') ||
                   element.hasAttribute('aria-label')) && 
                  !shouldExcludeFromTranslation(element)) {
                hasNewPlaceholders = true;
              }
            }
          });
        }
      });

      if (hasNewPlaceholders) {
        // Debounce the translation to avoid too many API calls
        setTimeout(() => {
          translateDynamicPlaceholders();
        }, 300);
      }
    });

    // Start observing
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [currentLanguage, translateDynamicPlaceholders, shouldExcludeFromTranslation]);

  useEffect(() => {
    const updateTranslations = async () => {
      if (currentLanguage === 'en') {
        setTranslatedChildren(children);
        return;
      }

      try {
        const translated = await translatePlaceholders(children);
        setTranslatedChildren(translated);
        
        // Also translate any dynamic placeholders that might be in the DOM
        setTimeout(() => {
          translateDynamicPlaceholders();
        }, 100);
      } catch (error) {
        console.error('Placeholder translation error:', error);
        setTranslatedChildren(children);
      }
    };

    updateTranslations();
  }, [children, currentLanguage, translatePlaceholders, translateDynamicPlaceholders]);

  return (
    <div className={className}>
      {translatedChildren}
    </div>
  );
}; 