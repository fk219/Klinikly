import { Router } from 'express';
import mongoose from 'mongoose';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => res.json({ data: { ok: true } }));

healthRouter.get('/ready', async (_req, res) => {
  const startedAt = Date.now();
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return res.status(503).json({
        data: {
          ok: false,
          database: 'not-connected',
          uptimeSeconds: Math.round(process.uptime())
        }
      });
    }

    await mongoose.connection.db.admin().ping();

    return res.json({
      data: {
        ok: true,
        database: 'up',
        latencyMs: Date.now() - startedAt,
        uptimeSeconds: Math.round(process.uptime()),
        version: process.env.npm_package_version ?? 'unknown'
      }
    });
  } catch (error) {
    return res.status(503).json({
      data: {
        ok: false,
        database: 'unreachable',
        error: error instanceof Error ? error.message : 'unknown'
      }
    });
  }
});
