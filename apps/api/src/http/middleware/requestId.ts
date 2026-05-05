import type { RequestHandler } from 'express';
import crypto from 'crypto';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

export const requestId = (): RequestHandler => (req, res, next) => {
  const id = crypto.randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
};

