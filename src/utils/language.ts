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

// Simple translation function using basic translation mapping
export const translateText = async (text: string, targetLanguage: Language): Promise<string> => {
  if (targetLanguage === 'en') {
    return text;
  }

  // Basic translation mappings for common agricultural terms
  const translations: Record<string, Partial<Record<Language, string>>> = {
    // Common UI elements
    'Hello World': {
      'ka': 'ನಮಸ್ಕಾರ ಪ್ರಪಂಚ',
      'ta': 'வணக்கம் உலகம்',
      'te': 'హలో ప్రపంచం',
      'ml': 'ഹലോ ലോകം'
    },
    'Click Me': {
      'ka': 'ನನ್ನನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ',
      'ta': 'என்னை கிளிக் செய்யவும்',
      'te': 'నన్ను క్లిక్ చేయండి',
      'ml': 'എന്നെ ക്ലിക്ക് ചെയ്യുക'
    },
    'Product Name': {
      'ka': 'ಉತ್ಪನ್ನದ ಹೆಸರು',
      'ta': 'தயாரிப்பு பெயர்',
      'te': 'ఉత్పత్తి పేరు',
      'ml': 'ഉത്പന്നത്തിന്റെ പേര്'
    },
    'Welcome to Agrimitra': {
      'ka': 'ಅಗ್ರಿಮಿತ್ರಕ್ಕೆ ಸುಸ್ವಾಗತ',
      'ta': 'அக்ரிமித்ராவிற்கு வரவேற்கிறோம்',
      'te': 'అగ్రిమిత్రకు స్వాగతం',
      'ml': 'അഗ്രിമിത്രയിലേക്ക് സ്വാഗതം'
    },
    'AI-Powered Agricultural Assistant': {
      'ka': 'ಎಐ-ಚಾಲಿತ ಕೃಷಿ ಸಹಾಯಕ',
      'ta': 'ஏஐ-ஆல் இயக்கப்படும் வேளாண்மை உதவியாளர்',
      'te': 'ఏఐ-ఆధారిత వ్యవసాయ సహాయకుడు',
      'ml': 'എഐ-ആധാരിത കാർഷിക സഹായി'
    },
    'Smart farming solutions': {
      'ka': 'ಸ್ಮಾರ್ಟ್ ಕೃಷಿ ಪರಿಹಾರಗಳು',
      'ta': 'ஸ்மார்ட் விவசாய தீர்வுகள்',
      'te': 'స్మార్ట్ వ్యవసాయ పరిష్కారాలు',
      'ml': 'സ്മാർട്ട് കാർഷിക പരിഹാരങ്ങൾ'
    },
    'Talk to KrushiMitra': {
      'ka': 'ಕೃಷಿಮಿತ್ರನೊಂದಿಗೆ ಮಾತನಾಡಿ',
      'ta': 'கிருஷிமித்ராவுடன் பேசுங்கள்',
      'te': 'కృషిమిత్రతో మాట్లాడండి',
      'ml': 'കൃഷിമിത്രയുമായി സംസാരിക്കുക'
    },
    'Get instant answers': {
      'ka': 'ತ್ವರಿತ ಉತ್ತರಗಳನ್ನು ಪಡೆಯಿರಿ',
      'ta': 'உடனடி பதில்களைப் பெறுங்கள்',
      'te': 'తక్షణ సమాధానాలను పొందండి',
      'ml': 'തൽക്ഷണ ഉത്തരങ്ങൾ നേടുക'
    },
    'Send': {
      'ka': 'ಕಳುಹಿಸಿ',
      'ta': 'அனுப்பு',
      'te': 'పంపండి',
      'ml': 'അയയ്ക്കുക'
    },
    'Speak': {
      'ka': 'ಮಾತನಾಡಿ',
      'ta': 'பேசுங்கள்',
      'te': 'మాట్లాడండి',
      'ml': 'സംസാരിക്കുക'
    },
    'Thinking...': {
      'ka': 'ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ...',
      'ta': 'சிந்திக்கிறேன்...',
      'te': 'ఆలోచిస్తున్నాను...',
      'ml': 'ചിന്തിക്കുന്നു...'
    },
    'Quick prompts to get started:': {
      'ka': 'ಪ್ರಾರಂಭಿಸಲು ತ್ವರಿತ ಸೂಚನೆಗಳು:',
      'ta': 'தொடங்குவதற்கான விரைவான கேள்விகள்:',
      'te': 'ప్రారంభించడానికి త్వరిత ప్రశ్నలు:',
      'ml': 'ആരംഭിക്കാൻ വേഗ പ്രശ്നങ്ങൾ:'
    },
    'Check price of tomato': {
      'ka': 'ಟೊಮೇಟೊದ ಬೆಲೆಯನ್ನು ಪರಿಶೀಲಿಸಿ',
      'ta': 'தக்காளியின் விலையை சரிபார்க்கவும்',
      'te': 'టమాట బెలను తనిఖీ చేయండి',
      'ml': 'തക്കാളിയുടെ വില പരിശോധിക്കുക'
    },
    'My wheat crop looks yellow': {
      'ka': 'ನನ್ನ ಗೋಧಿ ಬೆಳೆ ಹಳದಿ ಕಾಣುತ್ತಿದೆ',
      'ta': 'எனது கோதுமை பயிர் மஞ்சளாகத் தெரிகிறது',
      'te': 'నా గోధుమ పంట పసుపు కనిపిస్తోంది',
      'ml': 'എന്റെ ഗോതമ്പ് വിള മഞ്ഞയായി കാണപ്പെടുന്നു'
    },
    'Show fertilizer subsidies': {
      'ka': 'ರಸಗೊಬ್ಬರ ಸಬ್ಸಿಡಿಗಳನ್ನು ತೋರಿಸಿ',
      'ta': 'உர மானியங்களைக் காட்டு',
      'te': 'రసాయన ఎరువు సబ్సిడీలను చూపించండి',
      'ml': 'രാസവള സബ്സിഡികൾ കാണിക്കുക'
    },
    'Weather forecast for crops': {
      'ka': 'ಬೆಳೆಗಳಿಗಾಗಿ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ',
      'ta': 'பயிர்களுக்கான வானிலை முன்னறிவிப்பு',
      'te': 'పంటలకు వాతావరణ ఊహ',
      'ml': 'വിളകൾക്കുള്ള കാലാവസ്ഥാ പ്രവചനം'
    },
    'Pest control for rice': {
      'ka': 'ಅಕ್ಕಿಯ ಕೀಟ ನಿಯಂತ್ರಣ',
      'ta': 'அரிசிக்கான பூச்சி கட்டுப்பாடு',
      'te': 'వరి కీటక నియంత్రణ',
      'ml': 'അരിക്കുള്ള കീടനിയന്ത്രണം'
    },
    'Search Products': {
      'ka': 'ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಿ',
      'ta': 'தயாரிப்புகளைத் தேடுங்கள்',
      'te': 'ఉత్పత్తులను శోధించండి',
      'ml': 'ഉത്പന്നങ്ങൾ തിരയുക'
    },
    'Product Type': {
      'ka': 'ಉತ್ಪನ್ನದ ಪ್ರಕಾರ',
      'ta': 'தயாரிப்பு வகை',
      'te': 'ఉత్పత్తి రకం',
      'ml': 'ഉത്പന്നത്തിന്റെ തരം'
    },
    'Select product type': {
      'ka': 'ಉತ್ಪನ್ನದ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
      'ta': 'தயாரிப்பு வகையைத் தேர்ந்தெடுக்கவும்',
      'te': 'ఉత్పత్తి రకాన్ని ఎంచుకోండి',
      'ml': 'ഉത്പന്നത്തിന്റെ തരം തിരഞ്ഞെടുക്കുക'
    },
    'Product/Brand Name': {
      'ka': 'ಉತ್ಪನ್ನ/ಬ್ರಾಂಡ್ ಹೆಸರು',
      'ta': 'தயாரிப்பு/பிராண்ட் பெயர்',
      'te': 'ఉత్పత్తి/బ్రాండ్ పేరు',
      'ml': 'ഉത്പന്നം/ബ്രാൻഡ് പേര്'
    },
    'Location': {
      'ka': 'ಸ್ಥಳ',
      'ta': 'இடம்',
      'te': 'స్థానం',
      'ml': 'സ്ഥലം'
    },
    'Select state': {
      'ka': 'ರಾಜ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
      'ta': 'மாநிலத்தைத் தேர்ந்தெடுக்கவும்',
      'te': 'రాష్ట్రాన్ని ఎంచుకోండి',
      'ml': 'സംസ്ഥാനം തിരഞ്ഞെടുക്കുക'
    },
    'Budget Range': {
      'ka': 'ಬಜೆಟ್ ವ್ಯಾಪ್ತಿ',
      'ta': 'பட்ஜெட் வரம்பு',
      'te': 'బడ్జెట్ పరిధి',
      'ml': 'ബജറ്റ് ശ്രേണി'
    },
    'Additional Requirements': {
      'ka': 'ಹೆಚ್ಚುವರಿ ಅಗತ್ಯತೆಗಳು',
      'ta': 'கூடுதல் தேவைகள்',
      'te': 'అదనపు అవసరాలు',
      'ml': 'കൂടുതൽ ആവശ്യങ്ങൾ'
    },
    'Searching...': {
      'ka': 'ಹುಡುಕುತ್ತಿದ್ದೇನೆ...',
      'ta': 'தேடுகிறேன்...',
      'te': 'శోధిస్తున్నాను...',
      'ml': 'തിരയുന്നു...'
    },
    'Locating...': {
      'ka': 'ಸ್ಥಳವನ್ನು ಹುಡುಕುತ್ತಿದ್ದೇನೆ...',
      'ta': 'இடத்தைக் கண்டறிகிறேன்...',
      'te': 'స్థానాన్ని కనుగొంటున్నాను...',
      'ml': 'സ്ഥലം കണ്ടെത്തുന്നു...'
    },
    'Use My Location': {
      'ka': 'ನನ್ನ ಸ್ಥಳವನ್ನು ಬಳಸಿ',
      'ta': 'எனது இடத்தைப் பயன்படுத்துங்கள்',
      'te': 'నా స్థానాన్ని ఉపయోగించండి',
      'ml': 'എന്റെ സ്ഥലം ഉപയോഗിക്കുക'
    },
    'Crop': {
      'ka': 'ಬೆಳೆ',
      'ta': 'பயிர்',
      'te': 'పంట',
      'ml': 'വിള'
    },
    'Select crop': {
      'ka': 'ಬೆಳೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
      'ta': 'பயிரைத் தேர்ந்தெடுக்கவும்',
      'te': 'పంటను ఎంచుకోండి',
      'ml': 'വിള തിരഞ്ഞെടുക്കുക'
    },
    'Custom Location (Optional)': {
      'ka': 'ಕಸ್ಟಮ್ ಸ್ಥಳ (ಐಚ್ಛಿಕ)',
      'ta': 'தனிப்பயன் இடம் (விருப்ப)',
      'te': 'కస్టమ్ స్థానం (ఐచ్ఛికం)',
      'ml': 'ക്യാസ്റ്റം സ്ഥലം (ഓപ്ഷണൽ)'
    },
    'Enter custom location': {
      'ka': 'ಕಸ್ಟಮ್ ಸ್ಥಳವನ್ನು ನಮೂದಿಸಿ',
      'ta': 'தனிப்பயன் இடத்தை உள்ளிடவும்',
      'te': 'కస్టమ్ స్థానాన్ని నమోదు చేయండి',
      'ml': 'ക്യാസ്റ്റം സ്ഥലം നൽകുക'
    },
    'Analyzing Weather...': {
      'ka': 'ಹವಾಮಾನವನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತಿದ್ದೇನೆ...',
      'ta': 'வானிலையை பகுப்பாய்வு செய்கிறேன்...',
      'te': 'వాతావరణాన్ని విశ్లేషిస్తున్నాను...',
      'ml': 'കാലാവസ്ഥ വിശകലനം ചെയ്യുന്നു...'
    },
    'Get Weather & Irrigation Tips': {
      'ka': 'ಹವಾಮಾನ ಮತ್ತು ನೀರಾವರಿ ಸಲಹೆಗಳನ್ನು ಪಡೆಯಿರಿ',
      'ta': 'வானிலை மற்றும் நீர்ப்பாசன குறிப்புகளைப் பெறுங்கள்',
      'te': 'వాతావరణం మరియు నీటి వ్యవస్థ చిట్కాలను పొందండి',
      'ml': 'കാലാവസ്ഥയും ജലസേചന നുറുങ്ങുകളും നേടുക'
    },
    'Current weather': {
      'ka': 'ಪ್ರಸ್ತುತ ಹವಾಮಾನ',
      'ta': 'தற்போதைய வானிலை',
      'te': 'ప్రస్తుత వాతావరణం',
      'ml': 'നിലവിലെ കാലാവസ്ഥ'
    },
    'Humidity': {
      'ka': 'ಆರ್ದ್ರತೆ',
      'ta': 'ஈரப்பதம்',
      'te': 'తేమ',
      'ml': 'ആർദ്രത'
    },
    'Wind Speed': {
      'ka': 'ಗಾಳಿಯ ವೇಗ',
      'ta': 'காற்றின் வேகம்',
      'te': 'గాలి వేగం',
      'ml': 'കാറ്റിന്റെ വേഗത'
    },
    'Precipitation': {
      'ka': 'ಮಳೆ',
      'ta': 'மழை',
      'te': 'వర్షం',
      'ml': 'മഴ'
    },
    'KrushiMitra': {
      'ka': 'ಕೃಷಿಮಿತ್ರ',
      'ta': 'கிருஷிமித்ரா',
      'te': 'కృషిమిత్ర',
      'ml': 'കൃഷിമിത്ര'
    },
    'Ask me anything about farming - crop diseases, market prices, weather, subsidies...': {
      'ka': 'ಕೃಷಿಯ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ - ಬೆಳೆ ರೋಗಗಳು, ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು, ಹವಾಮಾನ, ಸಬ್ಸಿಡಿಗಳು...',
      'ta': 'விவசாயம் பற்றி எதையும் கேள்வி - பயிர் நோய்கள், சந்தை விலைகள், வானிலை, மானியங்கள்...',
      'te': 'వ్యవసాయం గురించి ఏదైనా అడగండి - పంట వ్యాధులు, మార్కెట్ ధరలు, వాతావరణం, సబ్సిడీలు...',
      'ml': 'കാർഷികരംഗത്തെക്കുറിച്ച് എന്തെങ്കിലും ചോദിക്കുക - വിള രോഗങ്ങൾ, വിപണി വിലകൾ, കാലാവസ്ഥ, സബ്സിഡികൾ...'
    },
    'e.g., Mahindra, John Deere, Urea': {
      'ka': 'ಉದಾ., ಮಹೀಂದ್ರ, ಜಾನ್ ಡೀರ್, ಯೂರಿಯಾ',
      'ta': 'எ.கா., மஹிந்திரா, ஜான் டீர், யூரியா',
      'te': 'ఉదా., మహీంద్ర, జాన్ డీర్, యూరియా',
      'ml': 'ഉദാ., മഹീന്ദ്ര, ജോൺ ഡീർ, യൂറിയ'
    },
    'e.g., ₹5,00,000 - ₹7,00,000': {
      'ka': 'ಉದಾ., ₹5,00,000 - ₹7,00,000',
      'ta': 'எ.கா., ₹5,00,000 - ₹7,00,000',
      'te': 'ఉదా., ₹5,00,000 - ₹7,00,000',
      'ml': 'ഉദാ., ₹5,00,000 - ₹7,00,000'
    },
    'e.g., Govt certified, delivery available, organic': {
      'ka': 'ಉದಾ., ಸರ್ಕಾರಿ ಪ್ರಮಾಣೀಕೃತ, ವಿತರಣೆ ಲಭ್ಯ, ಸಾವಯವ',
      'ta': 'எ.கா., அரசு சான்றளிக்கப்பட்ட, விநியோகம் கிடைக்கும், கரிம',
      'te': 'ఉదా., ప్రభుత్వ ధృవీకరించబడిన, డెలివరీ అందుబాటులో, సేంద్రీయ',
      'ml': 'ഉദാ., സർക്കാർ സർട്ടിഫൈഡ്, ഡെലിവറി ലഭ്യം, ഓർഗാനിക്'
    },
    'Select location': {
      'ka': 'ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
      'ta': 'இடத்தைத் தேர்ந்தெடுக்கவும்',
      'te': 'స్థానాన్ని ఎంచుకోండి',
      'ml': 'സ്ഥലം തിരഞ്ഞെടുക്കുക'
    }
  };

  // Check if we have a translation for this text
  if (translations[text] && translations[text][targetLanguage]) {
    return translations[text][targetLanguage];
  }

  // If no translation found, return original text
  return text;
};

// Batch translation for multiple texts
export const translateBatch = async (texts: string[], targetLanguage: Language): Promise<string[]> => {
  if (targetLanguage === 'en') {
    return texts;
  }

  const results = await Promise.all(
    texts.map(text => translateText(text, targetLanguage))
  );

  return results;
};

// Clear translation cache (no-op for simple translations)
export const clearTranslationCache = () => {
  // No cache to clear for simple translations
};

// Get cache statistics (no-op for simple translations)
export const getTranslationCacheStats = () => {
  return { size: 0, hitRate: 0 };
};

// Preload common translations (no-op for simple translations)
export const preloadCommonTranslations = async (commonTexts: string[], targetLanguage: Language): Promise<void> => {
  // No preloading needed for simple translations
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