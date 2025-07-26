'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { translateBatch } from '@/utils/language';

interface PageTranslatorProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTranslator: React.FC<PageTranslatorProps> = ({ 
  children, 
  className = '' 
}) => {
  const { currentLanguage, isTranslating } = useLanguage();
  const [translatedContent, setTranslatedContent] = useState<React.ReactNode>(children);
  const [isTranslatingPage, setIsTranslatingPage] = useState(false);
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
        console.log(`Excluding element from translation: ${selector}`);
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
          console.log(`Excluding text from translation (pattern match): "${text}"`);
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
        console.log(`Excluding element from translation (attribute): ${attr}`);
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
        console.log(`Excluding element from translation (class): ${className}`);
        return true;
      }
    }

    return false;
  }, []);

  // Function to extract all text nodes from React elements
  const extractTextNodes = useCallback((node: React.ReactNode): string[] => {
    const texts: string[] = [];
    
    const traverse = (element: React.ReactNode) => {
      if (typeof element === 'string') {
        const trimmed = element.trim();
        if (trimmed && trimmed.length > 0) texts.push(trimmed);
      } else if (typeof element === 'number') {
        texts.push(element.toString());
      } else if (React.isValidElement(element)) {
        // Skip TranslatableText components as they handle their own translation
        if (element.type === 'TranslatableText' || 
            (typeof element.type === 'function' && element.type.name === 'TranslatableText')) {
          return;
        }
        
        // Traverse children
        if (element.props.children) {
          if (Array.isArray(element.props.children)) {
            element.props.children.forEach(traverse);
          } else {
            traverse(element.props.children);
          }
        }
      }
    };
    
    traverse(node);
    return texts;
  }, []);

  // Function to translate and replace text in React elements
  const translateReactElements = useCallback(async (node: React.ReactNode, translations: Map<string, string>): Promise<React.ReactNode> => {
    if (typeof node === 'string') {
      const trimmed = node.trim();
      if (trimmed && translations.has(trimmed)) {
        return translations.get(trimmed) || trimmed;
      }
      return node;
    } else if (typeof node === 'number') {
      return node;
    } else if (React.isValidElement(node)) {
      // Skip TranslatableText components
      if (node.type === 'TranslatableText' || 
          (typeof node.type === 'function' && node.type.name === 'TranslatableText')) {
        return node;
      }
      
      // Clone element with translated children
      const newProps = { ...node.props };
      if (node.props.children) {
        if (Array.isArray(node.props.children)) {
          newProps.children = await Promise.all(
            node.props.children.map((child: React.ReactNode) => 
              translateReactElements(child, translations)
            )
          );
        } else {
          newProps.children = await translateReactElements(node.props.children, translations);
        }
      }
      
      return React.cloneElement(node, newProps);
    }
    
    return node;
  }, []);

  // Function to translate dynamic content in the DOM
  const translateDynamicContent = useCallback(async () => {
    if (currentLanguage === 'en') return;

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
      const translatedTexts = await translateBatch(uniqueTexts, currentLanguage);
      
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
  }, [currentLanguage, shouldExcludeFromTranslation]);

  // Set up mutation observer for dynamic content
  useEffect(() => {
    if (currentLanguage === 'en') return;

    // Create mutation observer to watch for new content
    observerRef.current = new MutationObserver((mutations) => {
      let hasNewContent = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.textContent?.trim() && !shouldExcludeFromTranslation(element)) {
                hasNewContent = true;
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
  }, [currentLanguage, translateDynamicContent, shouldExcludeFromTranslation]);

  useEffect(() => {
    const translatePageContent = async () => {
      if (currentLanguage === 'en') {
        setTranslatedContent(children);
        return;
      }

      setIsTranslatingPage(true);
      
      try {
        // Extract all text nodes
        const textNodes = extractTextNodes(children);
        console.log('Extracted text nodes:', textNodes);
        
        if (textNodes.length === 0) {
          setTranslatedContent(children);
          return;
        }

        // Batch translate all texts
        const translatedTexts = await translateBatch(textNodes, currentLanguage);
        console.log('Translated texts:', translatedTexts);
        
        // Create a map of original text to translated text
        const translationMap = new Map<string, string>();
        textNodes.forEach((original, index) => {
          if (translatedTexts[index] && translatedTexts[index] !== original) {
            translationMap.set(original, translatedTexts[index]);
          }
        });

        console.log('Translation map:', translationMap);

        // Apply translations to React elements
        const translatedElements = await translateReactElements(children, translationMap);
        setTranslatedContent(translatedElements);
        
        // Also translate any dynamic content that might be in the DOM
        setTimeout(() => {
          translateDynamicContent();
        }, 100);
        
      } catch (error) {
        console.error('Page translation error:', error);
        setTranslatedContent(children);
      } finally {
        setIsTranslatingPage(false);
      }
    };

    translatePageContent();
  }, [children, currentLanguage, extractTextNodes, translateReactElements, translateDynamicContent]);

  return (
    <div className={className}>
      {translatedContent}
    </div>
  );
}; 