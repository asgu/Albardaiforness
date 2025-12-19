/**
 * Central Types Export
 * Централизованный экспорт всех типов
 */

// Person types
export type {
  Gender,
  Person,
  PersonSummary,
  PersonSearchResult,
  Marriage,
  Server,
  Media,
} from './person';

// API types
export type {
  ApiError,
  Pagination,
  PaginatedResponse,
  SearchParams,
  PersonFilterParams,
  LoadingState,
  OperationResult,
} from './api';

// UI types
export type {
  ButtonVariant,
  ButtonSize,
  ButtonProps,
  InputProps,
  CardProps,
  AvatarProps,
  AvatarSize,
} from '@/components/ui';

