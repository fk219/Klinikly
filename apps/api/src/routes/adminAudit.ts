import { Router } from 'express';
import { z } from 'zod';
import { AuditLogModel } from '../db/models/AuditLog.js';
import { requireHospitalAdmin } from '../http/middleware/hospitalAdmin.js';

export const adminAuditRouter = Router();

adminAuditRouter.use(...requireHospitalAdmin());

const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

adminAuditRouter.get('/audit', async (req, res, next) => {
  try {
    const { limit } = listSchema.parse(req.query);
    const items = await AuditLogModel.find({ hospitalId: req.hospitalId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({
      data: {
        items: items.map((entry) => ({
          id: entry._id.toString(),
          hospitalId: entry.hospitalId.toString(),
          actorUserId: entry.actorUserId.toString(),
          actorRole: entry.actorRole,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId.toString(),
          metadata: entry.metadata ?? {},
          createdAt: entry.createdAt.toISOString()
        }))
      }
    });
  } catch (err) {
    return next(err);
  }
});
