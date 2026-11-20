import type { ApiError, ApiResponse } from './types';

export const isApiError = <T,>(
  r: ApiResponse<T>
): r is { error: ApiError } => 'error' in r;
