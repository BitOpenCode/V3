import { useLanguageStore } from '../store';
import en from '../locales/en.json';
import es from '../locales/es.json';
import zh from '../locales/zh.json';
import fr from '../locales/fr.json';
import ru from '../locales/ru.json';

const translations: Record<string, Record<string, string>> = {
  English: en,
  Spanish: es,
  Mandarin: zh,
  French: fr,
  Russian: ru,
};

export const useTranslation = () => {
  const { language } = useLanguageStore();

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[language] || translations['English'];
    const template = translation[key] || key;
    if (!params) return template;
    return Object.entries(params).reduce(
      (result, [paramKey, value]) => result.replace(`{{${paramKey}}}`, String(value)),
      template
    );
  };

  return { t, language };
};
