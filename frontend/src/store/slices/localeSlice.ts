import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Locale, defaultLocale } from '@/i18n/config';

interface LocaleState {
  currentLocale: Locale;
}

const initialState: LocaleState = {
  currentLocale: defaultLocale,
};

const localeSlice = createSlice({
  name: 'locale',
  initialState,
  reducers: {
    setLocale: (state, action: PayloadAction<Locale>) => {
      state.currentLocale = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('locale', action.payload);
        // Reload page to apply new locale
        window.location.reload();
      }
    },
    initLocale: (state, action: PayloadAction<Locale>) => {
      state.currentLocale = action.payload;
    },
  },
});

export const { setLocale, initLocale } = localeSlice.actions;
export default localeSlice.reducer;

// Selectors
export const selectCurrentLocale = (state: { locale: LocaleState }) => state.locale.currentLocale;

