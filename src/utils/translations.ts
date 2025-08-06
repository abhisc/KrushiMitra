// Translation utility for the language system
// This is a basic implementation - in a real app, you'd use a proper i18n library

interface Translations {
  [key: string]: {
    [languageCode: string]: string;
  };
}

// Sample translations - you can expand this with more content
export const translations: Translations = {
  "welcome": {
    "en": "Welcome",
    "ka": "ಸುಸ್ವಾಗತ",
    "ta": "வரவேற்கிறோம்",
    "te": "స్వాగతం",
    "ml": "സ്വാഗതം",
    "mr": "स्वागत आहे",
  },
  "diagnose": {
    "en": "Diagnose",
    "ka": "ರೋಗ ನಿರ್ಧಾರ",
    "ta": "நோய் கண்டறிதல்",
    "te": "వ్యాధి నిర్ధారణ",
    "ml": "രോഗ നിർണയം",
    "mr": "रोग निदान",
  },
  "market": {
    "en": "Market",
    "ka": "ಮಾರುಕಟ್ಟೆ",
    "ta": "சந்தை",
    "te": "మార్కెట్",
    "ml": "വിപണി",
    "mr": "बाजार",
  },
  "weather": {
    "en": "Weather",
    "ka": "ಹವಾಮಾನ",
    "ta": "வானிலை",
    "te": "వాతావరణం",
    "ml": "കാലാവസ്ഥ",
    "mr": "हवामान",
  },
  "schemes": {
    "en": "Schemes",
    "ka": "ಯೋಜನೆಗಳು",
    "ta": "திட்டங்கள்",
    "te": "పథకాలు",
    "ml": "പദ്ധതികൾ",
    "mr": "योजना",
  },
  "settings": {
    "en": "Settings",
    "ka": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "ta": "அமைப்புகள்",
    "te": "సెట్టింగ్‌లు",
    "ml": "ക്രമീകരണങ്ങൾ",
    "mr": "सेटिंग्ज",
  },
  "language": {
    "en": "Language",
    "ka": "ಭಾಷೆ",
    "ta": "மொழி",
    "te": "భాష",
    "ml": "ഭാഷ",
    "mr": "भाषा",
  },
};

export function translate(key: string, languageCode: string): string {
  const translation = translations[key];
  if (!translation) {
    return key; // Return the key if no translation found
  }
  
  return translation[languageCode] || translation["en"] || key; // Fallback to English or key
}

export function getTranslatedText(key: string, languageCode: string): string {
  return translate(key, languageCode);
} 