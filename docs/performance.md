# Klinikly Performance Notes

## Read benchmark

Endpoint: `GET /doctors?limit=20`

Tool: `npm run test:load` (native `fetch`, 20 concurrent workers, 10 seconds).

### Local seeded API

Measured on 2026-11-28 against the in-memory seeded API on `127.0.0.1:3102`:

| Metric | Result |
|---|---:|
| Requests | 4,906 |
| Throughput | 486.6 req/s |
| Errors | 0 |
| p50 | 38.4 ms |
| p95 | 58.0 ms |
| p99 | 91.1 ms |
| max | 154.7 ms |

This measures the API, Mongo query, and JSON serialization on loopback. It is the useful application baseline.

### Production smoke (not a controlled lab)

Measured against the Render free-tier API from the local network:

| Metric | Result |
|---|---:|
| Requests | 272 |
| Throughput | 25.2 req/s |
| Errors | 0 |
| p50 | 599.1 ms |
| p95 | 1,799.3 ms |
| p99 | 2,099.0 ms |

This includes internet transit, TLS, and free-tier CPU. Use it only as a smoke comparison; it is not an application-performance claim.

## Reproduce

Local API:

```bash
npx tsx e2e/server.ts
# in another terminal
API_URL=http://localhost:3102 LOAD_CONCURRENCY=20 LOAD_DURATION_MS=10000 npm run test:load
```

Production smoke:

```bash
API_URL=https://klinikly-api.onrender.com LOAD_CONCURRENCY=20 LOAD_DURATION_MS=10000 npm run test:load
```

Warm the Render service first with `GET /health/ready`.

## Limits

- The local benchmark uses `mongodb-memory-server`, not Atlas.
- No cache layer is active for `/doctors`; every request hits Mongo.
- The production number is network-bound and free-tier-bound.
- Add a CDN/cache or a larger instance only when measured traffic justifies it.
