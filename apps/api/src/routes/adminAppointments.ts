import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AppointmentModel } from '../db/models/Appointment';
import { AvailabilitySlotModel } from '../db/models/AvailabilitySlot';
import { DoctorModel } from '../db/models/Doctor';
import { conflict, notFound } from '../http/errors';
import { requireHospitalAdmin } from '../http/middleware/hospitalAdmin';

export const adminAppointmentsRouter = Router();

adminAppointmentsRouter.use(...requireHospitalAdmin());

const listSchema = z.object({
  doctorId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});

adminAppointmentsRouter.get('/appointments', async (req, res, next) => {
  try {
    const { doctorId, from, to } = listSchema.parse(req.query);

    const filter: Record<string, unknown> = { hospitalId: req.hospitalId };
    if (doctorId?.trim()) {
      if (!mongoose.isValidObjectId(doctorId)) return next(notFound());
      const doctor = await DoctorModel.findOne({ _id: doctorId, hospitalId: req.hospitalId, active: true }).lean();
      if (!doctor) return next(notFound());
      filter.doctorId = new mongoose.Types.ObjectId(doctorId);
    }

    if (from || to) {
      const slotStartAt: { $gte?: Date; $lte?: Date } = {};
      if (from) slotStartAt.$gte = new Date(from);
      if (to) slotStartAt.$lte = new Date(to);
      filter.slotStartAt = slotStartAt;
    }

    const items = await AppointmentModel.find(filter).sort({ slotStartAt: -1 }).limit(500);

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

const idSchema = z.object({ appointmentId: z.string() });

adminAppointmentsRouter.post('/appointments/:appointmentId/cancel', async (req, res, next) => {
  try {
    const { appointmentId } = idSchema.parse(req.params);
    if (!mongoose.isValidObjectId(appointmentId)) return next(notFound());

    const appointment = await AppointmentModel.findOne({ _id: appointmentId, hospitalId: req.hospitalId });
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

adminAppointmentsRouter.post('/appointments/:appointmentId/complete', async (req, res, next) => {
  try {
    const { appointmentId } = idSchema.parse(req.params);
    if (!mongoose.isValidObjectId(appointmentId)) return next(notFound());

    const appointment = await AppointmentModel.findOne({ _id: appointmentId, hospitalId: req.hospitalId });
    if (!appointment) return next(notFound());
    if (appointment.status !== 'scheduled') return next(conflict('Appointment not completable'));

    appointment.status = 'completed';
    await appointment.save();

    return res.json({ data: { ok: true } });
  } catch (err) {
    return next(err);
  }
});

