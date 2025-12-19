export const locales = ['it', 'ru', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'it';

export const localeNames: Record<Locale, string> = {
  it: 'Italiano',
  ru: 'Русский',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  it: '🇮🇹',
  ru: '🇷🇺',
  en: '🇬🇧',
};

