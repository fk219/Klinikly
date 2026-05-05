import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AvailabilityRuleModel } from '../db/models/AvailabilityRule';
import { AvailabilitySlotModel } from '../db/models/AvailabilitySlot';
import { DoctorModel } from '../db/models/Doctor';
import { conflict, notFound } from '../http/errors';
import { requireHospitalAdmin } from '../http/middleware/hospitalAdmin';
import { generateSlots } from '../availability/generateSlots';

export const adminAvailabilityRouter = Router();

adminAvailabilityRouter.use(...requireHospitalAdmin());

const doctorParamSchema = z.object({ doctorId: z.string() });

const weeklyWindowSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/)
});

const weeklyTemplateSchema = z.object({
  mon: z.array(weeklyWindowSchema).optional(),
  tue: z.array(weeklyWindowSchema).optional(),
  wed: z.array(weeklyWindowSchema).optional(),
  thu: z.array(weeklyWindowSchema).optional(),
  fri: z.array(weeklyWindowSchema).optional(),
  sat: z.array(weeklyWindowSchema).optional(),
  sun: z.array(weeklyWindowSchema).optional()
});

const upsertRuleSchema = z.object({
  timezone: z.string().min(1),
  slotDurationMinutes: z.number().int().min(5).max(240),
  weeklyTemplate: weeklyTemplateSchema
});

adminAvailabilityRouter.put('/doctors/:doctorId/availability-rules', async (req, res, next) => {
  try {
    const { doctorId } = doctorParamSchema.parse(req.params);
    if (!mongoose.isValidObjectId(doctorId)) return next(notFound());

    const input = upsertRuleSchema.parse(req.body);

    const doctor = await DoctorModel.findOne({ _id: doctorId, hospitalId: req.hospitalId, active: true });
    if (!doctor) return next(notFound());

    const rule = await AvailabilityRuleModel.findOneAndUpdate(
      { doctorId: doctor._id },
      {
        $set: {
          hospitalId: req.hospitalId,
          doctorId: doctor._id,
          timezone: input.timezone,
          slotDurationMinutes: input.slotDurationMinutes,
          weeklyTemplate: input.weeklyTemplate
        }
      },
      { upsert: true, new: true }
    );

    return res.json({
      data: {
        id: rule._id.toString(),
        doctorId: rule.doctorId.toString(),
        timezone: rule.timezone,
        slotDurationMinutes: rule.slotDurationMinutes,
        weeklyTemplate: rule.weeklyTemplate
      }
    });
  } catch (err) {
    return next(err);
  }
});

const generateSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

adminAvailabilityRouter.post('/doctors/:doctorId/slots/generate', async (req, res, next) => {
  try {
    const { doctorId } = doctorParamSchema.parse(req.params);
    if (!mongoose.isValidObjectId(doctorId)) return next(notFound());
    const { from, to } = generateSchema.parse(req.body);

    const doctor = await DoctorModel.findOne({ _id: doctorId, hospitalId: req.hospitalId, active: true });
    if (!doctor) return next(notFound());

    const rule = await AvailabilityRuleModel.findOne({ doctorId: doctor._id, hospitalId: req.hospitalId });
    if (!rule) return next(notFound('Availability rule not found'));

    const startAts = generateSlots({
      from,
      to,
      slotDurationMinutes: rule.slotDurationMinutes,
      weeklyTemplate: rule.weeklyTemplate
    });

    const ops = startAts.map((startAt) => ({
      updateOne: {
        filter: { doctorId: doctor._id, startAt },
        update: {
          $setOnInsert: {
            hospitalId: req.hospitalId,
            doctorId: doctor._id,
            startAt,
            status: 'available',
            source: 'generated'
          }
        },
        upsert: true
      }
    }));

    if (ops.length) {
      await AvailabilitySlotModel.bulkWrite(ops, { ordered: false });
    }

    return res.json({ data: { createdOrKept: ops.length } });
  } catch (err) {
    return next(err);
  }
});

const startAtSchema = z.object({
  startAt: z.string().datetime()
});

adminAvailabilityRouter.post('/doctors/:doctorId/slots', async (req, res, next) => {
  try {
    const { doctorId } = doctorParamSchema.parse(req.params);
    if (!mongoose.isValidObjectId(doctorId)) return next(notFound());
    const { startAt } = startAtSchema.parse(req.body);

    const doctor = await DoctorModel.findOne({ _id: doctorId, hospitalId: req.hospitalId, active: true });
    if (!doctor) return next(notFound());

    const dt = new Date(startAt);
    await AvailabilitySlotModel.updateOne(
      { doctorId: doctor._id, startAt: dt },
      {
        $setOnInsert: {
          hospitalId: req.hospitalId,
          doctorId: doctor._id,
          startAt: dt,
          status: 'available',
          source: 'manual'
        }
      },
      { upsert: true }
    );

    return res.json({ data: { ok: true } });
  } catch (err) {
    return next(err);
  }
});

adminAvailabilityRouter.post('/doctors/:doctorId/slots/block', async (req, res, next) => {
  try {
    const { doctorId } = doctorParamSchema.parse(req.params);
    if (!mongoose.isValidObjectId(doctorId)) return next(notFound());
    const { startAt } = startAtSchema.parse(req.body);

    const doctor = await DoctorModel.findOne({ _id: doctorId, hospitalId: req.hospitalId, active: true });
    if (!doctor) return next(notFound());

    const dt = new Date(startAt);
    const existing = await AvailabilitySlotModel.findOne({ doctorId: doctor._id, startAt: dt });
    if (existing?.status === 'booked') return next(conflict('Slot already booked'));

    await AvailabilitySlotModel.updateOne(
      { doctorId: doctor._id, startAt: dt },
      {
        $set: { status: 'blocked', source: existing ? 'override' : 'manual', hospitalId: req.hospitalId, doctorId: doctor._id, startAt: dt }
      },
      { upsert: true }
    );

    return res.json({ data: { ok: true } });
  } catch (err) {
    return next(err);
  }
});

const deleteSchema = z.object({ slotId: z.string() });

adminAvailabilityRouter.delete('/slots/:slotId', async (req, res, next) => {
  try {
    const { slotId } = deleteSchema.parse(req.params);
    if (!mongoose.isValidObjectId(slotId)) return next(notFound());

    const slot = await AvailabilitySlotModel.findOne({ _id: slotId, hospitalId: req.hospitalId });
    if (!slot) return next(notFound());
    if (slot.status === 'booked') return next(conflict('Cannot delete booked slot'));

    await AvailabilitySlotModel.deleteOne({ _id: slot._id });
    return res.json({ data: { ok: true } });
  } catch (err) {
    return next(err);
  }
});

const listSlotsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});

adminAvailabilityRouter.get('/doctors/:doctorId/slots', async (req, res, next) => {
  try {
    const { doctorId } = doctorParamSchema.parse(req.params);
    if (!mongoose.isValidObjectId(doctorId)) return next(notFound());
    const { from, to } = listSlotsSchema.parse(req.query);

    const doctor = await DoctorModel.findOne({ _id: doctorId, hospitalId: req.hospitalId, active: true });
    if (!doctor) return next(notFound());

    const filter: Record<string, unknown> = { doctorId: doctor._id, hospitalId: req.hospitalId };
    if (from || to) {
      const startAtFilter: { $gte?: Date; $lte?: Date } = {};
      if (from) startAtFilter.$gte = new Date(from);
      if (to) startAtFilter.$lte = new Date(to);
      filter.startAt = startAtFilter;
    }

    const slots = await AvailabilitySlotModel.find(filter).sort({ startAt: 1 }).limit(2000);
    return res.json({
      data: {
        items: slots.map((s) => ({
          id: s._id.toString(),
          doctorId: s.doctorId.toString(),
          startAt: s.startAt.toISOString(),
          status: s.status,
          source: s.source
        }))
      }
    });
  } catch (err) {
    return next(err);
  }
});
