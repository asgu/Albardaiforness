'use client';

import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { initServer, setServers, setLoading } from '@/store/slices/serverSlice';
import { checkAuth } from '@/store/slices/authSlice';
import { initLocale } from '@/store/slices/localeSlice';
import { getCurrentServer } from '@/lib/serverDetector';
import { defaultLocale, type Locale } from '@/i18n/config';
import axios from 'axios';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      // Инициализация сервера
      const hostname = window.location.hostname;
      const detectedServer = getCurrentServer(hostname);
      store.dispatch(initServer(detectedServer));

      // Инициализация локали
      const savedLocale = localStorage.getItem('locale') as Locale;
      store.dispatch(initLocale(savedLocale || defaultLocale));

      // Загрузка списка серверов из API
      loadServers();

      // Проверка аутентификации
      store.dispatch(checkAuth());

      initialized.current = true;
    }
  }, []);

  const loadServers = async () => {
    try {
      store.dispatch(setLoading(true));
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/servers`);
      if (response.data && Array.isArray(response.data)) {
        store.dispatch(setServers(response.data));
      }
    } catch (error) {
      console.error('Error loading servers:', error);
    } finally {
      store.dispatch(setLoading(false));
    }
  };

  return <Provider store={store}>{children}</Provider>;
}

