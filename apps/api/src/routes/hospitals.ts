import { Router } from 'express';
import { z } from 'zod';
import { HospitalModel } from '../db/models/Hospital';

export const hospitalsRouter = Router();

const querySchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20)
});

hospitalsRouter.get('/', async (req, res, next) => {
  try {
    const { query, page, limit } = querySchema.parse(req.query);
    const skip = (page - 1) * limit;

    const filter =
      query && query.trim()
        ? { $text: { $search: query.trim() }, status: 'active' as const }
        : { status: 'active' as const };

    const [items, total] = await Promise.all([
      HospitalModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      HospitalModel.countDocuments(filter)
    ]);

    return res.json({
      data: {
        items: items.map((h) => ({ id: h._id.toString(), name: h.name, slug: h.slug })),
        page,
        limit,
        total
      }
    });
  } catch (err) {
    return next(err);
  }
});

