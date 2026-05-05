# Hospital Marketplace Full-Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current single-page mock clinic app into a full-stack, multi-tenant hospital marketplace with real auth, search, availability, and booking.

**Architecture:** Monorepo with three deployable units: Express API (`apps/api`), patient web app (`apps/web`), and hospital admin web app (`apps/admin`). MongoDB persists hospitals, users, doctors, availability slots, appointments, and refresh token sessions. Patients authenticate globally and book across hospitals; hospital admins manage only their hospital’s doctors and schedules.

**Tech Stack:** Node.js + Express + TypeScript, MongoDB, JWT access + refresh tokens, Vite + React + TypeScript + Tailwind, Vitest + Testing Library (web), Vitest + Supertest (api), GitHub Actions CI.

---

## Repo Restructure (target)

### New/Updated structure
- `apps/web/` (move existing Vite app here)
  - `src/` (existing)
  - `vite.config.ts`, `tailwind.config.js`, `tsconfig*.json`, etc.
- `apps/admin/` (new Vite app)
- `apps/api/` (new Express API)
- `packages/shared/` (new shared TS types + small API client helpers)
- Root configs for workspace tooling (npm workspaces)

### Workspaces
- Root `package.json` uses npm workspaces:
  - `workspaces: ["apps/*", "packages/*"]`
- Root scripts:
  - `dev:web`, `dev:admin`, `dev:api`
  - `build:web`, `build:admin`, `build:api`
  - `lint`, `typecheck`, `test` (fan out to workspaces)

---

## Task 1: Convert repo to npm workspaces + move current app to `apps/web`

**Files:**
- Modify: `/workspace/package.json`
- Create: `/workspace/apps/web/` (move existing files)
- Create: `/workspace/apps/web/package.json`
- Create: `/workspace/apps/web/vite.config.ts` (move)
- Create: `/workspace/apps/web/tsconfig*.json` (move)
- Create: `/workspace/apps/web/tailwind.config.js` (move)
- Create: `/workspace/apps/web/postcss.config.js` (move)
- Create: `/workspace/apps/web/index.html` (move)
- Create: `/workspace/apps/web/src/**` (move)
- Modify: `/workspace/.gitignore` (paths if needed)

- [ ] **Step 1: Update root package.json to workspaces**

```json
{
  "name": "hospital-marketplace",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:web": "npm --workspace apps/web run dev",
    "dev:admin": "npm --workspace apps/admin run dev",
    "dev:api": "npm --workspace apps/api run dev",
    "build:web": "npm --workspace apps/web run build",
    "build:admin": "npm --workspace apps/admin run build",
    "build:api": "npm --workspace apps/api run build",
    "lint": "npm --workspaces run lint",
    "typecheck": "npm --workspaces run typecheck",
    "test": "npm --workspaces run test"
  }
}
```

- [ ] **Step 2: Move existing Vite app into apps/web**
  - Move current root Vite files and `src/` into `apps/web/`.
  - Ensure `apps/web/package.json` contains the existing deps/scripts (dev/build/lint/preview).

- [ ] **Step 3: Verify it runs**

Run: `npm install`
Expected: success

Run: `npm run dev:web`
Expected: Vite starts without missing-path errors

- [ ] **Step 4: Commit**

```bash
git add package.json apps/web .gitignore
git commit -m "chore(monorepo): convert to npm workspaces and move web app"
```

---

## Task 2: Add `packages/shared` for types and API error shape

**Files:**
- Create: `/workspace/packages/shared/package.json`
- Create: `/workspace/packages/shared/src/index.ts`
- Create: `/workspace/packages/shared/src/types.ts`
- Create: `/workspace/packages/shared/src/api.ts`

- [ ] **Step 1: Create shared package.json**

```json
{
  "name": "@app/shared",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint .",
    "test": "echo \"no tests\""
  }
}
```

- [ ] **Step 2: Add shared types and API envelope**

```ts
// /workspace/packages/shared/src/types.ts
export type UserRole = 'patient' | 'hospital_admin' | 'platform_admin';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};

export type ApiResponse<T> = { data: T } | { error: ApiError };

export type Hospital = {
  id: string;
  name: string;
  slug: string;
};

export type Doctor = {
  id: string;
  hospitalId: string;
  name: string;
  specialty: string;
  bio: string;
  consultationFee: number;
  rating?: number;
  avatarUrl?: string;
};

export type AvailabilitySlotStatus = 'available' | 'booked' | 'blocked';

export type AvailabilitySlot = {
  id: string;
  doctorId: string;
  hospitalId: string;
  startAt: string;
  status: AvailabilitySlotStatus;
};

export type AppointmentStatus = 'scheduled' | 'cancelled' | 'completed';

export type Appointment = {
  id: string;
  hospitalId: string;
  doctorId: string;
  patientUserId: string;
  slotStartAt: string;
  reason: string;
  status: AppointmentStatus;
  createdAt: string;
};
```

```ts
// /workspace/packages/shared/src/api.ts
import type { ApiResponse } from './types';

export const isApiError = <T,>(r: ApiResponse<T>): r is { error: { code: string; message: string } } =>
  (r as any).error !== undefined;
```

```ts
// /workspace/packages/shared/src/index.ts
export * from './types';
export * from './api';
```

- [ ] **Step 3: Commit**

```bash
git add packages/shared
git commit -m "chore(shared): add shared types and api envelope"
```

---

## Task 3: Create Express API app skeleton (`apps/api`)

**Files:**
- Create: `/workspace/apps/api/package.json`
- Create: `/workspace/apps/api/tsconfig.json`
- Create: `/workspace/apps/api/src/server.ts`
- Create: `/workspace/apps/api/src/app.ts`
- Create: `/workspace/apps/api/src/config.ts`
- Create: `/workspace/apps/api/src/http/errors.ts`
- Create: `/workspace/apps/api/src/http/middleware/requestId.ts`
- Create: `/workspace/apps/api/src/http/middleware/errorHandler.ts`
- Create: `/workspace/apps/api/src/http/middleware/auth.ts`
- Create: `/workspace/apps/api/src/routes/health.ts`
- Create: `/workspace/apps/api/.env.example`

- [ ] **Step 1: Add API dependencies**
  - express, cors, helmet
  - mongodb driver or mongoose (choose one; default: mongoose)
  - zod for validation
  - jsonwebtoken for access tokens
  - bcrypt for password hashing
  - cookie-parser (store refresh token as HttpOnly cookie)
  - dotenv for envs in local dev

- [ ] **Step 2: Implement app bootstrap with error handling**

```ts
// /workspace/apps/api/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { errorHandler } from './http/middleware/errorHandler';
import { requestId } from './http/middleware/requestId';
import { healthRouter } from './routes/health';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestId());

  app.use('/health', healthRouter);

  app.use(errorHandler());
  return app;
};
```

- [ ] **Step 3: Start server**

```ts
// /workspace/apps/api/src/server.ts
import { createApp } from './app';
import { env } from './config';

const app = createApp();
app.listen(env.PORT, () => {
  process.stdout.write(`API listening on :${env.PORT}\n`);
});
```

- [ ] **Step 4: Add a health endpoint**

```ts
// /workspace/apps/api/src/routes/health.ts
import { Router } from 'express';
export const healthRouter = Router();
healthRouter.get('/', (_req, res) => res.json({ data: { ok: true } }));
```

- [ ] **Step 5: Add `typecheck` + `lint` scripts and commit**

```bash
git add apps/api
git commit -m "feat(api): scaffold express api with health endpoint"
```

---

## Task 4: Add MongoDB connection + base models

**Files:**
- Create: `/workspace/apps/api/src/db/client.ts`
- Create: `/workspace/apps/api/src/db/models/Hospital.ts`
- Create: `/workspace/apps/api/src/db/models/User.ts`
- Create: `/workspace/apps/api/src/db/models/HospitalAdmin.ts`
- Create: `/workspace/apps/api/src/db/models/Doctor.ts`
- Create: `/workspace/apps/api/src/db/models/AvailabilityRule.ts`
- Create: `/workspace/apps/api/src/db/models/AvailabilitySlot.ts`
- Create: `/workspace/apps/api/src/db/models/Appointment.ts`
- Create: `/workspace/apps/api/src/db/models/RefreshToken.ts`

- [ ] **Step 1: Define Mongoose schemas with indexes**
  - Ensure unique index: `hospitalAdmins.hospitalId`
  - Ensure unique index: `availabilitySlots.doctorId + startAt`
  - Ensure unique index: `users.email`

- [ ] **Step 2: Add DB connection at startup**
  - Connect in `server.ts` before `listen`
  - Fail fast if DB unavailable

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/db
git commit -m "feat(api): add mongodb models and indexes"
```

---

## Task 5: Auth (global patients + hospital admin login) with refresh token rotation

**Files:**
- Create: `/workspace/apps/api/src/auth/tokens.ts`
- Create: `/workspace/apps/api/src/auth/password.ts`
- Create: `/workspace/apps/api/src/routes/auth.ts`
- Modify: `/workspace/apps/api/src/app.ts`
- Test: `/workspace/apps/api/src/routes/auth.test.ts`

- [ ] **Step 1: Write failing tests for auth flow (supertest + vitest)**

```ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('auth', () => {
  it('registers a patient and returns access token', async () => {
    const app = createApp();
    const res = await request(app).post('/auth/register').send({
      email: 'p1@example.com',
      password: 'Password123!',
      name: 'Patient One'
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTypeOf('string');
  });
});
```

- [ ] **Step 2: Implement hashing + token issuing**
  - Access token: short-lived (e.g., 15m)
  - Refresh token: long-lived (e.g., 30d), stored as HttpOnly cookie
  - Store only refresh token hash in DB
  - Rotation: refresh endpoint revokes previous token and issues new one

- [ ] **Step 3: Add role-based auth middleware**
  - `requireAuth()`: verifies access token
  - `requireRole('hospital_admin')`

- [ ] **Step 4: Run tests**

Run: `npm --workspace apps/api test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth apps/api/src/routes/auth.ts apps/api/src/routes/auth.test.ts apps/api/src/app.ts
git commit -m "feat(api): add jwt auth with refresh token rotation"
```

---

## Task 6: Seed initial hospitals + single admin per hospital

**Files:**
- Create: `/workspace/apps/api/src/seed/seed.ts`
- Create: `/workspace/apps/api/src/seed/runSeed.ts`
- Modify: `/workspace/apps/api/package.json`

- [ ] **Step 1: Implement seed**
  - Create hospitals (e.g., 2)
  - Create one hospital admin per hospital with known credentials for demo
  - Create doctors per hospital and initial availability rules

- [ ] **Step 2: Add `seed` script**

Run: `npm --workspace apps/api run seed`
Expected: exits 0, prints created hospital slugs and admin emails

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/seed apps/api/package.json
git commit -m "feat(api): add seed for hospitals, admins, doctors"
```

---

## Task 7: Search endpoints (hospitals + doctors + specialization filter)

**Files:**
- Create: `/workspace/apps/api/src/routes/hospitals.ts`
- Create: `/workspace/apps/api/src/routes/doctors.ts`
- Modify: `/workspace/apps/api/src/app.ts`
- Test: `/workspace/apps/api/src/routes/search.test.ts`

- [ ] **Step 1: Write failing tests for search filters**
  - query by hospital name
  - query by specialty
  - filter by hospitalId

- [ ] **Step 2: Implement routes**
  - Use indexes and safe query building

- [ ] **Step 3: Run tests and commit**

```bash
git add apps/api/src/routes/hospitals.ts apps/api/src/routes/doctors.ts apps/api/src/routes/search.test.ts apps/api/src/app.ts
git commit -m "feat(api): add hospitals and doctors search endpoints"
```

---

## Task 8: Availability rules + slot generation (admin)

**Files:**
- Create: `/workspace/apps/api/src/availability/generateSlots.ts`
- Create: `/workspace/apps/api/src/routes/adminAvailability.ts`
- Modify: `/workspace/apps/api/src/app.ts`
- Test: `/workspace/apps/api/src/routes/adminAvailability.test.ts`

- [ ] **Step 1: Define rule format and validation**
  - weekly windows per day
  - slot duration
  - timezone field (store, do not attempt complex TZ conversion in v1; generate using hospital timezone)

- [ ] **Step 2: Implement generateSlots(from,to)**
  - Create `available` slots where none exist
  - Do not overwrite `booked` slots

- [ ] **Step 3: Implement manual add/block/delete**
  - Add slot at datetime if not exists
  - Block: create blocked slot or set available->blocked if not booked
  - Delete: only if status != booked

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/availability apps/api/src/routes/adminAvailability.ts apps/api/src/routes/adminAvailability.test.ts apps/api/src/app.ts
git commit -m "feat(api): admin availability rules and slot management"
```

---

## Task 9: Booking + cancellation invariants (patient)

**Files:**
- Create: `/workspace/apps/api/src/routes/appointments.ts`
- Modify: `/workspace/apps/api/src/app.ts`
- Test: `/workspace/apps/api/src/routes/appointments.test.ts`

- [ ] **Step 1: Write failing tests for double-booking**
  - Book same slot twice → second fails with 409
  - Cancel scheduled appointment returns slot to available

- [ ] **Step 2: Implement atomic booking**
  - Slot update: `{ status: "available" } -> { status: "booked" }`
  - Create appointment referencing slot time

- [ ] **Step 3: Implement cancellation rules**
  - Only scheduled can be cancelled
  - Slot revert only if appointment belonged to that slot time

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/appointments.ts apps/api/src/routes/appointments.test.ts apps/api/src/app.ts
git commit -m "feat(api): implement booking with atomic slot locking"
```

---

## Task 10: Admin appointments endpoints (view/cancel/complete)

**Files:**
- Create: `/workspace/apps/api/src/routes/adminAppointments.ts`
- Modify: `/workspace/apps/api/src/app.ts`
- Test: `/workspace/apps/api/src/routes/adminAppointments.test.ts`

- [ ] **Step 1: Add list endpoint with filters (doctorId, date range)**
- [ ] **Step 2: Add cancel/complete actions**
- [ ] **Step 3: Tests and commit**

```bash
git add apps/api/src/routes/adminAppointments.ts apps/api/src/routes/adminAppointments.test.ts apps/api/src/app.ts
git commit -m "feat(api): admin appointment management endpoints"
```

---

## Task 11: Patient app (`apps/web`) migrate from mocks to API

**Files:**
- Modify: `/workspace/apps/web/src/contexts/AuthContext.tsx`
- Modify: `/workspace/apps/web/src/contexts/AppointmentContext.tsx`
- Create: `/workspace/apps/web/src/api/client.ts`
- Create: `/workspace/apps/web/src/api/auth.ts`
- Create: `/workspace/apps/web/src/api/search.ts`
- Create: `/workspace/apps/web/src/api/appointments.ts`
- Modify: `/workspace/apps/web/src/components/**` (replace localStorage usage)

- [ ] **Step 1: Add API client with typed responses**
  - base URL from `import.meta.env.VITE_API_URL`
  - attach access token, handle refresh flow

- [ ] **Step 2: Replace auth mock with real /auth endpoints**
  - remove in-memory mock users
  - store access token in memory (or localStorage) and refresh token via cookie

- [ ] **Step 3: Replace doctors mock with search endpoint**
  - update doctors page to query API and filter by specialty/hospital

- [ ] **Step 4: Replace booking and dashboard data**
  - booking creates appointment via API
  - dashboard fetches `/me/appointments`

- [ ] **Step 5: Remove `alert/confirm` and standardize errors**

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/api apps/web/src/contexts apps/web/src/components
git commit -m "feat(web): integrate api for auth, search, booking, appointments"
```

---

## Task 12: Admin portal (`apps/admin`) for hospital admin

**Files:**
- Create: `/workspace/apps/admin/**`

- [ ] **Step 1: Scaffold Vite React TS app**
  - Add Tailwind
  - Add routing (React Router)

- [ ] **Step 2: Admin login**
  - Use same auth endpoints (role hospital_admin)
  - After login, show hospital context

- [ ] **Step 3: Doctors CRUD**
  - List, create, edit doctors (scoped to hospital)

- [ ] **Step 4: Schedule management**
  - Edit weekly template + slot duration
  - Generate slots range
  - Day view add/block/delete slots

- [ ] **Step 5: Appointments view**
  - Filter by doctor and date range; cancel/complete

- [ ] **Step 6: Commit**

```bash
git add apps/admin
git commit -m "feat(admin): add hospital admin portal for doctors and scheduling"
```

---

## Task 13: Platform-level polish (DX, CI, docs, security)

**Files:**
- Create: `/workspace/README.md`
- Create: `/workspace/.github/workflows/ci.yml`
- Create: `/workspace/docker-compose.yml`
- Create: `/workspace/LICENSE`
- Create: `/workspace/.env.example`
- Create: `/workspace/apps/api/.env.example` (ensure complete)
- Create: `/workspace/apps/web/.env.example`
- Create: `/workspace/apps/admin/.env.example`

- [ ] **Step 1: Add docker-compose for Mongo + API**
  - local developer experience: `docker compose up -d`

- [ ] **Step 2: Add CI**
  - `npm ci`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build:web && npm run build:admin && npm run build:api`

- [ ] **Step 3: Add README**
  - what it is, features, architecture diagram (text), setup steps, seed demo credentials

- [ ] **Step 4: Address `npm audit` highs**
  - upgrade deps, regenerate lock

- [ ] **Step 5: Commit**

```bash
git add README.md .github docker-compose.yml LICENSE .env.example apps/*/.env.example
git commit -m "chore: add docs, ci, compose, env examples"
```

---

## Self-Review Checklist (Spec Coverage)
- Multi-tenant hospitals: implemented via `hospitals` and scoping in admin endpoints.
- One admin per hospital: unique `hospitalAdmins.hospitalId` + seed.
- Patient global account: `users.role=patient` without hospital binding.
- Search by specialization/hospital name: `/hospitals` and `/doctors` endpoints.
- Availability mixed: rules + generated slots + manual overrides (admin).
- Booking correctness: atomic slot update + appointment create; 409 on conflicts.
- Polish: tests, CI, docker compose, README.

