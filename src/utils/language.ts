export type Language = 'en' | 'ka' | 'ta' | 'te' | 'ml';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ka', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
];

export const DEFAULT_LANGUAGE: Language = 'en';

// Translation cache to avoid repeated API calls
const translationCache = new Map<string, string>();

// Language code mapping for Google Translate API
const LANGUAGE_CODE_MAP: Record<Language, string> = {
  'en': 'en',
  'ka': 'kn', // Kannada
  'ta': 'ta', // Tamil
  'te': 'te', // Telugu
  'ml': 'ml'  // Malayalam
};

// Automatic translation function using Google Translate API (free tier)
export const translateText = async (text: string, targetLanguage: Language): Promise<string> => {
  if (targetLanguage === 'en') {
    return text;
  }

  // Skip empty text
  if (!text || !text.trim()) {
    return text;
  }

  // Check cache first
  const cacheKey = `${text}_${targetLanguage}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // Get the correct language code for Google Translate API
    const googleLanguageCode = LANGUAGE_CODE_MAP[targetLanguage];
    
    console.log(`Translating "${text}" to ${targetLanguage} (${googleLanguageCode})`);
    
    // Use Google Translate API (free tier)
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${googleLanguageCode}&dt=t&q=${encodeURIComponent(text)}`);
    
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data[0]?.[0]?.[0] || text;

    // Cache the result
    translationCache.set(cacheKey, translatedText);
    
    console.log(`Successfully translated "${text}" to "${translatedText}" (${targetLanguage})`);
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback to original text if translation fails
    return text;
  }
};

// Batch translation for multiple texts
export const translateBatch = async (texts: string[], targetLanguage: Language): Promise<string[]> => {
  if (targetLanguage === 'en') {
    return texts;
  }

  try {
    // Process texts in batches to avoid API limits
    const batchSize = 10;
    const results: string[] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(text => translateText(text, targetLanguage))
      );
      results.push(...batchResults);
    }

    return results;
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts;
  }
};

// Clear translation cache
export const clearTranslationCache = () => {
  translationCache.clear();
};

// Get cache statistics
export const getTranslationCacheStats = () => {
  return { 
    size: translationCache.size, 
    hitRate: 0 // We'll calculate this if needed
  };
};

// Preload common translations
export const preloadCommonTranslations = async (commonTexts: string[], targetLanguage: Language): Promise<void> => {
  if (targetLanguage === 'en') return;
  
  try {
    await translateBatch(commonTexts, targetLanguage);
  } catch (error) {
    console.error('Preload translation error:', error);
  }
};

// Get language name by code
export const getLanguageName = (code: Language): string => {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return language?.name || 'English';
};

// Get native language name by code
export const getNativeLanguageName = (code: Language): string => {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return language?.nativeName || 'English';
}; 