import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config.js';
import { errorHandler } from './http/middleware/errorHandler.js';
import { requestId } from './http/middleware/requestId.js';
import { adminAvailabilityRouter } from './routes/adminAvailability.js';
import { adminAppointmentsRouter } from './routes/adminAppointments.js';
import { adminDoctorsRouter } from './routes/adminDoctors.js';
import { appointmentsRouter, meRouter } from './routes/appointments.js';
import { authRouter } from './routes/auth.js';
import { doctorsRouter } from './routes/doctors.js';
import { healthRouter } from './routes/health.js';
import { hospitalsRouter } from './routes/hospitals.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } }
});

const allowedOrigins = env.CORS_ORIGIN?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins?.length ? allowedOrigins : true,
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestId());

  // Rate-limit auth endpoints
  app.use('/auth/login', authLimiter);
  app.use('/auth/register', authLimiter);

  app.use('/auth', authRouter);
  app.use('/hospitals', hospitalsRouter);
  app.use('/doctors', doctorsRouter);
  app.use('/appointments', appointmentsRouter);
  app.use('/me', meRouter);
  app.use('/admin', adminDoctorsRouter);
  app.use('/admin', adminAvailabilityRouter);
  app.use('/admin', adminAppointmentsRouter);
  app.use('/health', healthRouter);

  app.use(errorHandler());
  return app;
};
