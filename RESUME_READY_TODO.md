# Klinikly — Resume-Ready TODO

> Branch: `trae/solo-agent-B7wnna`
> Last updated: May 2026

---

## ✅ All Completed

### Core Features
- [x] **`apps/admin` portal** — Login, Dashboard, Doctors CRUD, Availability editor (weekly template + slot generation + day view), Appointments view with cancel/complete
- [x] **React Router v6** in `apps/web` — real URL paths (`/`, `/auth`, `/doctors`, `/doctors/:id`, `/booking/:doctorId`, `/dashboard`)
- [x] **Doctor detail page** (`/doctors/:id`) — profile, bio, hospital info, 14-day availability calendar with slot picker
- [x] **Pagination** in `DoctorsPage` — server-side, 12 per page, smart page number display
- [x] **Loading skeletons** — DoctorsPage grid, DoctorDetailPage, DashboardPage appointment cards
- [x] **`GET /hospitals/:id`** route added to API
- [x] **Missing admin API routes** — `GET /admin/hospital`, `GET /admin/doctors`, `POST /admin/doctors`, `PATCH /admin/doctors/:id`
- [x] **`GET /me`** endpoint added

### Bug Fixes
- [x] **Fix demo credentials** in `AuthPage` — correct seeded admin email shown
- [x] **Fix `secure: false`** on refresh cookie — `process.env.NODE_ENV === 'production'`
- [x] **Fix timezone bug** in `BookingPage` — slots parsed as UTC ISO strings, displayed in local timezone
- [x] **Fix double-filtering** on `DoctorsPage` — API is source of truth, debounced search (300ms)
- [x] **Fix `AppointmentCard` null render** — loading skeleton + error state
- [x] **Remove non-functional Video Call button** from `DoctorsPage`

### Security & Hardening
- [x] **Rate limiting** on `/auth/login` and `/auth/register` (20 req/15min)
- [x] **`npm audit fix`** — vulnerabilities reduced from 15 high to 2 moderate (remaining are in devDeps only)
- [x] **TypeScript** — zero errors across all 4 workspaces

### UX Polish
- [x] **Toast notifications** via `sonner` — booking success/fail, cancel, login/register errors
- [x] **Error Boundary** component
- [x] **Debounced search** (300ms)
- [x] **`DELETE` method** in admin `apiClient`

### DevOps & Documentation
- [x] **Root `README.md`** — full setup guide, architecture, demo credentials, API reference
- [x] **`docker-compose.yml`** for MongoDB
- [x] **GitHub Actions CI** — lint, typecheck, test, build on push/PR
- [x] **`.env.example`** for `apps/web` and `apps/admin`
- [x] **`typecheck` script** added to `apps/admin` package.json
- [x] **`dev:admin` and `seed` scripts** added to root `package.json`
- [x] **Admin portal on port 5174** — no collision with web on 5173
- [x] **Seed generates 30 days of availability slots** — booking page works immediately after seed

---

## 🟡 Optional Enhancements (Post-Resume)

- [ ] **Email notifications** — booking confirmation, cancellation (would need an email provider like Resend/SendGrid)
- [ ] **Platform admin role** — `platform_admin` exists in the enum but has no routes or UI (hospital onboarding flow)
- [ ] **Doctor reviews/ratings** — currently ratings are seeded manually, no patient review flow
- [ ] **Appointment rescheduling** — currently only cancel; no reschedule flow
- [ ] **Search by hospital** — hospital filter exists in API but no hospital search UI in web app

---

## Quick Start

```bash
npm install
docker compose up -d
npm run seed
# Terminal 1 — API (port 3001)
npm run dev:api
# Terminal 2 — Patient web (port 5173)
npm run dev:web
# Terminal 3 — Admin portal (port 5174)
npm run dev:admin
```

**Demo credentials:**
- Patient: register a new account at http://localhost:5173/auth
- Admin: `admin@city-care-hospital.example.com` / `Admin123!` at http://localhost:5174
