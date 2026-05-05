import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../errors';

export const errorHandler = (): ErrorRequestHandler => (err, req, res, _next) => {
  void _next;
  const requestId = req.requestId;

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details, requestId }
    });
  }

  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Internal server error', requestId }
  });
};
