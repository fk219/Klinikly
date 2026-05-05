import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';

let mongo: MongoMemoryServer;
let app: Express;

const getCookieValue = (setCookie: string, name: string) => {
  const match = new RegExp(`${name}=([^;]+)`).exec(setCookie);
  return match?.[1];
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  process.env.MONGODB_URI = uri;
  process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
  process.env.JWT_ACCESS_TTL = '15m';
  process.env.JWT_REFRESH_TTL = '30d';

  const mod = await import('../app');
  app = mod.createApp();

  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
});

describe('auth', () => {
  it('registers a patient, sets refresh cookie, and returns access token', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'p1@example.com',
      password: 'Password123!',
      name: 'Patient One'
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTypeOf('string');
    expect(res.headers['set-cookie']?.[0]).toContain('refreshToken=');
  });

  it('logs in and rotates refresh token on refresh', async () => {
    const reg = await request(app).post('/auth/register').send({
      email: 'p2@example.com',
      password: 'Password123!',
      name: 'Patient Two'
    });

    const cookie = reg.headers['set-cookie']?.[0] as string;
    const refreshToken1 = getCookieValue(cookie, 'refreshToken');
    expect(refreshToken1).toBeTruthy();

    const refresh = await request(app)
      .post('/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken1}`])
      .send();

    expect(refresh.status).toBe(200);
    expect(refresh.body.data.accessToken).toBeTypeOf('string');
    const cookie2 = refresh.headers['set-cookie']?.[0] as string;
    const refreshToken2 = getCookieValue(cookie2, 'refreshToken');
    expect(refreshToken2).toBeTruthy();
    expect(refreshToken2).not.toBe(refreshToken1);
  });
});
