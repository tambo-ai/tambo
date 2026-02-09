/**
 * PG Pool Load Test Script
 *
 * Simulates concurrent API traffic to reproduce connection pool exhaustion.
 * Targets endpoints that hit the database, ramping up concurrency to push
 * past the pool's max connections (default 75).
 *
 * Usage:
 *   node --experimental-strip-types scripts/load-test-pg-pool.ts --api-key <key> [options]
 *
 * Examples:
 *   # Burst 100 thread-creation requests against local API
 *   node --experimental-strip-types scripts/load-test-pg-pool.ts --api-key tambo_xxx --scenario burst --concurrency 100
 *
 *   # Sustained load at 50 req/s for 30 seconds against staging
 *   node --experimental-strip-types scripts/load-test-pg-pool.ts --api-key tambo_xxx --base-url https://staging-api.tambo.co --scenario sustained --rps 50 --duration 30
 *
 *   # Mixed read/write workload
 *   node --experimental-strip-types scripts/load-test-pg-pool.ts --api-key tambo_xxx --scenario mixed --concurrency 80
 *
 *   # Only hit health endpoint (no auth needed) to test raw pool pressure
 *   node --experimental-strip-types scripts/load-test-pg-pool.ts --scenario health --concurrency 120
 */

import { parseArgs } from "node:util";

// ─── CLI Args ────────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    "api-key": { type: "string" },
    "base-url": { type: "string", default: "http://localhost:8261" },
    scenario: {
      type: "string",
      default: "burst",
    },
    concurrency: { type: "string", default: "100" },
    rps: { type: "string", default: "50" },
    duration: { type: "string", default: "15" },
    "context-key": { type: "string", default: "load-test-user" },
    help: { type: "boolean", default: false },
  },
  strict: true,
});

if (args.help) {
  console.log(`
PG Pool Load Test

Options:
  --api-key        Tambo API key (required for all scenarios except 'health')
  --base-url       API base URL (default: http://localhost:8261)
  --scenario       Test scenario: burst | sustained | mixed | health (default: burst)
  --concurrency    Number of concurrent requests for burst/mixed (default: 100)
  --rps            Requests per second for sustained scenario (default: 50)
  --duration       Duration in seconds for sustained scenario (default: 15)
  --context-key    Context key for thread operations (default: load-test-user)
  --help           Show this help message

Scenarios:
  burst       Fire N concurrent requests simultaneously (thread creates + reads)
  sustained   Maintain steady request rate over a time window
  mixed       Interleave creates, reads, message adds, and list queries
  health      Hammer the /health endpoint (no auth, still hits DB with SELECT 1)
`);
  process.exit(0);
}

const BASE_URL = args["base-url"]!;
const API_KEY = args["api-key"];
const CONCURRENCY = parseInt(args.concurrency!, 10);
const RPS = parseInt(args.rps!, 10);
const DURATION_SEC = parseInt(args.duration!, 10);
const CONTEXT_KEY = args["context-key"]!;
const SCENARIO = args.scenario!;

if (SCENARIO !== "health" && !API_KEY) {
  console.error(
    "Error: --api-key is required for all scenarios except 'health'",
  );
  process.exit(1);
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface RequestResult {
  endpoint: string;
  status: number;
  durationMs: number;
  error?: string;
}

interface RunSummary {
  total: number;
  succeeded: number;
  failed: number;
  timeouts: number;
  connectionRefused: number;
  avgDurationMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  minMs: number;
  elapsedMs: number;
  statusCodes: Record<number, number>;
  errorSamples: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function c(text: string, code: string): string {
  return `${code}${text}${COLORS.reset}`;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) {
    h["X-API-Key"] = API_KEY;
  }
  return h;
}

async function timedFetch(
  endpoint: string,
  init: RequestInit,
): Promise<RequestResult> {
  const url = `${BASE_URL}${endpoint}`;
  const start = performance.now();
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(30_000),
    });
    const durationMs = performance.now() - start;

    // Consume body to free the connection
    const body = await res.text();

    const result: RequestResult = {
      endpoint,
      status: res.status,
      durationMs,
    };

    if (res.status >= 400) {
      // Truncate long error bodies
      result.error = body.length > 200 ? `${body.slice(0, 200)}...` : body;
    }

    return result;
  } catch (err: unknown) {
    const durationMs = performance.now() - start;
    const message = err instanceof Error ? err.message : String(err);

    let status = 0;
    if (message.includes("ECONNREFUSED")) {
      status = -1;
    } else if (
      message.includes("timeout") ||
      message.includes("AbortError")
    ) {
      status = -2;
    }

    return {
      endpoint,
      status,
      durationMs,
      error: message,
    };
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

function summarize(results: RequestResult[], elapsedMs: number): RunSummary {
  const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const statusCodes: Record<number, number> = {};
  let succeeded = 0;
  let failed = 0;
  let timeouts = 0;
  let connectionRefused = 0;
  const errorSamples: string[] = [];

  for (const r of results) {
    statusCodes[r.status] = (statusCodes[r.status] ?? 0) + 1;
    if (r.status >= 200 && r.status < 400) {
      succeeded++;
    } else {
      failed++;
      if (r.status === -1) connectionRefused++;
      if (r.status === -2) timeouts++;
      if (r.error && errorSamples.length < 5) {
        errorSamples.push(`[${r.status}] ${r.endpoint}: ${r.error}`);
      }
    }
  }

  return {
    total: results.length,
    succeeded,
    failed,
    timeouts,
    connectionRefused,
    avgDurationMs: durations.reduce((a, b) => a + b, 0) / durations.length,
    p50Ms: percentile(durations, 50),
    p95Ms: percentile(durations, 95),
    p99Ms: percentile(durations, 99),
    maxMs: durations[durations.length - 1] ?? 0,
    minMs: durations[0] ?? 0,
    elapsedMs,
    statusCodes,
    errorSamples,
  };
}

function printSummary(label: string, summary: RunSummary) {
  console.log(`\n${c(`═══ ${label} ═══`, COLORS.bold + COLORS.cyan)}`);
  console.log(`  Total requests:   ${summary.total}`);
  console.log(
    `  Succeeded:        ${c(String(summary.succeeded), COLORS.green)}`,
  );
  console.log(`  Failed:           ${c(String(summary.failed), COLORS.red)}`);
  if (summary.timeouts > 0) {
    console.log(
      `  Timeouts:         ${c(String(summary.timeouts), COLORS.yellow)}`,
    );
  }
  if (summary.connectionRefused > 0) {
    console.log(
      `  Conn refused:     ${c(String(summary.connectionRefused), COLORS.red)}`,
    );
  }
  console.log(
    `  Wall time:        ${(summary.elapsedMs / 1000).toFixed(2)}s`,
  );
  console.log(
    `  Throughput:       ${(summary.total / (summary.elapsedMs / 1000)).toFixed(1)} req/s`,
  );
  console.log(`\n  Latency (ms):`);
  console.log(`    min:            ${summary.minMs.toFixed(1)}`);
  console.log(`    avg:            ${summary.avgDurationMs.toFixed(1)}`);
  console.log(`    p50:            ${summary.p50Ms.toFixed(1)}`);
  console.log(`    p95:            ${c(summary.p95Ms.toFixed(1), COLORS.yellow)}`);
  console.log(`    p99:            ${c(summary.p99Ms.toFixed(1), COLORS.red)}`);
  console.log(`    max:            ${c(summary.maxMs.toFixed(1), COLORS.red)}`);
  console.log(`\n  Status codes:`);
  for (const [code, count] of Object.entries(summary.statusCodes).sort()) {
    const label =
      Number(code) === -1
        ? "CONNREFUSED"
        : Number(code) === -2
          ? "TIMEOUT"
          : code;
    console.log(`    ${label}: ${count}`);
  }
  if (summary.errorSamples.length > 0) {
    console.log(`\n  ${c("Error samples:", COLORS.red)}`);
    for (const sample of summary.errorSamples) {
      console.log(`    ${c(sample, COLORS.dim)}`);
    }
  }
}

// ─── Request Factories ───────────────────────────────────────────────────────

function makeCreateThread(): () => Promise<RequestResult> {
  return () =>
    timedFetch("/threads", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        contextKey: CONTEXT_KEY,
      }),
    });
}

function makeListThreads(
  projectId: string,
): () => Promise<RequestResult> {
  return () =>
    timedFetch(`/threads/project/${projectId}?contextKey=${CONTEXT_KEY}`, {
      method: "GET",
      headers: headers(),
    });
}

function makeGetThread(threadId: string): () => Promise<RequestResult> {
  return () =>
    timedFetch(`/threads/${threadId}?contextKey=${CONTEXT_KEY}`, {
      method: "GET",
      headers: headers(),
    });
}

function makeAddMessage(threadId: string): () => Promise<RequestResult> {
  return () =>
    timedFetch(`/threads/${threadId}/messages`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        role: "user",
        content: `Load test message at ${Date.now()}`,
      }),
    });
}

function makeHealthCheck(): () => Promise<RequestResult> {
  return () => timedFetch("/health", { method: "GET" });
}

// ─── Scenarios ───────────────────────────────────────────────────────────────

/**
 * Fires all requests concurrently with zero stagger.
 * Best for reproducing pool exhaustion from sudden traffic spikes.
 */
async function scenarioBurst() {
  console.log(
    c(
      `\nBurst scenario: ${CONCURRENCY} concurrent requests\n`,
      COLORS.bold,
    ),
  );

  // Phase 1: Create threads to get IDs for subsequent reads
  const setupCount = Math.min(10, CONCURRENCY);
  console.log(c(`Phase 1: Creating ${setupCount} setup threads...`, COLORS.dim));
  const setupResults: RequestResult[] = [];
  const threadIds: string[] = [];

  for (let i = 0; i < setupCount; i++) {
    const result = await timedFetch("/threads", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ contextKey: CONTEXT_KEY }),
    });
    setupResults.push(result);
    if (result.status === 201 || result.status === 200) {
      try {
        // Re-fetch to get the ID (body was consumed in timedFetch)
        const res = await fetch(`${BASE_URL}/threads`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ contextKey: CONTEXT_KEY }),
        });
        if (res.ok) {
          const body = await res.json();
          if (body.id) threadIds.push(body.id);
        }
      } catch {
        // ignore setup errors
      }
    }
  }

  if (threadIds.length === 0) {
    console.log(
      c(
        "Warning: Could not create any setup threads. Burst will only use thread-create requests.",
        COLORS.yellow,
      ),
    );
  } else {
    console.log(
      c(`  Created ${threadIds.length} threads for read targets`, COLORS.dim),
    );
  }

  // Phase 2: Build a mix of request factories
  const factories: Array<() => Promise<RequestResult>> = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    const mod = i % 3;
    if (mod === 0) {
      // Thread creation — always works
      factories.push(makeCreateThread());
    } else if (mod === 1 && threadIds.length > 0) {
      // Read a random thread
      const tid = threadIds[i % threadIds.length]!;
      factories.push(makeGetThread(tid));
    } else if (mod === 2 && threadIds.length > 0) {
      // Add a message
      const tid = threadIds[i % threadIds.length]!;
      factories.push(makeAddMessage(tid));
    } else {
      factories.push(makeCreateThread());
    }
  }

  // Phase 3: Fire all at once
  console.log(c(`\nPhase 2: Firing ${factories.length} requests...`, COLORS.bold));
  const burstStart = performance.now();
  const results = await Promise.all(factories.map((fn) => fn()));
  const burstElapsed = performance.now() - burstStart;

  printSummary("Burst Results", summarize(results, burstElapsed));
}

/**
 * Maintains a steady request rate (RPS) for a given duration.
 * Best for reproducing gradual pool starvation under sustained load.
 */
async function scenarioSustained() {
  console.log(
    c(
      `\nSustained scenario: ${RPS} req/s for ${DURATION_SEC}s\n`,
      COLORS.bold,
    ),
  );

  const totalRequests = RPS * DURATION_SEC;
  const intervalMs = 1000 / RPS;

  // Setup: create a few threads for mixed requests
  console.log(c("Setting up target threads...", COLORS.dim));
  const threadIds: string[] = [];
  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${BASE_URL}/threads`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ contextKey: CONTEXT_KEY }),
    });
    if (res.ok) {
      const body = await res.json();
      if (body.id) threadIds.push(body.id);
    }
  }

  const results: RequestResult[] = [];
  let launched = 0;

  const sustainedStart = performance.now();

  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (launched >= totalRequests) {
        clearInterval(interval);
        return;
      }

      // Launch one request per tick
      const idx = launched++;
      let factory: () => Promise<RequestResult>;

      if (idx % 4 === 0) {
        factory = makeCreateThread();
      } else if (idx % 4 === 1 && threadIds.length > 0) {
        factory = makeGetThread(threadIds[idx % threadIds.length]!);
      } else if (idx % 4 === 2 && threadIds.length > 0) {
        factory = makeAddMessage(threadIds[idx % threadIds.length]!);
      } else {
        factory = makeHealthCheck();
      }

      factory().then((result) => {
        results.push(result);

        // Progress indicator every 50 results
        if (results.length % 50 === 0) {
          const elapsed = ((performance.now() - sustainedStart) / 1000).toFixed(
            1,
          );
          process.stdout.write(
            c(
              `  [${elapsed}s] ${results.length}/${totalRequests} completed\r`,
              COLORS.dim,
            ),
          );
        }

        if (results.length >= totalRequests) {
          resolve();
        }
      });
    }, intervalMs);
  });

  const sustainedElapsed = performance.now() - sustainedStart;
  console.log(""); // clear the progress line
  printSummary("Sustained Results", summarize(results, sustainedElapsed));
}

/**
 * Interleaves different request types at high concurrency.
 * Each "wave" fires a batch of mixed requests, waits for completion, repeats.
 */
async function scenarioMixed() {
  const waves = 5;
  const perWave = Math.ceil(CONCURRENCY / waves);

  console.log(
    c(
      `\nMixed scenario: ${waves} waves of ${perWave} requests (${waves * perWave} total)\n`,
      COLORS.bold,
    ),
  );

  // Setup
  console.log(c("Setting up target threads...", COLORS.dim));
  const threadIds: string[] = [];
  for (let i = 0; i < 8; i++) {
    const res = await fetch(`${BASE_URL}/threads`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ contextKey: CONTEXT_KEY }),
    });
    if (res.ok) {
      const body = await res.json();
      if (body.id) threadIds.push(body.id);
    }
  }

  const allResults: RequestResult[] = [];
  const mixedStart = performance.now();

  for (let wave = 0; wave < waves; wave++) {
    console.log(c(`  Wave ${wave + 1}/${waves}...`, COLORS.dim));

    const factories: Array<() => Promise<RequestResult>> = [];
    for (let i = 0; i < perWave; i++) {
      const op = i % 5;
      if (op === 0) {
        factories.push(makeCreateThread());
      } else if (op === 1 && threadIds.length > 0) {
        factories.push(makeGetThread(threadIds[i % threadIds.length]!));
      } else if (op === 2 && threadIds.length > 0) {
        factories.push(makeAddMessage(threadIds[i % threadIds.length]!));
      } else if (op === 3) {
        factories.push(makeHealthCheck());
      } else {
        factories.push(makeCreateThread());
      }
    }

    const waveResults = await Promise.all(factories.map((fn) => fn()));
    allResults.push(...waveResults);

    // Collect any new thread IDs from creates
    for (const r of waveResults) {
      if (
        r.endpoint === "/threads" &&
        r.status >= 200 &&
        r.status < 300
      ) {
        // We don't have the body from timedFetch, but the thread exists
        // server-side now. We rely on setup threads for reads.
      }
    }
  }

  const mixedElapsed = performance.now() - mixedStart;
  printSummary("Mixed Results", summarize(allResults, mixedElapsed));
}

/**
 * Hammer the /health endpoint with no auth.
 * /health runs SELECT 1 on the DB, so it still acquires pool connections.
 * Useful to isolate pool pressure from auth/business-logic overhead.
 */
async function scenarioHealth() {
  console.log(
    c(
      `\nHealth scenario: ${CONCURRENCY} concurrent /health requests\n`,
      COLORS.bold,
    ),
  );

  const factories = Array.from({ length: CONCURRENCY }, () =>
    makeHealthCheck(),
  );

  const start = performance.now();
  const results = await Promise.all(factories.map((fn) => fn()));
  const elapsed = performance.now() - start;

  printSummary("Health Endpoint Results", summarize(results, elapsed));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(c("╔══════════════════════════════════════╗", COLORS.magenta));
  console.log(c("║   Tambo PG Pool Load Tester          ║", COLORS.magenta));
  console.log(c("╚══════════════════════════════════════╝", COLORS.magenta));
  console.log(`  Target:       ${c(BASE_URL, COLORS.cyan)}`);
  console.log(`  Scenario:     ${c(SCENARIO, COLORS.yellow)}`);
  console.log(`  Concurrency:  ${CONCURRENCY}`);
  if (SCENARIO === "sustained") {
    console.log(`  RPS:          ${RPS}`);
    console.log(`  Duration:     ${DURATION_SEC}s`);
  }
  console.log(`  Auth:         ${API_KEY ? c("API key provided", COLORS.green) : c("none", COLORS.dim)}`);

  // Quick connectivity check
  try {
    const probe = await fetch(`${BASE_URL}/`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!probe.ok) {
      console.log(
        c(
          `\nWarning: Base URL returned status ${probe.status}. Proceeding anyway.`,
          COLORS.yellow,
        ),
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      c(`\nError: Cannot reach ${BASE_URL} — ${msg}`, COLORS.red),
    );
    console.error("Make sure the API is running (npm run dev:cloud).");
    process.exit(1);
  }

  switch (SCENARIO) {
    case "burst":
      await scenarioBurst();
      break;
    case "sustained":
      await scenarioSustained();
      break;
    case "mixed":
      await scenarioMixed();
      break;
    case "health":
      await scenarioHealth();
      break;
    default:
      console.error(`Unknown scenario: ${SCENARIO}`);
      console.error("Valid scenarios: burst, sustained, mixed, health");
      process.exit(1);
  }

  console.log(c("\nDone.", COLORS.bold));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
