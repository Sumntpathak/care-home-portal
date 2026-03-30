/**
 * i18n Configuration — Multi-language support
 *
 * Hand-crafted translations: English + 10 Indian languages (sidebar nav, medical terms)
 * Google Translate: handles 40+ global languages for full page content
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import hand-crafted translations (Indian languages)
import en from './locales/en/common.json';
import hi from './locales/hi/common.json';
import ta from './locales/ta/common.json';
import te from './locales/te/common.json';
import kn from './locales/kn/common.json';
import mr from './locales/mr/common.json';
import gu from './locales/gu/common.json';
import bn from './locales/bn/common.json';
import or_IN from './locales/or/common.json';
import pa from './locales/pa/common.json';
import ml from './locales/ml/common.json';

/**
 * All supported languages organized by continent.
 * - Indian languages have hand-crafted i18n translations (hasI18n: true)
 * - All others use Google Translate only for page content
 */
export const LANGUAGES = [
  // ── English (Default) ──
  { code: 'en', name: 'English', nativeName: 'English', continent: 'default', hasI18n: true },

  // ── South Asia (India) ──
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', continent: 'asia_india', hasI18n: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', continent: 'asia_india', hasI18n: true },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', continent: 'asia_india', hasI18n: true },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', continent: 'asia_india', hasI18n: true },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', continent: 'asia_india', hasI18n: true },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', continent: 'asia_india', hasI18n: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', continent: 'asia_india', hasI18n: true },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', continent: 'asia_india', hasI18n: true },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', continent: 'asia_india', hasI18n: true },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', continent: 'asia_india', hasI18n: true },

  // ── Europe ──
  { code: 'de', name: 'German', nativeName: 'Deutsch', continent: 'europe' },
  { code: 'fr', name: 'French', nativeName: 'Français', continent: 'europe' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', continent: 'europe' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', continent: 'europe' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', continent: 'europe' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', continent: 'europe' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', continent: 'europe' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', continent: 'europe' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', continent: 'europe' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', continent: 'europe' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', continent: 'europe' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', continent: 'europe' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', continent: 'europe' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', continent: 'europe' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', continent: 'europe' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', continent: 'europe' },

  // ── Middle East & North Africa ──
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', continent: 'middle_east' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', continent: 'middle_east' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', continent: 'middle_east' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', continent: 'middle_east' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', continent: 'middle_east' },

  // ── East & Southeast Asia ──
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', continent: 'asia_east' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', continent: 'asia_east' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', continent: 'asia_east' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', continent: 'asia_east' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', continent: 'asia_east' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', continent: 'asia_east' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', continent: 'asia_east' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', continent: 'asia_east' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino', continent: 'asia_east' },
  { code: 'my', name: 'Myanmar', nativeName: 'မြန်မာ', continent: 'asia_east' },

  // ── Africa ──
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', continent: 'africa' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', continent: 'africa' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', continent: 'africa' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', continent: 'africa' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', continent: 'africa' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', continent: 'africa' },

  // ── Americas ──
  // Spanish (already in Europe), Portuguese (already in Europe) cover most of South America
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', continent: 'americas' },

  // ── Oceania ──
  { code: 'mi', name: 'Māori', nativeName: 'Te Reo Māori', continent: 'oceania' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Samoa', continent: 'oceania' },
];

// Continent labels for the dropdown
export const CONTINENT_LABELS = {
  default: 'Default',
  asia_india: '🇮🇳 India',
  europe: '🇪🇺 Europe',
  middle_east: '🌍 Middle East',
  asia_east: '🌏 East & Southeast Asia',
  africa: '🌍 Africa',
  americas: '🌎 Americas',
  oceania: '🌊 Oceania',
};

// Build the Google Translate includedLanguages string
export const GOOGLE_TRANSLATE_LANGS = LANGUAGES
  .filter(l => l.code !== 'en')
  .map(l => l.code)
  .join(',');

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      ta: { translation: ta },
      te: { translation: te },
      kn: { translation: kn },
      mr: { translation: mr },
      gu: { translation: gu },
      bn: { translation: bn },
      or: { translation: or_IN },
      pa: { translation: pa },
      ml: { translation: ml },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'sc_language',
      caches: ['localStorage'],
    },
  });

export default i18n;
