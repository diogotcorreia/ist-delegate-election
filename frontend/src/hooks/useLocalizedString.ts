import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedStringDto } from '../@types/api';

export type ParseLocalizedStringFunction = (ls: LocalizedStringDto) => string;

const LANG_FALLBACK_MAP: Record<string, string[]> = Object.freeze({
  'en-GB': ['en', 'pt-PT', 'pt'],
  'pt-PT': ['pt', 'en-GB', 'en'],
});

function useLocalizedString(): ParseLocalizedStringFunction {
  const { t, i18n } = useTranslation();
  const resolvedLanguage = i18n.resolvedLanguage || Object.keys(i18n.store.data)[0];

  return useCallback(
    (ls: LocalizedStringDto) =>
      ls[resolvedLanguage] ||
      (LANG_FALLBACK_MAP[resolvedLanguage] || []).map((lang) => ls[lang]).find(Boolean) ||
      t('error.languagestring.unknown'),
    [resolvedLanguage, t]
  );
}

export default useLocalizedString;
