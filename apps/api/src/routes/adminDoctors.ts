import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { DoctorModel } from '../db/models/Doctor.js';
import { HospitalModel } from '../db/models/Hospital.js';
import { notFound } from '../http/errors.js';
import { requireHospitalAdmin } from '../http/middleware/hospitalAdmin.js';

export const adminDoctorsRouter = Router();

adminDoctorsRouter.use(...requireHospitalAdmin());

// GET /admin/hospital — return the admin's hospital profile
adminDoctorsRouter.get('/hospital', async (req, res, next) => {
  try {
    const hospital = await HospitalModel.findById(req.hospitalId).lean<{ _id: mongoose.Types.ObjectId; name: string; slug: string; status: string }>();
    if (!hospital) return next(notFound());
    return res.json({
      data: {
        id: hospital._id.toString(),
        name: hospital.name,
        slug: hospital.slug,
        status: hospital.status
      }
    });
  } catch (err) {
    return next(err);
  }
});

// GET /admin/doctors — list all doctors for this hospital
adminDoctorsRouter.get('/doctors', async (req, res, next) => {
  try {
    const doctors = await DoctorModel.find({ hospitalId: req.hospitalId }).sort({ name: 1 });
    return res.json({
      data: {
        items: doctors.map((d) => ({
          id: d._id.toString(),
          hospitalId: d.hospitalId.toString(),
          name: d.name,
          specialty: d.specialty,
          bio: d.bio,
          education: d.education ?? null,
          experience: d.experience ?? null,
          consultationFee: d.consultationFee,
          rating: d.rating ?? null,
          avatarUrl: d.avatarUrl ?? null,
          active: d.active
        })),
        total: doctors.length
      }
    });
  } catch (err) {
    return next(err);
  }
});

const createDoctorSchema = z.object({
  name: z.string().min(1),
  specialty: z.string().min(1),
  bio: z.string().min(1),
  education: z.string().optional(),
  experience: z.number().int().positive().optional(),
  consultationFee: z.number().positive(),
  avatarUrl: z.string().url().optional().or(z.literal(''))
});

// POST /admin/doctors — create a new doctor
adminDoctorsRouter.post('/doctors', async (req, res, next) => {
  try {
    const input = createDoctorSchema.parse(req.body);
    const doctor = await DoctorModel.create({
      ...input,
      avatarUrl: input.avatarUrl || undefined,
      hospitalId: req.hospitalId,
      active: true
    });
    return res.status(201).json({
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
        avatarUrl: doctor.avatarUrl ?? null,
        active: doctor.active
      }
    });
  } catch (err) {
    return next(err);
  }
});

const patchDoctorSchema = z.object({
  name: z.string().min(1).optional(),
  specialty: z.string().min(1).optional(),
  bio: z.string().min(1).optional(),
  education: z.string().optional(),
  experience: z.number().int().positive().optional(),
  consultationFee: z.number().positive().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  active: z.boolean().optional()
});

// PATCH /admin/doctors/:id — update a doctor
adminDoctorsRouter.patch('/doctors/:id', async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    if (!mongoose.isValidObjectId(id)) return next(notFound());

    const input = patchDoctorSchema.parse(req.body);
    const update: Record<string, unknown> = { ...input };
    if (input.avatarUrl === '') update.avatarUrl = undefined;

    const doctor = await DoctorModel.findOneAndUpdate(
      { _id: id, hospitalId: req.hospitalId },
      { $set: update },
      { new: true }
    );
    if (!doctor) return next(notFound());

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
        avatarUrl: doctor.avatarUrl ?? null,
        active: doctor.active
      }
    });
  } catch (err) {
    return next(err);
  }
});
