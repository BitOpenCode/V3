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

  const t = (key: string): string => {
    const translation = translations[language] || translations['English'];
    return translation[key] || key;
  };

  return { t, language };
};
