import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';
import { HospitalModel } from '../db/models/Hospital.js';
import { UserModel } from '../db/models/User.js';
import { HospitalAdminModel } from '../db/models/HospitalAdmin.js';
import { DoctorModel } from '../db/models/Doctor.js';
import { AvailabilitySlotModel } from '../db/models/AvailabilitySlot.js';
import { AuditLogModel } from '../db/models/AuditLog.js';

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
    HospitalAdminModel.syncIndexes(),
    DoctorModel.syncIndexes(),
    AvailabilitySlotModel.syncIndexes(),
    AuditLogModel.syncIndexes()
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
    AuditLogModel.syncIndexes()
  ]);
});

describe('admin audit log', () => {
  it('reports readiness with a live database', async () => {
    const health = await request(app).get('/health/ready').send();

    expect(health.status).toBe(200);
    expect(health.body.data.ok).toBe(true);
    expect(health.body.data.database).toBe('up');
  });

  it('records a booking and only exposes it to the owning hospital', async () => {
    const { createAccessToken } = await import('../auth/tokens.js');

    const hospital = await HospitalModel.create({ name: 'City Care Hospital', slug: 'city-care', status: 'active' });
    const otherHospital = await HospitalModel.create({ name: 'Green Valley Clinic', slug: 'green-valley', status: 'active' });

    const adminUser = await UserModel.create({
      email: 'admin@city-care.example.com',
      passwordHash: 'hash',
      name: 'City Admin',
      role: 'hospital_admin'
    });
    const otherAdminUser = await UserModel.create({
      email: 'admin@green-valley.example.com',
      passwordHash: 'hash',
      name: 'Green Admin',
      role: 'hospital_admin'
    });
    await HospitalAdminModel.create({ hospitalId: hospital._id, userId: adminUser._id });
    await HospitalAdminModel.create({ hospitalId: otherHospital._id, userId: otherAdminUser._id });

    const patient = await UserModel.create({
      email: 'patient@example.com',
      passwordHash: 'hash',
      name: 'Patient',
      role: 'patient'
    });
    const doctor = await DoctorModel.create({
      hospitalId: hospital._id,
      name: 'Dr Audit',
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
    const booking = await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ doctorId: doctor._id.toString(), slotStartAt: startAt.toISOString(), reason: 'Checkup' });

    expect(booking.status).toBe(200);

    const adminToken = createAccessToken({ userId: adminUser._id.toString(), role: 'hospital_admin' });
    const ownAudit = await request(app)
      .get('/admin/audit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send();

    expect(ownAudit.status).toBe(200);
    expect(ownAudit.body.data.items).toHaveLength(1);
    expect(ownAudit.body.data.items[0].action).toBe('appointment.booked');
    expect(ownAudit.body.data.items[0].entityId).toBe(booking.body.data.id);

    const otherAdminToken = createAccessToken({ userId: otherAdminUser._id.toString(), role: 'hospital_admin' });
    const otherAudit = await request(app)
      .get('/admin/audit')
      .set('Authorization', `Bearer ${otherAdminToken}`)
      .send();

    expect(otherAudit.status).toBe(200);
    expect(otherAudit.body.data.items).toHaveLength(0);

    const patientAudit = await request(app)
      .get('/admin/audit')
      .set('Authorization', `Bearer ${patientToken}`)
      .send();

    expect(patientAudit.status).toBe(403);
  });
});
