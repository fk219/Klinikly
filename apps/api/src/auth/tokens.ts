import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config';

export type AccessTokenPayload = {
  userId: string;
  role: 'patient' | 'hospital_admin' | 'platform_admin';
};

export const createAccessToken = (payload: AccessTokenPayload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as unknown as jwt.SignOptions['expiresIn']
  });

export const createRefreshToken = () => crypto.randomBytes(48).toString('base64url');

export const hashRefreshToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');
