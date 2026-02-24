#!/usr/bin/env node
/**
 * Detached flush process — spawned by telemetry.ts to send events
 * without blocking the main CLI process.
 *
 * Reads a temp JSON file, POSTs to PostHog's /batch endpoint
 * via the web app proxy, then deletes the file.
 * Exits silently on any error.
 */
import { readFileSync, unlinkSync } from "node:fs";

interface FlushFile {
  posthogHost: string;
  posthogApiKey: string;
  batch: Record<string, unknown>[];
}

const tempFile = process.argv[2];
if (!tempFile) process.exit(1);

try {
  const { posthogHost, posthogApiKey, batch } = JSON.parse(
    readFileSync(tempFile, "utf-8"),
  ) as FlushFile;

  await fetch(`${posthogHost}/batch`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: posthogApiKey, batch }),
    signal: AbortSignal.timeout(5000),
  });
} catch {
  // Network error, timeout, or anything else — silently ignore
} finally {
  try {
    unlinkSync(tempFile);
  } catch {
    // File already deleted or permission issue — ignore
  }
}
