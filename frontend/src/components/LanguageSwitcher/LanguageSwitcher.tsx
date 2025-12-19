'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLocale, selectCurrentLocale } from '@/store/slices/localeSlice';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import { Select } from '@/components/ui';

export default function LanguageSwitcher() {
  const dispatch = useAppDispatch();
  const currentLocale = useAppSelector(selectCurrentLocale);

  const handleLocaleChange = (value: string) => {
    dispatch(setLocale(value as Locale));
  };

  const options = locales.map((locale) => ({
    value: locale,
    label: localeNames[locale],
    icon: localeFlags[locale],
  }));

  return (
    <Select
      options={options}
      value={currentLocale}
      onChange={handleLocaleChange}
    />
  );
}

