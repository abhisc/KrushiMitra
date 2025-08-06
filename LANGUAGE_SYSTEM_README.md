# Language System Implementation

This document describes the language system implemented in KrushiMitra, which supports multiple Indian languages including Kannada, Tamil, Telugu, Malayalam, and Marathi.

## Features

- **Multi-language Support**: Supports 5 Indian languages
- **Persistent Language Selection**: Language preference is saved in localStorage
- **Context-based State Management**: Uses React Context for global language state
- **Translation Utility**: Basic translation system with fallback support
- **Responsive Design**: Language menu adapts to different screen sizes

## Supported Languages

1. **English (English)** - Code: `en`
2. **Kannada (ಕನ್ನಡ)** - Code: `ka`
3. **Tamil (தமிழ்)** - Code: `ta`
4. **Telugu (తెలుగు)** - Code: `te`
5. **Malayalam (മലയാളം)** - Code: `ml`
6. **Marathi (मराठी)** - Code: `mr`

## Implementation Details

### Components

#### 1. LanguageMenu (`src/components/ui/language-menu.tsx`)
- Dropdown menu component for language selection
- Shows current language in native script
- Displays both native name and English name for each language
- Visual indicator for selected language

#### 2. LanguageProvider (`src/contexts/language-context.tsx`)
- React Context provider for language state management
- Handles language persistence in localStorage
- Provides language change functionality

### Utilities

#### 1. Translation System (`src/utils/translations.ts`)
- Basic translation utility with fallback support
- Sample translations for common UI elements
- Extensible structure for adding more translations

#### 2. Translation Hook (`src/hooks/use-translation.ts`)
- Custom hook for easy translation usage
- Provides `t()` function for translating text
- Access to current language information

## Usage

### Basic Translation Usage

```tsx
import { useTranslation } from '@/hooks/use-translation';

function MyComponent() {
  const { t, currentLanguage } = useTranslation();
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>Current language: {currentLanguage.nativeName}</p>
    </div>
  );
}
```

### Adding New Translations

1. Add translations to `src/utils/translations.ts`:

```typescript
export const translations: Translations = {
  "new_key": {
    "ka": "ಕನ್ನಡ ಅನುವಾದ",
    "ta": "தமிழ் மொழிபெயர்ப்பு",
    "te": "తెలుగు అనువాదం",
    "ml": "മലയാളം വിവരണം",
    "mr": "मराठी भाषांतर",
  },
  // ... more translations
};
```

2. Use in components:

```tsx
const { t } = useTranslation();
return <span>{t('new_key')}</span>;
```

### Language Menu Integration

The language menu is automatically integrated into:
- Main app layout header (`src/components/agrimitra/app-layout.tsx`)
- Simple header component (`src/components/agrimitra/header.tsx`)

## File Structure

```
src/
├── components/
│   └── ui/
│       └── language-menu.tsx          # Language dropdown component
├── contexts/
│   └── language-context.tsx           # Language state management
├── hooks/
│   └── use-translation.ts             # Translation hook
├── utils/
│   └── translations.ts                # Translation utilities
└── app/
    └── layout.tsx                     # Root layout with LanguageProvider
```

## Future Enhancements

1. **Advanced i18n Library**: Integrate with libraries like `react-i18next` or `next-intl`
2. **Dynamic Translation Loading**: Load translations on-demand based on selected language
3. **RTL Support**: Add support for right-to-left languages
4. **Translation Management**: Admin interface for managing translations
5. **Auto-detection**: Detect user's preferred language from browser settings
6. **Pluralization**: Support for plural forms in different languages
7. **Date/Number Formatting**: Localized formatting for dates, numbers, and currencies

## Browser Compatibility

- Modern browsers with localStorage support
- Responsive design for mobile and desktop
- Graceful fallback to Kannada if translation is missing

## Contributing

To add support for new languages:

1. Add the language to the `languages` array in `language-context.tsx`
2. Add translations for all keys in `translations.ts`
3. Test the language selection and display
4. Update this documentation

## Notes

- The system defaults to English (English) as the primary language
- Language selection persists across browser sessions
- Missing translations fallback to English, then to the original key
- The language menu is positioned next to the settings button in the header 