import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config';
import { errorHandler } from './http/middleware/errorHandler';
import { requestId } from './http/middleware/requestId';
import { adminAvailabilityRouter } from './routes/adminAvailability';
import { adminAppointmentsRouter } from './routes/adminAppointments';
import { appointmentsRouter, meRouter } from './routes/appointments';
import { authRouter } from './routes/auth';
import { doctorsRouter } from './routes/doctors';
import { healthRouter } from './routes/health';
import { hospitalsRouter } from './routes/hospitals';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN ?? true,
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestId());

  app.use('/auth', authRouter);
  app.use('/hospitals', hospitalsRouter);
  app.use('/doctors', doctorsRouter);
  app.use('/appointments', appointmentsRouter);
  app.use('/me', meRouter);
  app.use('/admin', adminAvailabilityRouter);
  app.use('/admin', adminAppointmentsRouter);
  app.use('/health', healthRouter);

  app.use(errorHandler());
  return app;
};
