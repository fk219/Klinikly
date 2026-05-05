import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { HospitalAdminModel } from '../../db/models/HospitalAdmin';
import { requireAuth } from './auth';
import { forbidden, unauthorized } from '../errors';

declare module 'express-serve-static-core' {
  interface Request {
    hospitalId?: mongoose.Types.ObjectId;
  }
}

export const requireHospitalAdmin = (): RequestHandler[] => [
  requireAuth(),
  async (req, _res, next) => {
    if (!req.auth) return next(unauthorized());
    if (req.auth.role !== 'hospital_admin') return next(forbidden());

    const mapping = await HospitalAdminModel.findOne({ userId: req.auth.userId }).lean<{
      hospitalId: mongoose.Types.ObjectId;
    }>();
    if (!mapping) return next(forbidden());

    req.hospitalId = mapping.hospitalId;
    return next();
  }
];
