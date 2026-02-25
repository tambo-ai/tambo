import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PostHog } from "posthog-node";
import { getDir } from "./paths.js";
import { loadToken } from "./token-storage.js";

const TELEMETRY_FILE = "telemetry.json";
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

let client: PostHog | undefined;
let anonymousId: string | undefined;
let cliVersion: string | undefined;
let isEnabled = false;

export function isTelemetryDisabled(): boolean {
  const env = process.env.TAMBO_TELEMETRY_DISABLED;
  return env !== undefined && env !== "0";
}

export function initTelemetry(version: string): void {
  if (isTelemetryDisabled()) return;

  cliVersion = version;

  try {
    const dataDir = getDir("data");
    const filePath = join(dataDir, TELEMETRY_FILE);

    let id: string | undefined;
    try {
      const data = JSON.parse(readFileSync(filePath, "utf-8")) as {
        anonymousId?: string;
      };
      id = data.anonymousId;
    } catch {
      // File missing or corrupted — show notice and create it
      showNotice();
    }

    if (!id) {
      id = randomUUID();
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true, mode: 0o700 });
      }
      writeFileSync(filePath, JSON.stringify({ anonymousId: id }, null, 2), {
        encoding: "utf-8",
        mode: 0o600,
      });
    }

    anonymousId = id;

    client = new PostHog(POSTHOG_API_KEY, {
      host: process.env.TAMBO_TELEMETRY_HOST ?? POSTHOG_HOST,
    });

    isEnabled = true;
  } catch {
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
      userId = loadToken()?.user?.id;
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
        isCi: process.env.CI !== undefined && process.env.CI !== "0",
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
  } finally {
    client = undefined;
    isEnabled = false;
  }
}

function showNotice(): void {
  process.stderr.write(
    "\nTambo collects CLI usage data to improve the developer experience.\n" +
      "To opt out, set TAMBO_TELEMETRY_DISABLED=1.\n" +
      "Learn more: https://docs.tambo.co/reference/cli/telemetry" +
      "\n\n",
  );
}
