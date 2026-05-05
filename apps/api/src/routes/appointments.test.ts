import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';
import { HospitalModel } from '../db/models/Hospital';
import { UserModel } from '../db/models/User';
import { DoctorModel } from '../db/models/Doctor';
import { AvailabilitySlotModel } from '../db/models/AvailabilitySlot';
import { AppointmentModel } from '../db/models/Appointment';

let mongo: MongoMemoryServer;
let app: Express;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  process.env.MONGODB_URI = uri;
  process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);

  const mod = await import('../app');
  app = mod.createApp();

  await mongoose.connect(uri);
  await Promise.all([
    HospitalModel.syncIndexes(),
    UserModel.syncIndexes(),
    DoctorModel.syncIndexes(),
    AvailabilitySlotModel.syncIndexes(),
    AppointmentModel.syncIndexes()
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
  await Promise.all([
    HospitalModel.syncIndexes(),
    UserModel.syncIndexes(),
    DoctorModel.syncIndexes(),
    AvailabilitySlotModel.syncIndexes(),
    AppointmentModel.syncIndexes()
  ]);
});

describe('appointments', () => {
  it('books a slot atomically and prevents double booking', async () => {
    const { createAccessToken } = await import('../auth/tokens');

    const hospital = await HospitalModel.create({ name: 'City Care Hospital', slug: 'city-care', status: 'active' });
    const patient = await UserModel.create({
      email: 'p1@example.com',
      passwordHash: 'hash',
      name: 'Patient',
      role: 'patient'
    });
    const doctor = await DoctorModel.create({
      hospitalId: hospital._id,
      name: 'Dr One',
      specialty: 'Cardiology',
      bio: 'Bio',
      consultationFee: 100,
      rating: 4.9,
      active: true
    });

    const startAt = new Date('2026-05-04T09:00:00.000Z');
    await AvailabilitySlotModel.create({
      hospitalId: hospital._id,
      doctorId: doctor._id,
      startAt,
      status: 'available',
      source: 'generated'
    });

    const token = createAccessToken({ userId: patient._id.toString(), role: 'patient' });

    const book1 = await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ doctorId: doctor._id.toString(), slotStartAt: startAt.toISOString(), reason: 'Checkup' });

    expect(book1.status).toBe(200);

    const book2 = await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ doctorId: doctor._id.toString(), slotStartAt: startAt.toISOString(), reason: 'Checkup' });

    expect(book2.status).toBe(409);
  });

  it('cancels a scheduled appointment and restores slot availability', async () => {
    const { createAccessToken } = await import('../auth/tokens');

    const hospital = await HospitalModel.create({ name: 'City Care Hospital', slug: 'city-care', status: 'active' });
    const patient = await UserModel.create({
      email: 'p1@example.com',
      passwordHash: 'hash',
      name: 'Patient',
      role: 'patient'
    });
    const doctor = await DoctorModel.create({
      hospitalId: hospital._id,
      name: 'Dr One',
      specialty: 'Cardiology',
      bio: 'Bio',
      consultationFee: 100,
      rating: 4.9,
      active: true
    });

    const startAt = new Date('2026-05-04T09:00:00.000Z');
    await AvailabilitySlotModel.create({
      hospitalId: hospital._id,
      doctorId: doctor._id,
      startAt,
      status: 'available',
      source: 'generated'
    });

    const token = createAccessToken({ userId: patient._id.toString(), role: 'patient' });

    const book = await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ doctorId: doctor._id.toString(), slotStartAt: startAt.toISOString(), reason: 'Checkup' });

    const appointmentId = book.body.data.id as string;

    const cancel = await request(app)
      .post(`/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(cancel.status).toBe(200);

    const slot = await AvailabilitySlotModel.findOne({ doctorId: doctor._id, startAt });
    expect(slot?.status).toBe('available');
  });
});

