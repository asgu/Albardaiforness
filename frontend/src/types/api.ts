/**
 * API Types
 * Типы для работы с API
 */

/**
 * Стандартный ответ API с ошибкой
 */
export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

/**
 * Пагинация
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Ответ с пагинацией
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

/**
 * Параметры поиска
 */
export interface SearchParams {
  q: string;
  server?: string;
  page?: number;
  limit?: number;
}

/**
 * Параметры фильтрации персон
 */
export interface PersonFilterParams {
  gender?: 'male' | 'female' | 'unknown';
  birthYearFrom?: number;
  birthYearTo?: number;
  deathYearFrom?: number;
  deathYearTo?: number;
  birthPlace?: string;
  server?: string;
}

/**
 * Статус загрузки
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Результат операции
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

