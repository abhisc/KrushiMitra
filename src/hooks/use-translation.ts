'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { translateText, translateBatch } from '@/utils/language';

interface UseTranslationOptions {
  priority?: 'high' | 'normal' | 'low';
  cacheTimeout?: number;
  autoTranslate?: boolean;
}

export const useTranslation = (options: UseTranslationOptions = {}) => {
  const { currentLanguage, isTranslating } = useLanguage();
  const [translationCache, setTranslationCache] = useState<Map<string, { text: string; timestamp: number }>>(new Map());
  const [isTranslatingLocal, setIsTranslatingLocal] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);

  const { priority = 'normal', cacheTimeout = 300000, autoTranslate = true } = options;

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
        console.log(`Excluding element from translation hook: ${selector}`);
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
          console.log(`Excluding text from translation hook (pattern match): "${text}"`);
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
        console.log(`Excluding element from translation hook (attribute): ${attr}`);
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
        console.log(`Excluding element from translation hook (class): ${className}`);
        return true;
      }
    }

    return false;
  }, []);

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

  // Translate dynamic content in the DOM
  const translateDynamicContent = useCallback(async () => {
    if (currentLanguage === 'en' || !autoTranslate) return;

    try {
      // Find all text nodes that need translation
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const text = node.textContent?.trim();
            if (text && text.length > 0 && !node.parentElement?.closest('[data-translated]')) {
              // Check if parent element should be excluded
              const parentElement = node.parentElement;
              if (parentElement && shouldExcludeFromTranslation(parentElement)) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
          }
        }
      );

      const textNodes: Text[] = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node as Text);
      }

      if (textNodes.length === 0) return;

      // Extract unique texts
      const uniqueTexts = [...new Set(textNodes.map(node => node.textContent?.trim()).filter((text): text is string => Boolean(text)))];
      
      // Batch translate
      const translatedTexts = await translateBatch(uniqueTexts);
      
      // Create translation map
      const translationMap = new Map<string, string>();
      uniqueTexts.forEach((original, index) => {
        if (translatedTexts[index] && translatedTexts[index] !== original) {
          translationMap.set(original, translatedTexts[index]);
        }
      });

      // Apply translations to DOM nodes
      textNodes.forEach(node => {
        const originalText = node.textContent?.trim();
        if (originalText && translationMap.has(originalText)) {
          const translatedText = translationMap.get(originalText);
          if (translatedText && translatedText !== originalText) {
            node.textContent = node.textContent?.replace(originalText, translatedText) || '';
            node.parentElement?.setAttribute('data-translated', 'true');
          }
        }
      });

    } catch (error) {
      console.error('Dynamic translation error:', error);
    }
  }, [currentLanguage, autoTranslate, translateBatch, shouldExcludeFromTranslation]);

  // Translate popups and modals with immediate effect
  const translatePopups = useCallback(async () => {
    if (currentLanguage === 'en' || !autoTranslate) return;

    try {
      // Find all popup/modal elements
      const popupSelectors = [
        '[role="dialog"]',
        '[role="alertdialog"]',
        '.modal',
        '.popup',
        '.dialog',
        '[data-modal]',
        '[data-popup]',
        '.toast',
        '.notification',
        '.alert',
        '.tooltip',
        '.dropdown-menu',
        '.context-menu',
        '.overlay',
        '.backdrop'
      ];

      const popupElements = document.querySelectorAll(popupSelectors.join(','));
      
      for (const popup of popupElements) {
        // Skip if popup should be excluded
        if (shouldExcludeFromTranslation(popup)) {
          continue;
        }

        // Translate text content in popups
        const textNodes = popup.querySelectorAll('*');
        for (const element of textNodes) {
          if (element.textContent?.trim() && !element.hasAttribute('data-translated')) {
            // Skip if element should be excluded
            if (shouldExcludeFromTranslation(element)) {
              continue;
            }

            try {
              const originalText = element.textContent.trim();
              const translatedText = await translate(originalText);
              if (translatedText !== originalText) {
                element.textContent = element.textContent.replace(originalText, translatedText);
                element.setAttribute('data-translated', 'true');
              }
            } catch (error) {
              console.error('Popup translation error:', error);
            }
          }
        }

        // Translate placeholders in popups
        const inputs = popup.querySelectorAll('input[placeholder], textarea[placeholder]');
        for (const input of inputs) {
          const element = input as HTMLInputElement | HTMLTextAreaElement;
          
          // Skip if element should be excluded
          if (shouldExcludeFromTranslation(element)) {
            continue;
          }

          if (element.placeholder && !element.hasAttribute('data-translated')) {
            try {
              const translatedPlaceholder = await translate(element.placeholder);
              if (translatedPlaceholder !== element.placeholder) {
                element.placeholder = translatedPlaceholder;
                element.setAttribute('data-translated', 'true');
              }
            } catch (error) {
              console.error('Popup placeholder translation error:', error);
            }
          }
        }

        // Translate titles and aria-labels in popups
        const elementsWithTitles = popup.querySelectorAll('[title], [aria-label]');
        for (const element of elementsWithTitles) {
          if (shouldExcludeFromTranslation(element)) {
            continue;
          }

          // Translate title
          const title = element.getAttribute('title');
          if (title && !element.hasAttribute('data-translated')) {
            try {
              const translatedTitle = await translate(title);
              if (translatedTitle !== title) {
                element.setAttribute('title', translatedTitle);
                element.setAttribute('data-translated', 'true');
              }
            } catch (error) {
              console.error('Popup title translation error:', error);
            }
          }

          // Translate aria-label
          const ariaLabel = element.getAttribute('aria-label');
          if (ariaLabel && !element.hasAttribute('data-translated')) {
            try {
              const translatedAriaLabel = await translate(ariaLabel);
              if (translatedAriaLabel !== ariaLabel) {
                element.setAttribute('aria-label', translatedAriaLabel);
                element.setAttribute('data-translated', 'true');
              }
            } catch (error) {
              console.error('Popup aria-label translation error:', error);
            }
          }
        }
      }

    } catch (error) {
      console.error('Popup translation error:', error);
    }
  }, [currentLanguage, autoTranslate, translate, shouldExcludeFromTranslation]);

  // Set up mutation observer for dynamic content and popups
  useEffect(() => {
    if (currentLanguage === 'en' || !autoTranslate) return;

    // Create mutation observer to watch for new content
    observerRef.current = new MutationObserver((mutations) => {
      let hasNewContent = false;
      let hasNewPopups = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Check for new text content (excluding user profile and language areas)
              if (element.textContent?.trim() && !shouldExcludeFromTranslation(element)) {
                hasNewContent = true;
              }
              
              // Check for new popups/modals (excluding user profile and language areas)
              if (!shouldExcludeFromTranslation(element)) {
                // Check for dialog roles
                if (element.hasAttribute('role') && 
                    (element.getAttribute('role') === 'dialog' || element.getAttribute('role') === 'alertdialog')) {
                  hasNewPopups = true;
                }
                
                // Check for modal/popup classes
                if (element.classList.contains('modal') || 
                    element.classList.contains('popup') || 
                    element.classList.contains('dialog') ||
                    element.classList.contains('toast') ||
                    element.classList.contains('notification') ||
                    element.classList.contains('alert') ||
                    element.classList.contains('tooltip') ||
                    element.classList.contains('dropdown-menu') ||
                    element.classList.contains('context-menu') ||
                    element.classList.contains('overlay') ||
                    element.classList.contains('backdrop') ||
                    element.hasAttribute('data-modal') ||
                    element.hasAttribute('data-popup')) {
                  hasNewPopups = true;
                }
              }
            }
          });
        }
      });

      if (hasNewContent) {
        // Debounce the translation to avoid too many API calls
        setTimeout(() => {
          translateDynamicContent();
        }, 500);
      }

      if (hasNewPopups) {
        // Translate popups immediately for better UX
        setTimeout(() => {
          translatePopups();
        }, 100);
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
  }, [currentLanguage, autoTranslate, translateDynamicContent, translatePopups, shouldExcludeFromTranslation]);

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

  // Force translate all content
  const forceTranslateAll = useCallback(async () => {
    if (currentLanguage === 'en') return;
    
    await Promise.all([
      translateDynamicContent(),
      translatePopups()
    ]);
  }, [currentLanguage, translateDynamicContent, translatePopups]);

  return {
    translate,
    translateBatch,
    clearCache,
    preloadTranslations,
    translateDynamicContent,
    translatePopups,
    forceTranslateAll,
    isTranslating: isTranslating || isTranslatingLocal,
    currentLanguage,
  };
}; 