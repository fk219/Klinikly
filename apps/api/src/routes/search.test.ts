import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';
import { HospitalModel } from '../db/models/Hospital';
import { DoctorModel } from '../db/models/Doctor';

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
  await Promise.all([HospitalModel.syncIndexes(), DoctorModel.syncIndexes()]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
  await Promise.all([HospitalModel.syncIndexes(), DoctorModel.syncIndexes()]);
});

describe('search', () => {
  it('searches hospitals by name', async () => {
    await HospitalModel.create({ name: 'City Care Hospital', slug: 'city-care', status: 'active' });
    await HospitalModel.create({ name: 'Green Valley Clinic', slug: 'green-valley', status: 'active' });

    const res = await request(app).get('/hospitals').query({ query: 'City' });
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].slug).toBe('city-care');
  });

  it('filters doctors by specialty and hospitalId', async () => {
    const h1 = await HospitalModel.create({ name: 'City Care Hospital', slug: 'city-care', status: 'active' });
    const h2 = await HospitalModel.create({ name: 'Green Valley Clinic', slug: 'green-valley', status: 'active' });

    await DoctorModel.create({
      hospitalId: h1._id,
      name: 'Dr One',
      specialty: 'Cardiology',
      bio: 'Bio',
      consultationFee: 100,
      rating: 4.9,
      active: true
    });
    await DoctorModel.create({
      hospitalId: h2._id,
      name: 'Dr Two',
      specialty: 'Dermatology',
      bio: 'Bio',
      consultationFee: 120,
      rating: 4.8,
      active: true
    });

    const res1 = await request(app).get('/doctors').query({ specialty: 'Cardiology' });
    expect(res1.status).toBe(200);
    expect(res1.body.data.items.length).toBe(1);
    expect(res1.body.data.items[0].name).toBe('Dr One');

    const res2 = await request(app).get('/doctors').query({ hospitalId: h2._id.toString() });
    expect(res2.status).toBe(200);
    expect(res2.body.data.items.length).toBe(1);
    expect(res2.body.data.items[0].name).toBe('Dr Two');
  });
});

