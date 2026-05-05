export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL';

export class HttpError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(params: { status: number; code: ApiErrorCode; message: string; details?: unknown }) {
    super(params.message);
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError({ status: 400, code: 'VALIDATION_ERROR', message, details });

export const unauthorized = (message = 'Unauthorized') =>
  new HttpError({ status: 401, code: 'UNAUTHORIZED', message });

export const forbidden = (message = 'Forbidden') =>
  new HttpError({ status: 403, code: 'FORBIDDEN', message });

export const notFound = (message = 'Not found') =>
  new HttpError({ status: 404, code: 'NOT_FOUND', message });

export const conflict = (message = 'Conflict', details?: unknown) =>
  new HttpError({ status: 409, code: 'CONFLICT', message, details });

