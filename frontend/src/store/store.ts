import { configureStore } from '@reduxjs/toolkit';
import serverReducer from './slices/serverSlice';
import authReducer from './slices/authSlice';
import localeReducer from './slices/localeSlice';

export const store = configureStore({
  reducer: {
    server: serverReducer,
    auth: authReducer,
    locale: localeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

