# Klinikly Runbook

## Local setup

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
npm ci
npm run build:shared
npm run seed
```

Windows PowerShell is supported. Use `Copy-Item` if `cp` is unavailable.

## Run

```bash
npm run dev:api    # http://localhost:3001
npm run dev:web    # http://localhost:5173
npm run dev:admin  # http://localhost:5174
```

## Verify

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The API tests use `mongodb-memory-server`; no local MongoDB is required.

## Health and readiness

- `GET /health` — process is up.
- `GET /health/ready` — MongoDB is connected and responding; returns 503 otherwise.
- Every response includes `x-request-id`.

## Seed data

`npm run seed` creates two hospitals, four doctors, two hospital administrators, one demo patient, weekly availability rules, and 30 days of slots. It is idempotent by slug/email.

## Deployment

- API: Render web service from `apps/api`.
- Patient app: Vercel project `klinikly`.
- Admin app: Vercel project `klinikly-admin`.
- Database: MongoDB Atlas.

Required API environment:

```text
NODE_ENV=production
PORT=3001
MONGODB_URI=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGIN=https://klinikly.furqankhan.dev,https://klinikly-admin.furqankhan.dev
```

## Rollback

1. In Vercel, promote the previous deployment.
2. In Render, roll back to the previous live deploy.
3. Database changes in this app are additive; no destructive migration is required for a rollback.
4. Re-run `GET /health/ready` and one booking smoke test.

## Smoke tests after deploy

```bash
curl https://klinikly-api.onrender.com/health
curl https://klinikly-api.onrender.com/health/ready
```

Then open the patient app, sign in with the demo account, book one future slot, and confirm it appears in the dashboard.

## Known limits

- Render free tier cold starts can take 30–60 seconds.
- No background email/SMS worker yet; audit is the operational record.
- No real payment or insurance integration.
- Audit writes are best-effort and logged on failure rather than blocking a confirmed booking.
