import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';
import { HospitalModel } from '../db/models/Hospital';
import { UserModel } from '../db/models/User';
import { HospitalAdminModel } from '../db/models/HospitalAdmin';
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
    HospitalAdminModel.syncIndexes(),
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
    HospitalAdminModel.syncIndexes(),
    DoctorModel.syncIndexes(),
    AvailabilitySlotModel.syncIndexes(),
    AppointmentModel.syncIndexes()
  ]);
});

describe('admin appointments', () => {
  it('lists and completes an appointment', async () => {
    const { createAccessToken } = await import('../auth/tokens');

    const hospital = await HospitalModel.create({ name: 'City Care Hospital', slug: 'city-care', status: 'active' });
    const adminUser = await UserModel.create({
      email: 'admin@city-care.example.com',
      passwordHash: 'hash',
      name: 'Admin',
      role: 'hospital_admin'
    });
    await HospitalAdminModel.create({ hospitalId: hospital._id, userId: adminUser._id });

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

    const patientToken = createAccessToken({ userId: patient._id.toString(), role: 'patient' });
    const book = await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ doctorId: doctor._id.toString(), slotStartAt: startAt.toISOString(), reason: 'Checkup' });
    expect(book.status).toBe(200);

    const appointmentId = book.body.data.id as string;

    const adminToken = createAccessToken({ userId: adminUser._id.toString(), role: 'hospital_admin' });
    const list = await request(app).get('/admin/appointments').set('Authorization', `Bearer ${adminToken}`).send();
    expect(list.status).toBe(200);
    expect(list.body.data.items.length).toBe(1);

    const complete = await request(app)
      .post(`/admin/appointments/${appointmentId}/complete`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();
    expect(complete.status).toBe(200);

    const cancel = await request(app)
      .post(`/admin/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();
    expect(cancel.status).toBe(409);
  });
});

