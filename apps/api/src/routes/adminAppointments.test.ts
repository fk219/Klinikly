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
  if (mongo) await mongo.stop();
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

    const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
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

  it('scopes admin reads and writes to the authenticated hospital', async () => {
    const { createAccessToken } = await import('../auth/tokens');

    const hospitalA = await HospitalModel.create({ name: 'Hospital A', slug: 'hospital-a', status: 'active' });
    const hospitalB = await HospitalModel.create({ name: 'Hospital B', slug: 'hospital-b', status: 'active' });

    const adminA = await UserModel.create({
      email: 'admin-a@example.com',
      passwordHash: 'hash',
      name: 'Admin A',
      role: 'hospital_admin'
    });
    const adminB = await UserModel.create({
      email: 'admin-b@example.com',
      passwordHash: 'hash',
      name: 'Admin B',
      role: 'hospital_admin'
    });
    await HospitalAdminModel.create({ hospitalId: hospitalA._id, userId: adminA._id });
    await HospitalAdminModel.create({ hospitalId: hospitalB._id, userId: adminB._id });

    const doctorA = await DoctorModel.create({
      hospitalId: hospitalA._id,
      name: 'Doctor A',
      specialty: 'Cardiology',
      bio: 'A',
      consultationFee: 100,
      rating: 4.8,
      active: true
    });
    const doctorB = await DoctorModel.create({
      hospitalId: hospitalB._id,
      name: 'Doctor B',
      specialty: 'Dermatology',
      bio: 'B',
      consultationFee: 120,
      rating: 4.7,
      active: true
    });

    const patient = await UserModel.create({
      email: 'patient-tenant@example.com',
      passwordHash: 'hash',
      name: 'Patient',
      role: 'patient'
    });
    await AppointmentModel.create({
      hospitalId: hospitalB._id,
      patientUserId: patient._id,
      doctorId: doctorB._id,
      slotStartAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      reason: 'Other tenant appointment',
      status: 'scheduled'
    });

    const tokenA = createAccessToken({ userId: adminA._id.toString(), role: 'hospital_admin' });

    const doctors = await request(app)
      .get('/admin/doctors')
      .set('Authorization', `Bearer ${tokenA}`)
      .send();
    expect(doctors.status).toBe(200);
    expect(doctors.body.data.items.map((doctor: { id: string }) => doctor.id)).toEqual([doctorA._id.toString()]);

    const patchOther = await request(app)
      .patch(`/admin/doctors/${doctorB._id.toString()}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Compromised' });
    expect(patchOther.status).toBe(404);

    const appointments = await request(app)
      .get('/admin/appointments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send();
    expect(appointments.status).toBe(200);
    expect(appointments.body.data.items).toHaveLength(0);
  });
});

