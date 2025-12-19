import { useAppSelector } from '@/store/hooks';
import { selectCurrentLocale } from '@/store/slices/localeSlice';
import itMessages from './locales/it.json';
import ruMessages from './locales/ru.json';
import enMessages from './locales/en.json';

const messages = {
  it: itMessages,
  ru: ruMessages,
  en: enMessages,
};

type Messages = typeof itMessages;
type MessageKey = keyof Messages;
type NestedMessageKey<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedMessageKey<T[K]> & string}`
          : K
        : never;
    }[keyof T]
  : never;

type TranslationKey = NestedMessageKey<Messages>;

export function useTranslations() {
  const locale = useAppSelector(selectCurrentLocale);
  const currentMessages = messages[locale];

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = currentMessages;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }

    // Replace parameters
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() ?? match;
      });
    }

    return value;
  };

  return { t, locale };
}

