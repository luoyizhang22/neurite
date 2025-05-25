import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import language resources
import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';

// Initialize i18next
i18n
  // Use Http Backend for loading translations from public/locales folder
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      zh: {
        translation: zhTranslation
      }
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false // React already does escaping
    },
    
    // Detection options
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    }
  });

export default i18n; 