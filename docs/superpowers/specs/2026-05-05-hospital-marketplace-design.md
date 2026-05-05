# Hospital Marketplace (Full-Stack) — Design

## Summary
Build a multi-tenant platform where many hospitals are registered on one system. Patients create a single global account, search hospitals and doctors by specialization and hospital name, and schedule appointments. Each hospital has a single hospital admin (staff user) who manages doctors and their availability; doctors do not log in.

Tech choices:
- Frontend: existing Vite + React + TypeScript + Tailwind
- Backend: Node.js + Express
- Database: MongoDB
- Auth: JWT access token + refresh token rotation

## Goals
- Patients can discover providers across hospitals and book appointments against real availability.
- Hospital admins can manage doctor profiles and availability (weekly templates + generated slots + manual overrides).
- Enforce tenant isolation and booking correctness (no double-booking).
- Be resume-ready: tests, CI, docs, clean DX, deployable.

## Non-Goals (v1)
- “Social” features (reviews, follow/feed, messaging).
- Payments, insurance claims, EHR integration.
- Complex scheduling (multi-resource rooms, equipment constraints).

## Personas
- Patient: searches and books appointments across the platform.
- Hospital Admin (one per hospital): manages doctors, availability, and appointments.
- Platform Admin (optional): internal operator to approve/onboard hospitals.

## Core User Journeys
### Patient
1. Sign up / log in.
2. Search: hospital name, doctor name, specialization.
3. Choose hospital → choose doctor → view availability.
4. Book appointment (reason + selected slot).
5. View appointments (upcoming/past), cancel appointment.

### Hospital Admin
1. Log in as hospital admin.
2. Create/edit doctor profiles for their hospital.
3. Configure weekly schedule template and slot duration.
4. Generate slots for a date range; add/block individual slots as overrides.
5. View appointments by doctor/day; cancel/reschedule; mark complete.

## Architecture
Monorepo with separate apps:
- `apps/api`: Express REST API
- `apps/web`: patient-facing web app (existing app refactored to call API)
- `apps/admin`: hospital admin portal (separate frontend)
- `packages/shared`: shared TS types + API client helpers

High-level flow:
- Frontends authenticate → receive access token (short-lived) and refresh token (rotated).
- Frontends call REST API with access token.
- API enforces tenant isolation for hospital admin actions and appointment writes.

## Data Model (MongoDB)
### Collections
- `hospitals`
  - `_id`, `name`, `slug`, `createdAt`, `status`
- `users`
  - `_id`, `email`, `passwordHash`, `name`, `phone`, `role` = `patient|hospital_admin|platform_admin`, `createdAt`
- `hospitalAdmins`
  - `_id`, `hospitalId`, `userId`
  - Constraint: unique `hospitalId` (one admin per hospital)
- `doctors`
  - `_id`, `hospitalId`, `name`, `specialty`, `bio`, `consultationFee`, `rating`, `avatarUrl`, `active`
- `availabilityRules`
  - `_id`, `hospitalId`, `doctorId`, `timezone`, `slotDurationMinutes`
  - `weeklyTemplate`: per day-of-week working windows + breaks
- `availabilitySlots`
  - `_id`, `hospitalId`, `doctorId`, `startAt` (ISO date), `status` = `available|booked|blocked`
  - `source` = `generated|manual|override`
  - Index: unique (`doctorId`, `startAt`) for `status in {available, booked}` to prevent duplicates
- `appointments`
  - `_id`, `hospitalId`, `patientUserId`, `doctorId`, `slotStartAt`, `reason`, `status` = `scheduled|cancelled|completed`, `createdAt`
- `refreshTokens`
  - `_id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt`, `createdAt`

### Search Indexing
- Text index on `hospitals.name`, `doctors.name`, `doctors.specialty`.
- Optional denormalized “search document” for faster search results:
  - `doctorsSearch`: includes `hospitalName`, `hospitalSlug`, `specialty`, `doctorName`.

## API (REST)
All responses use a consistent envelope:
- Success: `{ data: ... }`
- Error: `{ error: { code, message, details? } }`

### Auth
- `POST /auth/register` (patient only)
- `POST /auth/login`
- `POST /auth/refresh` (rotates refresh token)
- `POST /auth/logout` (revokes refresh token)
- `GET /me` (current user profile)

### Public Search / Discovery
- `GET /hospitals?query=&page=&limit=`
- `GET /doctors?query=&specialty=&hospitalId=&page=&limit=`
- `GET /doctors/:doctorId`
- `GET /doctors/:doctorId/availability?from=YYYY-MM-DD&to=YYYY-MM-DD`

### Patient Appointments
- `POST /appointments`
  - Atomically book: transition slot `available -> booked`, then create appointment
- `GET /me/appointments`
- `POST /appointments/:appointmentId/cancel`
  - Transition appointment `scheduled -> cancelled` and slot `booked -> available`

### Hospital Admin
All endpoints require `hospital_admin` role and automatically scope by admin’s hospital.
- `GET /admin/hospital` (hospital profile)
- `GET /admin/doctors`, `POST /admin/doctors`, `PATCH /admin/doctors/:id`
- `PUT /admin/doctors/:id/availability-rules`
- `POST /admin/doctors/:id/slots/generate` (range-based)
- `POST /admin/doctors/:id/slots` (manual add)
- `POST /admin/doctors/:id/slots/block` (manual block)
- `DELETE /admin/slots/:slotId`
- `GET /admin/appointments?doctorId=&from=&to=`
- `POST /admin/appointments/:id/cancel`
- `POST /admin/appointments/:id/complete`

## Booking Correctness (must-have)
- Booking uses a single atomic update:
  - Find slot with `{ doctorId, startAt, status: "available" }` and update to `{ status: "booked" }`.
  - If no slot updated, booking fails with conflict error.
- Cancellation reverts slot only if the appointment was scheduled.
- All appointment and slot writes validate `hospitalId` consistency.

## Frontend Pages
### Patient app (`apps/web`)
- Auth (login/register)
- Search results (hospitals + doctors, filters)
- Doctor detail (hospital info + availability)
- Booking flow (select slot, reason, confirmation)
- My appointments (upcoming/past)

### Admin portal (`apps/admin`)
- Admin login
- Doctors list + create/edit
- Doctor schedule management:
  - weekly template editor
  - generate slots range
  - day view with manual add/block/delete
- Appointments view (by doctor, by day/week)

## Polishing Checklist (resume-grade)
- Replace mock/localStorage flows with API + persistent DB.
- Consistent UI messaging: toasts/inline errors, no browser alerts.
- Add routing (React Router) and shared typed API client.
- Add tests:
  - API: unit tests for booking/cancellation, auth refresh rotation, tenant scoping
  - UI: basic flow tests (search → doctor → book; admin creates slots)
- Add CI:
  - lint + typecheck + test + build for all apps
- Add OpenAPI docs and a seed script:
  - seed creates a few hospitals + doctors + availability so demo works instantly
- Add deploy story:
  - Docker Compose (api + mongo) + static hosting for frontends

## Rollout Plan (suggested)
1. Backend foundation (auth, models, booking invariants).
2. Patient app wired to API (search + book + dashboard).
3. Admin portal (doctor + availability management).
4. Hardening (tests, CI, audit fixes, docs).

