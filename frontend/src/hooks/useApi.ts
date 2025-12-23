import { useState, useCallback } from 'react';
import { AxiosResponse } from 'axios';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Custom hook for API calls with loading, error, and data states
 * Works with axios responses (AxiosResponse<T>)
 * 
 * @example
 * const { data, loading, error, execute } = useApi(personApi.search);
 * 
 * // Call the API
 * await execute({ q: 'John' });
 */
export function useApi<T = any>(
  apiCall: (...args: any[]) => Promise<AxiosResponse<T>>
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiCall(...args);
        setData(response.data);
        return response.data;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'An error occurred';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiCall]
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, execute, reset };
}

