const baseUrl = process.env.API_URL || 'http://localhost:3001';
const path = process.env.LOAD_PATH || '/doctors?limit=20';
const concurrency = Number(process.env.LOAD_CONCURRENCY || 20);
const durationMs = Number(process.env.LOAD_DURATION_MS || 10_000);

const url = `${baseUrl.replace(/\/$/, '')}${path}`;
const latencies = [];
const statuses = new Map();
let errors = 0;
let stop = false;

async function worker() {
  while (!stop) {
    const started = performance.now();
    try {
      const response = await fetch(url, { headers: { accept: 'application/json' } });
      await response.arrayBuffer();
      latencies.push(performance.now() - started);
      statuses.set(response.status, (statuses.get(response.status) || 0) + 1);
    } catch {
      errors += 1;
    }
  }
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Math.round(sorted[index] * 10) / 10;
}

let timer;

async function main() {
  await fetch(`${baseUrl.replace(/\/$/, '')}/health/ready`);
  stop = false;
  const startedAt = Date.now();
  timer = setTimeout(() => {
    stop = true;
  }, durationMs);
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  stop = true;
  await new Promise((resolve) => setTimeout(resolve, 50));

  const elapsedSeconds = (Date.now() - startedAt) / 1000;
  const result = {
    url,
    concurrency,
    durationSeconds: Math.round(elapsedSeconds * 10) / 10,
    requests: latencies.length + errors,
    requestsPerSecond: Math.round(((latencies.length + errors) / elapsedSeconds) * 10) / 10,
    errors,
    statuses: Object.fromEntries([...statuses.entries()].sort((a, b) => a[0] - b[0])),
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      max: latencies.length ? Math.round(Math.max(...latencies) * 10) / 10 : null
    }
  };

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    if (timer) clearTimeout(timer);
    stop = true;
  });
