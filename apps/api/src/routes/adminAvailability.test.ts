import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';
import { HospitalModel } from '../db/models/Hospital';
import { UserModel } from '../db/models/User';
import { HospitalAdminModel } from '../db/models/HospitalAdmin';
import { DoctorModel } from '../db/models/Doctor';
import { AvailabilityRuleModel } from '../db/models/AvailabilityRule';
import { AvailabilitySlotModel } from '../db/models/AvailabilitySlot';

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
    AvailabilityRuleModel.syncIndexes(),
    AvailabilitySlotModel.syncIndexes()
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
    AvailabilityRuleModel.syncIndexes(),
    AvailabilitySlotModel.syncIndexes()
  ]);
});

describe('admin availability', () => {
  it('sets rules and generates slots', async () => {
    const { createAccessToken } = await import('../auth/tokens');

    const hospital = await HospitalModel.create({ name: 'City Care Hospital', slug: 'city-care', status: 'active' });
    const adminUser = await UserModel.create({
      email: 'admin@city-care.example.com',
      passwordHash: 'hash',
      name: 'Admin',
      role: 'hospital_admin'
    });
    await HospitalAdminModel.create({ hospitalId: hospital._id, userId: adminUser._id });

    const doctor = await DoctorModel.create({
      hospitalId: hospital._id,
      name: 'Dr One',
      specialty: 'Cardiology',
      bio: 'Bio',
      consultationFee: 100,
      rating: 4.9,
      active: true
    });

    const token = createAccessToken({ userId: adminUser._id.toString(), role: 'hospital_admin' });

    const ruleRes = await request(app)
      .put(`/admin/doctors/${doctor._id.toString()}/availability-rules`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        timezone: 'UTC',
        slotDurationMinutes: 60,
        weeklyTemplate: { mon: [{ start: '09:00', end: '12:00' }] }
      });

    expect(ruleRes.status).toBe(200);

    const genRes = await request(app)
      .post(`/admin/doctors/${doctor._id.toString()}/slots/generate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ from: '2026-05-04', to: '2026-05-04' });

    expect(genRes.status).toBe(200);

    const listRes = await request(app)
      .get(`/admin/doctors/${doctor._id.toString()}/slots`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items.length).toBe(3);
  });
});

