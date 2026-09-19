const baseUrl = (process.env.PERF_BASE_URL ?? 'http://127.0.0.1:3000').replace(
  /\/$/,
  '',
);
const sampleCount = Number(process.env.PERF_SAMPLES ?? 10);

if (!Number.isSafeInteger(sampleCount) || sampleCount < 1) {
  throw new Error('PERF_SAMPLES must be a positive integer.');
}

const scenarios = [
  ['Employee default page', '/api/employees'],
  ['Employee deep page', '/api/employees?page=100&pageSize=25'],
  ['Employee code search', '/api/employees?search=EMP000500'],
  ['Employee country filter', '/api/employees?country=AE'],
  ['Employee department filter', '/api/employees?department=Engineering'],
  [
    'Employee combined filter',
    '/api/employees?country=AE&department=Engineering',
  ],
  ['Employee last-name sort', '/api/employees?sortBy=lastName&sortOrder=asc'],
  ['Analytics summary', '/api/analytics/summary'],
  ['Analytics departments', '/api/analytics/departments'],
  ['Analytics countries', '/api/analytics/countries'],
  ['Analytics summary by country', '/api/analytics/summary?country=AE'],
  [
    'Analytics summary by department',
    '/api/analytics/summary?department=Engineering',
  ],
  [
    'Analytics summary combined',
    '/api/analytics/summary?country=AE&department=Engineering',
  ],
];

async function request(path) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await response.arrayBuffer();
  const elapsedMs = performance.now() - startedAt;

  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}.`);
  }

  return { elapsedMs, payloadBytes: payload.byteLength };
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[midpoint - 1] + sorted[midpoint]) / 2
    : sorted[midpoint];
}

console.log(
  `Measuring ${baseUrl} with one warm-up and ${sampleCount} sequential samples per endpoint.`,
);

const results = [];

for (const [scenario, path] of scenarios) {
  await request(path);
  const samples = [];
  let payloadBytes = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    const measurement = await request(path);
    samples.push(measurement.elapsedMs);
    payloadBytes = measurement.payloadBytes;
  }

  results.push({
    scenario,
    medianMs: median(samples).toFixed(2),
    minMs: Math.min(...samples).toFixed(2),
    maxMs: Math.max(...samples).toFixed(2),
    payloadBytes,
  });
}

console.table(results);
