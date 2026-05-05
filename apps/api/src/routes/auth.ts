import { Router, type Response } from 'express';
import { z } from 'zod';
import { createAccessToken, createRefreshToken, hashRefreshToken } from '../auth/tokens';
import { hashPassword, verifyPassword } from '../auth/password';
import { conflict, unauthorized } from '../http/errors';
import { UserModel } from '../db/models/User';
import { RefreshTokenModel } from '../db/models/RefreshToken';
import { env } from '../config';

const refreshCookieName = 'refreshToken';

const parseDurationToMs = (value: string) => {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2];
  const mult =
    unit === 's'
      ? 1000
      : unit === 'm'
        ? 60 * 1000
        : unit === 'h'
          ? 60 * 60 * 1000
          : 24 * 60 * 60 * 1000;
  return amount * mult;
};

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(refreshCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: parseDurationToMs(env.JWT_REFRESH_TTL)
  });
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(refreshCookieName);
};

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().min(1).optional()
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);

    const existing = await UserModel.findOne({ email: input.email.toLowerCase() }).lean();
    if (existing) return next(conflict('Email already registered'));

    const passwordHash = await hashPassword(input.password);
    const user = await UserModel.create({
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      phone: input.phone,
      role: 'patient'
    });

    const accessToken = createAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = createRefreshToken();

    await RefreshTokenModel.create({
      userId: user._id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_TTL))
    });

    setRefreshCookie(res, refreshToken);

    return res.json({
      data: {
        accessToken,
        user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role }
      }
    });
  } catch (err) {
    return next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);

    const user = await UserModel.findOne({ email: input.email.toLowerCase() });
    if (!user) return next(unauthorized('Invalid email or password'));

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) return next(unauthorized('Invalid email or password'));

    const accessToken = createAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = createRefreshToken();

    await RefreshTokenModel.create({
      userId: user._id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_TTL))
    });

    setRefreshCookie(res, refreshToken);

    return res.json({
      data: {
        accessToken,
        user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role }
      }
    });
  } catch (err) {
    return next(err);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.[refreshCookieName] as string | undefined;
    if (!token) return next(unauthorized());

    const tokenHash = hashRefreshToken(token);
    const existing = await RefreshTokenModel.findOne({ tokenHash, revokedAt: { $exists: false } });
    if (!existing) return next(unauthorized());
    if (existing.expiresAt.getTime() <= Date.now()) return next(unauthorized());

    const user = await UserModel.findById(existing.userId);
    if (!user) return next(unauthorized());

    existing.revokedAt = new Date();
    await existing.save();

    const newRefreshToken = createRefreshToken();
    await RefreshTokenModel.create({
      userId: user._id,
      tokenHash: hashRefreshToken(newRefreshToken),
      expiresAt: new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_TTL))
    });

    setRefreshCookie(res, newRefreshToken);

    const accessToken = createAccessToken({ userId: user._id.toString(), role: user.role });

    return res.json({
      data: {
        accessToken,
        user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role }
      }
    });
  } catch (err) {
    return next(err);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.[refreshCookieName] as string | undefined;
    if (token) {
      const tokenHash = hashRefreshToken(token);
      await RefreshTokenModel.updateOne(
        { tokenHash, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } }
      );
    }
    clearRefreshCookie(res);
    return res.json({ data: { ok: true } });
  } catch (err) {
    return next(err);
  }
});
