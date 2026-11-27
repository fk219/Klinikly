import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';
import { HospitalModel } from '../db/models/Hospital.js';
import { UserModel } from '../db/models/User.js';
import { DoctorModel } from '../db/models/Doctor.js';
import { AvailabilitySlotModel } from '../db/models/AvailabilitySlot.js';
import { AppointmentModel } from '../db/models/Appointment.js';

let mongo: MongoMemoryServer;
let app: Express;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  process.env.MONGODB_URI = uri;
  process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);

  const mod = await import('../app.js');
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
  if (mongo) await mongo.stop();
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
  it('books a slot atomically under concurrent requests', async () => {
    const { createAccessToken } = await import('../auth/tokens.js');

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

    const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await AvailabilitySlotModel.create({
      hospitalId: hospital._id,
      doctorId: doctor._id,
      startAt,
      status: 'available',
      source: 'generated'
    });

    const token = createAccessToken({ userId: patient._id.toString(), role: 'patient' });

    const attempts = await Promise.all(
      Array.from({ length: 100 }, () =>
        request(app)
          .post('/appointments')
          .set('Authorization', `Bearer ${token}`)
          .send({ doctorId: doctor._id.toString(), slotStartAt: startAt.toISOString(), reason: 'Checkup' })
      )
    );

    const statusCounts = attempts.reduce<Record<number, number>>((counts, response) => {
      counts[response.status] = (counts[response.status] ?? 0) + 1;
      return counts;
    }, {});

    expect(statusCounts[200]).toBe(1);
    expect(statusCounts[409]).toBe(99);
    expect(await AppointmentModel.countDocuments({ doctorId: doctor._id, slotStartAt: startAt })).toBe(1);

    const slot = await AvailabilitySlotModel.findOne({ doctorId: doctor._id, startAt });
    expect(slot?.status).toBe('booked');
  }, 30_000);

  it('cancels a scheduled appointment and restores slot availability', async () => {
    const { createAccessToken } = await import('../auth/tokens.js');

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

    const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
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

  it('rejects a booking for a time that has already passed', async () => {
    const { createAccessToken } = await import('../auth/tokens.js');

    const hospital = await HospitalModel.create({ name: 'City Care Hospital', slug: 'city-care', status: 'active' });
    const patient = await UserModel.create({
      email: 'past@example.com',
      passwordHash: 'hash',
      name: 'Patient',
      role: 'patient'
    });
    const doctor = await DoctorModel.create({
      hospitalId: hospital._id,
      name: 'Dr Past',
      specialty: 'Cardiology',
      bio: 'Bio',
      consultationFee: 100,
      rating: 4.9,
      active: true
    });

    const startAt = new Date(Date.now() - 60 * 60 * 1000);
    await AvailabilitySlotModel.create({
      hospitalId: hospital._id,
      doctorId: doctor._id,
      startAt,
      status: 'available',
      source: 'generated'
    });

    const token = createAccessToken({ userId: patient._id.toString(), role: 'patient' });
    const response = await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ doctorId: doctor._id.toString(), slotStartAt: startAt.toISOString(), reason: 'Checkup' });

    expect(response.status).toBe(400);
    expect(await AppointmentModel.countDocuments({ doctorId: doctor._id })).toBe(0);

    const slot = await AvailabilitySlotModel.findOne({ doctorId: doctor._id, startAt });
    expect(slot?.status).toBe('available');
  });

  it('does not expose slots that have already passed', async () => {
    const hospital = await HospitalModel.create({ name: 'City Care Hospital', slug: 'city-care', status: 'active' });
    const doctor = await DoctorModel.create({
      hospitalId: hospital._id,
      name: 'Dr Now',
      specialty: 'Neurology',
      bio: 'Bio',
      consultationFee: 150,
      rating: 4.8,
      active: true
    });

    const past = new Date(Date.now() - 60 * 60 * 1000);
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await AvailabilitySlotModel.create([
      { hospitalId: hospital._id, doctorId: doctor._id, startAt: past, status: 'available', source: 'generated' },
      { hospitalId: hospital._id, doctorId: doctor._id, startAt: future, status: 'available', source: 'generated' }
    ]);

    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const response = await request(app).get(
      `/doctors/${doctor._id.toString()}/availability?from=${from}&to=${to}`
    );

    expect(response.status).toBe(200);
    const starts = response.body.data.items.map((slot: { startAt: string }) => slot.startAt);
    expect(starts).toContain(future.toISOString());
    expect(starts).not.toContain(past.toISOString());
  });
});

