import { useState, useCallback } from 'react';
import { useTranslations } from '@/i18n/useTranslations';

export interface UseErrorHandlerReturn {
  error: string | null;
  setError: (error: string | null) => void;
  handleError: (err: any, defaultMessage?: string) => void;
  clearError: () => void;
}

/**
 * Custom hook for consistent error handling
 * 
 * @example
 * const { error, handleError, clearError } = useErrorHandler();
 * 
 * try {
 *   await someApiCall();
 * } catch (err) {
 *   handleError(err, 'Custom error message');
 * }
 */
export function useErrorHandler(defaultMessage?: string): UseErrorHandlerReturn {
  const { t } = useTranslations();
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback(
    (err: any, customMessage?: string) => {
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.error || 
        err.message || 
        customMessage || 
        defaultMessage || 
        t('common.error');
      setError(errorMessage);
    },
    [defaultMessage, t]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, setError, handleError, clearError };
}

