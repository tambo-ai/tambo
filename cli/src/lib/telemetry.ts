import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PostHog } from "posthog-node";
import { getDir } from "./paths.js";
import { loadToken } from "./token-storage.js";

const TELEMETRY_STATE_FILE = "telemetry.json";

const POSTHOG_API_KEY = "phc_MxSdt6nYWc9GZulDDw1LNTfvIIjGLbN3XW0vsBcvGgY";
const POSTHOG_HOST = "https://us.i.posthog.com";

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

let client: PostHog | undefined;
let anonymousId: string | undefined;
let cliVersion: string | undefined;
let isEnabled = false;

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

    client = new PostHog(POSTHOG_API_KEY, {
      host: process.env.TAMBO_TELEMETRY_HOST ?? POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });

    isEnabled = true;

    if (!state.noticeShown) {
      showNotice();
      saveState({ ...state, noticeShown: true });
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
  if (!isEnabled || !client || !anonymousId) return;

  try {
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

    client.capture({
      event,
      distinctId,
      properties: {
        ...(userId ? { $anon_distinct_id: anonymousId } : {}),
        cliVersion,
        nodeVersion: process.version,
        os: process.platform,
        arch: process.arch,
        isCi: isCi(),
        source: "cli",
        ...properties,
      },
    });
  } catch {
    // Capture failure must never crash the CLI
  }
}

export async function shutdownTelemetry(): Promise<void> {
  if (!client) return;

  try {
    await client.shutdown();
  } catch {
    // Shutdown failure must never crash the CLI
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
