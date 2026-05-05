import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { DoctorModel } from '../db/models/Doctor';
import { AvailabilitySlotModel } from '../db/models/AvailabilitySlot';
import { notFound } from '../http/errors';

export const doctorsRouter = Router();

const listSchema = z.object({
  query: z.string().optional(),
  specialty: z.string().optional(),
  hospitalId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20)
});

doctorsRouter.get('/', async (req, res, next) => {
  try {
    const { query, specialty, hospitalId, page, limit } = listSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { active: true };

    if (specialty?.trim()) filter.specialty = specialty.trim();

    if (hospitalId?.trim() && mongoose.isValidObjectId(hospitalId)) {
      filter.hospitalId = new mongoose.Types.ObjectId(hospitalId);
    }

    if (query?.trim()) {
      filter.$text = { $search: query.trim() };
    }

    const [items, total] = await Promise.all([
      DoctorModel.find(filter).sort({ rating: -1, name: 1 }).skip(skip).limit(limit),
      DoctorModel.countDocuments(filter)
    ]);

    return res.json({
      data: {
        items: items.map((d) => ({
          id: d._id.toString(),
          hospitalId: d.hospitalId.toString(),
          name: d.name,
          specialty: d.specialty,
          bio: d.bio,
          education: d.education ?? null,
          experience: d.experience ?? null,
          consultationFee: d.consultationFee,
          rating: d.rating ?? null,
          avatarUrl: d.avatarUrl ?? null
        })),
        page,
        limit,
        total
      }
    });
  } catch (err) {
    return next(err);
  }
});

doctorsRouter.get('/:doctorId', async (req, res, next) => {
  try {
    const { doctorId } = z.object({ doctorId: z.string() }).parse(req.params);
    if (!mongoose.isValidObjectId(doctorId)) return next(notFound());

    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor || !doctor.active) return next(notFound());

    return res.json({
      data: {
        id: doctor._id.toString(),
        hospitalId: doctor.hospitalId.toString(),
        name: doctor.name,
        specialty: doctor.specialty,
        bio: doctor.bio,
        education: doctor.education ?? null,
        experience: doctor.experience ?? null,
        consultationFee: doctor.consultationFee,
        rating: doctor.rating ?? null,
        avatarUrl: doctor.avatarUrl ?? null
      }
    });
  } catch (err) {
    return next(err);
  }
});

const availabilityQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const parseDateStartUtc = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
};

const parseDateEndUtc = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
};

doctorsRouter.get('/:doctorId/availability', async (req, res, next) => {
  try {
    const { doctorId } = z.object({ doctorId: z.string() }).parse(req.params);
    if (!mongoose.isValidObjectId(doctorId)) return next(notFound());
    const { from, to } = availabilityQuerySchema.parse(req.query);

    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor || !doctor.active) return next(notFound());

    const fromDt = parseDateStartUtc(from);
    const toDt = parseDateEndUtc(to);

    const slots = await AvailabilitySlotModel.find({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      status: 'available',
      startAt: { $gte: fromDt, $lte: toDt }
    })
      .sort({ startAt: 1 })
      .limit(2000);

    return res.json({
      data: {
        items: slots.map((s) => ({
          id: s._id.toString(),
          startAt: s.startAt.toISOString()
        }))
      }
    });
  } catch (err) {
    return next(err);
  }
});
