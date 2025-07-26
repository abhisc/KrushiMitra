'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
        
      } catch (error) {
        console.error('Page translation error:', error);
        setTranslatedContent(children);
      } finally {
        setIsTranslatingPage(false);
      }
    };

    translatePageContent();
  }, [children, currentLanguage, extractTextNodes, translateReactElements]);

  return (
    <div className={className}>
      {isTranslatingPage && (
        <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          </div>
        </div>
      )}
      {translatedContent}
    </div>
  );
}; 