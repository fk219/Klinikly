import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AppointmentModel } from '../db/models/Appointment';
import { AvailabilitySlotModel } from '../db/models/AvailabilitySlot';
import { DoctorModel } from '../db/models/Doctor';
import { conflict, notFound } from '../http/errors';
import { requireAuth, requireRole } from '../http/middleware/auth';

export const appointmentsRouter = Router();

appointmentsRouter.use(requireAuth(), requireRole('patient'));

const bookSchema = z.object({
  doctorId: z.string(),
  slotStartAt: z.string().datetime(),
  reason: z.string().min(1).max(500)
});

appointmentsRouter.post('/', async (req, res, next) => {
  try {
    const input = bookSchema.parse(req.body);
    if (!mongoose.isValidObjectId(input.doctorId)) return next(notFound());

    const doctor = await DoctorModel.findOne({ _id: input.doctorId, active: true });
    if (!doctor) return next(notFound());

    const startAt = new Date(input.slotStartAt);

    const slot = await AvailabilitySlotModel.findOneAndUpdate(
      { doctorId: doctor._id, startAt, status: 'available' },
      { $set: { status: 'booked', source: 'override' } },
      { new: true }
    );

    if (!slot) return next(conflict('Slot not available'));

    const appointment = await AppointmentModel.create({
      hospitalId: doctor.hospitalId,
      patientUserId: new mongoose.Types.ObjectId(req.auth!.userId),
      doctorId: doctor._id,
      slotStartAt: startAt,
      reason: input.reason,
      status: 'scheduled'
    });

    return res.json({
      data: {
        id: appointment._id.toString(),
        hospitalId: appointment.hospitalId.toString(),
        doctorId: appointment.doctorId.toString(),
        patientUserId: appointment.patientUserId.toString(),
        slotStartAt: appointment.slotStartAt.toISOString(),
        reason: appointment.reason,
        status: appointment.status,
        createdAt: appointment.createdAt.toISOString()
      }
    });
  } catch (err) {
    return next(err);
  }
});

const cancelSchema = z.object({ appointmentId: z.string() });

appointmentsRouter.post('/:appointmentId/cancel', async (req, res, next) => {
  try {
    const { appointmentId } = cancelSchema.parse(req.params);
    if (!mongoose.isValidObjectId(appointmentId)) return next(notFound());

    const appointment = await AppointmentModel.findOne({
      _id: appointmentId,
      patientUserId: new mongoose.Types.ObjectId(req.auth!.userId)
    });
    if (!appointment) return next(notFound());
    if (appointment.status !== 'scheduled') return next(conflict('Appointment not cancellable'));

    appointment.status = 'cancelled';
    await appointment.save();

    await AvailabilitySlotModel.updateOne(
      { doctorId: appointment.doctorId, startAt: appointment.slotStartAt, status: 'booked' },
      { $set: { status: 'available', source: 'override' } }
    );

    return res.json({ data: { ok: true } });
  } catch (err) {
    return next(err);
  }
});

export const meRouter = Router();

meRouter.use(requireAuth(), requireRole('patient'));

meRouter.get('/appointments', async (req, res, next) => {
  try {
    const items = await AppointmentModel.find({ patientUserId: new mongoose.Types.ObjectId(req.auth!.userId) })
      .sort({ slotStartAt: -1 })
      .limit(200);

    return res.json({
      data: {
        items: items.map((a) => ({
          id: a._id.toString(),
          hospitalId: a.hospitalId.toString(),
          doctorId: a.doctorId.toString(),
          patientUserId: a.patientUserId.toString(),
          slotStartAt: a.slotStartAt.toISOString(),
          reason: a.reason,
          status: a.status,
          createdAt: a.createdAt.toISOString()
        }))
      }
    });
  } catch (err) {
    return next(err);
  }
});

