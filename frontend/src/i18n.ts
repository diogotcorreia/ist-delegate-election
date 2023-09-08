import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enGbTranslation from './locales/en-GB/translation.json';
import ptPtTranslation from './locales/pt-PT/translation.json';

export const resources = {
  'en-GB': { translation: enGbTranslation },
  'pt-PT': { translation: ptPtTranslation },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-GB',

    supportedLngs: ['en-GB', 'pt-PT'],
    resources,

    detection: {
      order: ['localStorage', 'navigator'],
    },
  });

export default i18n;
