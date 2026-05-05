import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config';
import { forbidden, unauthorized } from '../errors';

export type AuthUser = {
  userId: string;
  role: 'patient' | 'hospital_admin' | 'platform_admin';
};

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthUser;
  }
}

export const requireAuth = (): RequestHandler => (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(unauthorized());
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser;
    req.auth = payload;
    return next();
  } catch {
    return next(unauthorized());
  }
};

export const requireRole =
  (role: AuthUser['role']): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) return next(unauthorized());
    if (req.auth.role !== role) return next(forbidden());
    return next();
  };

