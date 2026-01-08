/**
 * Debug SSE stream from stdin.
 *
 * - Reads Server-Sent Events where each event contains one or more `data:` lines with JSON
 * - For each completed message (terminated by a blank line), prints:
 *   - A colored unified diff vs the previous message (skipped for the first)
 *   - The current message as pretty-printed JSON with deterministically sorted object keys
 *
 * This is best used as output from curl:
 * 1) Use "Copy as cURL" in chrome dev tools
 * 2) Paste into your terminal and run `| npm run debug-stream`, e.g.
 *    ```
 *    curl https://api.tambo.co/threads/advancestream .... | npm run debug-stream
 *    ```
 *
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline";

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

// ANSI color helpers (avoid extra deps)
const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function color(text: string, code: string): string {
  return `${code}${text}${COLORS.reset}`;
}

function colorizeDiff(diffText: string): string {
  return diffText
    .split("\n")
    .map((line) => {
      if (line.startsWith("+++ ") || line.startsWith("--- ")) {
        return color(line, COLORS.gray);
      }
      if (line.startsWith("@@")) {
        return color(line, COLORS.cyan);
      }
      if (line.startsWith("+")) {
        return color(line, COLORS.green);
      }
      if (line.startsWith("-")) {
        return color(line, COLORS.red);
      }
      return line;
    })
    .join("\n");
}

// Deeply sort object keys to achieve deterministic JSON output
function sortJson(value: unknown): JsonValue {
  if (value === null) return null;
  if (Array.isArray(value)) {
    return (value as unknown[]).map((v) => sortJson(v)) as JsonArray;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
    const result: JsonObject = {};
    for (const key of sortedKeys) {
      result[key] = sortJson(obj[key]);
    }
    return result;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value as JsonValue;
  }
  // Fallback for unsupported types (e.g., undefined, functions) -> null
  return null;
}

function stringifySortedJson(value: unknown): string {
  const sorted = sortJson(value);
  return JSON.stringify(sorted, null, 2);
}

let previousJsonString: string | null = null;
let messageCount = 0;

// SSE accumulation: gather `data:` lines until a blank line terminates the event
let currentDataLines: string[] = [];

function handleEventIfComplete(): void {
  if (currentDataLines.length === 0) return;
  const rawData = currentDataLines.join("\n");
  currentDataLines = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawData);
  } catch (_err) {
    output.write(
      `${color("[warn] Failed to parse JSON from data: line(s). Skipping this event.", COLORS.yellow)}\n`,
    );
    output.write(`${color("Raw payload:", COLORS.dim)}\n${rawData}\n\n`);
    return;
  }

  const currentJsonString = stringifySortedJson(parsed);
  messageCount += 1;

  if (previousJsonString !== null) {
    const diff = unifiedDiff(previousJsonString, currentJsonString);
    if (diff) {
      const header = [
        color(
          "\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          COLORS.magenta,
        ),
        color(
          `┃  ${color("Diff", COLORS.cyan)} ${color("vs previous", COLORS.yellow)} ${color(`(message ${messageCount - 1} -> ${messageCount})`, COLORS.blue)}`,
          COLORS.bold,
        ),
        color(
          "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          COLORS.magenta,
        ),
      ].join("\n");
      output.write(`${header}\n`);
      output.write(`${colorizeDiff(diff)}\n`);
    } else {
      output.write(
        `${color("\nNo differences from previous message.", COLORS.dim)}\n`,
      );
    }
  }

  output.write(`${color(`\nMessage ${messageCount}:`, COLORS.bold)}\n`);
  output.write(`${currentJsonString}\n`);

  previousJsonString = currentJsonString;
}

function unifiedDiff(prevText: string, currText: string): string {
  // Write temp files for system `diff`
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "debug-stream-"));
  const prevPath = path.join(tmpDir, "prev.json");
  const currPath = path.join(tmpDir, "curr.json");
  fs.writeFileSync(prevPath, prevText, "utf8");
  fs.writeFileSync(currPath, currText, "utf8");

  const proc = spawnSync(
    "diff",
    ["-u", "--label", "previous", prevPath, "--label", "current", currPath],
    {
      encoding: "utf8",
    },
  );

  // Clean up temp files (best-effort)
  try {
    fs.unlinkSync(prevPath);
    fs.unlinkSync(currPath);
    fs.rmdirSync(tmpDir);
  } catch {
    // ignore
  }

  // `diff` exitCode: 0 = no diff, 1 = differences, >1 = error
  if (proc.status === 0) return "";
  if (proc.status && proc.status > 1) {
    return color(`(diff failed with status ${proc.status})`, COLORS.red);
  }
  return proc.stdout || proc.stderr || "";
}

const rl = readline.createInterface({ input, crlfDelay: Infinity });

output.write(
  color("[debug-stream] Waiting for SSE on stdin...", COLORS.dim) + "\n",
);

rl.on("line", (line: string) => {
  // Trim trailing carriage returns
  const raw = line.replace(/\r$/, "");
  if (raw === "") {
    // Blank line terminates the event
    handleEventIfComplete();
    return;
  }

  // SSE fields can include id:, event:, retry:, and data:
  if (raw.startsWith("data:")) {
    const dataLine = raw.slice("data:".length).trim();
    if (dataLine === "DONE" || dataLine === "[DONE]") {
      // Explicit terminal line, finalize any pending event and exit quietly
      handleEventIfComplete();
      return;
    }
    currentDataLines.push(dataLine);
    return;
  }

  // Ignore other SSE fields but finish on explicit [DONE] where relevant
  if (raw.includes("[DONE]")) {
    handleEventIfComplete();
    return;
  }
});

rl.on("close", () => {
  // Flush any remaining event without trailing blank line
  handleEventIfComplete();
});
