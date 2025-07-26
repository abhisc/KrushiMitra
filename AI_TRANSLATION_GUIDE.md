# AI Translation System Guide

## Overview

The AI Translation System provides real-time, context-aware translation for the Agrimitra application. It uses AI to translate text dynamically when users change the language, ensuring all content including dynamic text is properly translated.

## Features

- **Multi-Language Support**: English, Kannada, Tamil, and Hindi
- **Real-time Translation**: Instant AI-powered translation with caching
- **Context-Aware**: Understands context for better translations
- **Caching System**: Reduces API calls and improves performance
- **Dynamic Content Translation**: Translates content that appears after page load
- **Fallback Support**: Graceful handling of translation failures

## Architecture

### Core Components

1. **AI Translation Flow** (`src/ai/flows/ai-translation.ts`)
   - Handles individual text translation
   - Batch translation for multiple texts
   - Context-aware translation prompts

2. **AI Translation Hook** (`src/hooks/use-ai-translation.ts`)
   - Manages translation state and caching
   - Provides translation functions
   - Handles language switching

3. **TranslatableText Component** (`src/components/ui/translatable-text.tsx`)
   - React component for translatable text
   - Automatic translation on language change
   - Optional original text toggle

4. **Language Switcher** (`src/components/ui/language-switcher.tsx`)
   - Updated to use AI translation
   - Shows translation status with loading indicator

## Usage

### Basic Translation

```tsx
import { TranslatableText } from '@/components/ui/translatable-text';

// Simple translation
<TranslatableText>Hello World</TranslatableText>

// With context for better translation
<TranslatableText context="navigation menu">Home</TranslatableText>
```

### Using the Translation Hook

```tsx
import { useAiTranslation } from '@/hooks/use-ai-translation';

function MyComponent() {
  const { translateText, changeLanguage, isTranslating } = useAiTranslation();

  const handleTranslate = async () => {
    const translated = await translateText('Hello', 'hi', 'greeting');
    console.log(translated); // नमस्ते
  };

  return (
    <button onClick={() => changeLanguage('hi')}>
      Switch to Hindi
    </button>
  );
}
```

### Batch Translation

```tsx
import { useAiTranslation } from '@/hooks/use-ai-translation';

function MyComponent() {
  const { translateBatch } = useAiTranslation();

  const handleBatchTranslate = async () => {
    const texts = [
      { key: 'welcome', text: 'Welcome', context: 'greeting' },
      { key: 'home', text: 'Home', context: 'navigation' },
      { key: 'settings', text: 'Settings', context: 'ui' }
    ];

    const translations = await translateBatch(texts, 'hi');
    // Returns: { welcome: 'स्वागत है', home: 'होम', settings: 'सेटिंग्स' }
  };
}
```

## Language Codes

- `en`: English
- `ka`: Kannada (ಕನ್ನಡ)
- `tn`: Tamil (தமிழ்)
- `hi`: Hindi (हिन्दी)

## Context Types

For better translation quality, provide context when translating:

- `navigation menu`: For navigation items
- `button label`: For button text
- `page title`: For page titles
- `form label`: For form labels
- `error message`: For error messages
- `loading state`: For loading text
- `empty state`: For empty state messages

## Caching

The system includes a 5-minute cache to reduce API calls:

- Cache key format: `{text}_{targetLanguage}`
- Automatic cache invalidation after 5 minutes
- Cache is stored in component state

## Error Handling

- Graceful fallback to original text on translation failure
- Console logging for debugging
- Loading states during translation

## Performance Considerations

1. **Caching**: Reduces redundant API calls
2. **Batch Translation**: Efficient for multiple texts
3. **Lazy Loading**: Translations happen on-demand
4. **Context Awareness**: Reduces translation errors

## Demo Page

Visit `/translation-demo` to see the AI translation system in action. The demo page includes:

- Interactive translation input
- Sample texts for testing
- Feature showcase
- Real-time translation examples

## Integration with Existing i18n

The AI translation system works alongside the existing i18n setup:

1. **Static Content**: Uses existing translation files
2. **Dynamic Content**: Uses AI translation
3. **Fallback**: Falls back to original text if translation fails

## Configuration

### Environment Variables

Ensure your Google AI API key is configured:

```env
GOOGLE_API_KEY=your_api_key_here
```

### Adding New Languages

To add a new language:

1. Update the language codes in `useAiTranslation.ts`
2. Add language names to `getLocaleName` function
3. Update the language switcher component
4. Add language to Next.js i18n config

## Best Practices

1. **Always provide context** for better translation quality
2. **Use TranslatableText component** for UI elements
3. **Handle loading states** during translation
4. **Test translations** in the target language
5. **Cache frequently used translations**
6. **Provide fallbacks** for critical content

## Troubleshooting

### Common Issues

1. **Translation not working**: Check API key configuration
2. **Slow translations**: Verify network connectivity
3. **Incorrect translations**: Provide better context
4. **Cache issues**: Clear browser cache or restart dev server

### Debug Mode

Enable debug logging by adding to your component:

```tsx
const { translateText } = useAiTranslation();

// Debug translation
const debugTranslate = async (text: string) => {
  console.log('Translating:', text);
  const result = await translateText(text, 'hi', 'debug');
  console.log('Result:', result);
  return result;
};
```

## Future Enhancements

1. **Offline Translation**: Local translation models
2. **Voice Translation**: Speech-to-speech translation
3. **Image Translation**: OCR and translate text in images
4. **Custom Dictionaries**: Domain-specific translation terms
5. **Translation Memory**: Learn from user corrections

## API Reference

### useAiTranslation Hook

```tsx
const {
  locale,                    // Current locale
  changeLanguage,           // Function to change language
  translateText,            // Translate single text
  translateBatch,           // Translate multiple texts
  translateDynamicContent,  // Translate DOM elements
  clearCache,              // Clear translation cache
  getCachedTranslation,    // Get cached translation
  isTranslating,           // Translation status
  isRTL                    // RTL language support
} = useAiTranslation();
```

### TranslatableText Component Props

```tsx
interface TranslatableTextProps {
  children: string;         // Text to translate
  context?: string;         // Translation context
  className?: string;       // CSS classes
  fallback?: string;        // Fallback text
  showOriginal?: boolean;   // Show original text toggle
}
```

This AI translation system provides a robust, scalable solution for multilingual support in the Agrimitra application, ensuring all users can access the application in their preferred language. 