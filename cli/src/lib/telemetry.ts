import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getDir } from "./paths.js";
import { loadToken } from "./token-storage.js";

const TELEMETRY_STATE_FILE = "telemetry.json";
const STALE_FILE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const POSTHOG_API_KEY = "phc_MxSdt6nYWc9GZulDDw1LNTfvIIjGLbN3XW0vsBcvGgY";
const POSTHOG_HOST = "https://console.tambo.co/ingest";

export const EVENTS = {
  COMMAND_COMPLETED: "cli.command.completed",
  COMMAND_ERROR: "cli.command.error",
  COMPONENT_ADDED: "cli.component.added",
  INIT_COMPLETED: "cli.init.completed",
  AUTH_LOGIN: "cli.auth.login",
  AUTH_LOGOUT: "cli.auth.logout",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

interface TelemetryState {
  anonymousId: string;
  noticeShown: boolean;
}

interface QueuedEvent {
  event: EventName;
  properties: Record<string, unknown>;
}

let anonymousId: string | undefined;
let cliVersion: string | undefined;
let isEnabled = false;
const eventQueue: QueuedEvent[] = [];

export function isTelemetryDisabled(): boolean {
  const disabled = process.env.TAMBO_TELEMETRY_DISABLED;
  const dnt = process.env.DO_NOT_TRACK;
  return (
    (disabled !== undefined && disabled !== "0") ||
    (dnt !== undefined && dnt !== "0")
  );
}

export function initTelemetry(version: string): void {
  if (isTelemetryDisabled()) return;

  cliVersion = version;

  try {
    const state = loadOrCreateState();
    anonymousId = state.anonymousId;
    isEnabled = true;

    if (!state.noticeShown) {
      showNotice();
      saveState({ ...state, noticeShown: true });
    }

    // Run stale file cleanup probabilistically to avoid sync I/O on every invocation
    if (Math.random() < 0.05) {
      cleanupStaleEventFiles();
    }
  } catch {
    // Telemetry init failure must never crash the CLI
    isEnabled = false;
  }
}

export function trackEvent(
  event: EventName,
  properties: Record<string, unknown> = {},
): void {
  if (!isEnabled) return;
  eventQueue.push({ event, properties });
}

export function flushDetached(): void {
  if (!isEnabled || eventQueue.length === 0 || !anonymousId) return;

  try {
    const posthogHost = process.env.TAMBO_TELEMETRY_HOST ?? POSTHOG_HOST;
    const posthogApiKey = POSTHOG_API_KEY;

    let userId: string | undefined;
    try {
      const token = loadToken();
      if (token?.user?.id) {
        userId = token.user.id;
      }
    } catch {
      // Auth read failure must never block telemetry
    }

    const distinctId = userId ?? anonymousId;
    const now = new Date().toISOString();
    const eventsToFlush = eventQueue.splice(0, eventQueue.length);

    const batch = eventsToFlush.map((e) => ({
      event: e.event,
      distinct_id: distinctId,
      properties: {
        // Link anonymous → identified user when logged in
        ...(userId ? { $anon_distinct_id: anonymousId } : {}),
        cliVersion,
        nodeVersion: process.version,
        os: process.platform,
        arch: process.arch,
        isCi: isCi(),
        source: "cli",
        ...e.properties,
      },
      timestamp: now,
    }));

    const dataDir = getDir("data");
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    }

    const tempFile = join(dataDir, `_events_${process.pid}_${Date.now()}.json`);
    writeFileSync(
      tempFile,
      JSON.stringify({ posthogHost, posthogApiKey, batch }),
      { encoding: "utf-8", mode: 0o600 },
    );

    const flusherPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "telemetry-flush.js",
    );
    const child = spawn(process.execPath, [flusherPath, tempFile], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
  } catch {
    // Flush failure must never crash the CLI
  }
}

function loadOrCreateState(): TelemetryState {
  const dataDir = getDir("data");
  const filePath = join(dataDir, TELEMETRY_STATE_FILE);

  if (existsSync(filePath)) {
    try {
      const data = JSON.parse(
        readFileSync(filePath, "utf-8"),
      ) as TelemetryState;
      if (data.anonymousId) return data;
    } catch {
      // Corrupted file — regenerate below
    }
  }

  const state: TelemetryState = {
    anonymousId: randomUUID(),
    noticeShown: false,
  };
  saveState(state);
  return state;
}

function saveState(state: TelemetryState): void {
  const dataDir = getDir("data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  }
  writeFileSync(
    join(dataDir, TELEMETRY_STATE_FILE),
    JSON.stringify(state, null, 2),
    { encoding: "utf-8", mode: 0o600 },
  );
}

function showNotice(): void {
  process.stderr.write(
    "\nTambo collects anonymous CLI usage data to improve the developer experience.\n" +
      "To opt out, set TAMBO_TELEMETRY_DISABLED=1.\n" +
      "Learn more: https://docs.tambo.co/reference/cli/telemetry" +
      "\n\n",
  );
}

function isCi(): boolean {
  const ci = process.env.CI;
  return ci !== undefined && ci !== "0";
}

function cleanupStaleEventFiles(): void {
  try {
    const dataDir = getDir("data");
    if (!existsSync(dataDir)) return;

    const now = Date.now();
    for (const file of readdirSync(dataDir)) {
      if (!file.startsWith("_events_") || !file.endsWith(".json")) continue;
      const filePath = join(dataDir, file);
      const age = now - statSync(filePath).mtimeMs;
      if (age > STALE_FILE_MAX_AGE_MS) {
        unlinkSync(filePath);
      }
    }
  } catch {
    // Cleanup failure is non-critical
  }
}
