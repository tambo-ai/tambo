/**
 * Tests for output formatting helpers.
 */

import chalk from "chalk";

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

const THICK_SEPARATOR = "═".repeat(60);
const SEPARATOR = "─".repeat(60);
const ASCII_THICK_SEPARATOR = "=".repeat(60);
const ASCII_SEPARATOR = "-".repeat(60);
const stripAnsi = (value: string) => {
  let result = "";
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === "\u001b" && value[index + 1] === "[") {
      index += 2;
      while (index < value.length && value[index] !== "m") {
        index += 1;
      }
      continue;
    }
    result += char;
  }
  return result;
};
const normalizeOutput = (value: string) =>
  stripAnsi(value)
    .replace(/═/g, "=")
    .replace(/─/g, "-")
    .replace(/▶/g, ">")
    .replace(/✓/g, "OK")
    .replace(/ℹ/g, "i")
    .replace(/⚠/g, "!")
    .replace(/✗/g, "x")
    .replace(/│/g, "|");

async function loadOutput(isTTYValue: boolean) {
  jest.resetModules();
  jest.unstable_mockModule("./tty.js", () => ({
    isTTY: jest.fn(() => isTTYValue),
  }));

  const module = await import("./output.js");
  chalk.level = isTTYValue ? 1 : 0;
  return module;
}

describe("output helpers (TTY)", () => {
  let logSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("prints header with separators and uppercase title", async () => {
    const { header } = await loadOutput(true);

    header("Auth Status");

    expect(logSpy).toHaveBeenCalled();
    expect(normalizeOutput(logSpy.mock.calls[1][0])).toBe(
      normalizeOutput(chalk.bold.cyan(THICK_SEPARATOR))
    );
    expect(normalizeOutput(logSpy.mock.calls[2][0])).toBe(
      normalizeOutput(chalk.bold.cyan("  AUTH STATUS"))
    );
    expect(normalizeOutput(logSpy.mock.calls[3][0])).toBe(
      normalizeOutput(chalk.bold.cyan(THICK_SEPARATOR))
    );
  });

  it("prints subheader with yellow title and separator", async () => {
    const { subheader } = await loadOutput(true);

    subheader("Details");

    expect(normalizeOutput(logSpy.mock.calls[1][0])).toBe(
      normalizeOutput(chalk.bold.yellow("▶ Details"))
    );
    expect(normalizeOutput(logSpy.mock.calls[2][0])).toBe(
      normalizeOutput(chalk.dim(SEPARATOR))
    );
  });

  it("prints key-value pairs and handles undefined values", async () => {
    const { keyValue } = await loadOutput(true);

    keyValue("Token", "abc");
    keyValue("API key", undefined);

    expect(normalizeOutput(logSpy.mock.calls[0][0])).toBe(
      normalizeOutput(`  ${chalk.bold("Token:")} abc`)
    );
    expect(normalizeOutput(logSpy.mock.calls[1][0])).toBe(
      normalizeOutput(`  ${chalk.bold("API key:")} ${chalk.dim("(not set)")}`)
    );
  });

  it("prints status messages with icons", async () => {
    const { error, info, success, warning } = await loadOutput(true);

    success("Saved");
    info("Info");
    warning("Warn");
    error("Oops");

    expect(normalizeOutput(logSpy.mock.calls[0][0])).toBe(
      normalizeOutput(chalk.green("✓ Saved"))
    );
    expect(normalizeOutput(logSpy.mock.calls[1][0])).toBe(
      normalizeOutput(chalk.blue("ℹ Info"))
    );
    expect(normalizeOutput(logSpy.mock.calls[2][0])).toBe(
      normalizeOutput(chalk.yellow("⚠ Warn"))
    );
    expect(normalizeOutput(logSpy.mock.calls[3][0])).toBe(
      normalizeOutput(chalk.red("✗ Oops"))
    );
  });

  it("prints explanation lines", async () => {
    const { explanation } = await loadOutput(true);

    explanation(["First", "Second"]);

    expect(normalizeOutput(logSpy.mock.calls[0][0])).toBe(
      normalizeOutput(chalk.dim("  │ First"))
    );
    expect(normalizeOutput(logSpy.mock.calls[1][0])).toBe(
      normalizeOutput(chalk.dim("  │ Second"))
    );
  });

  it("prints next command suggestions", async () => {
    const { nextCommands } = await loadOutput(true);

    nextCommands([
      { command: "tambov1 init", description: "Init" },
      {
        command: "tambov1 init",
        description: "Setup",
        example: "tambov1 init --skip-agent-docs",
      },
    ]);

    expect(normalizeOutput(logSpy.mock.calls[1][0])).toBe(
      normalizeOutput(chalk.bold.yellow("▶ SUGGESTED NEXT COMMANDS"))
    );
    expect(
      logSpy.mock.calls.map((call) => normalizeOutput(String(call[0])))
    ).toEqual(
      expect.arrayContaining([
        normalizeOutput(chalk.bold.white("  1. Init")),
        normalizeOutput(chalk.cyan("     $ tambov1 init")),
        normalizeOutput(chalk.dim("     Example: tambov1 init --skip-agent-docs")),
      ])
    );
  });

  it("prints json payloads", async () => {
    const { json } = await loadOutput(true);

    json({ ok: true });

    expect(logSpy.mock.calls[0][0]).toBe(JSON.stringify({ ok: true }, null, 2));
  });

  it("prints summary with details and suggestions", async () => {
    const { summary } = await loadOutput(true);

    summary({
      operation: "install",
      success: true,
      details: { created: 2, skipped: 0 },
      nextCommands: [{ command: "tambov1 update", description: "Update" }],
    });

    expect(normalizeOutput(logSpy.mock.calls[1][0])).toBe(
      normalizeOutput(chalk.bold.yellow("▶ OPERATION SUMMARY"))
    );
    expect(
      logSpy.mock.calls.map((call) => normalizeOutput(String(call[0])))
    ).toEqual(
      expect.arrayContaining([
        normalizeOutput(`  ${chalk.bold("Operation:")} install`),
        normalizeOutput(`  ${chalk.bold("Status:")} ${chalk.green("SUCCESS")}`),
        "    created: 2",
      ])
    );
  });

  it("prints file change groups and handles empty state", async () => {
    const { fileChanges } = await loadOutput(true);

    fileChanges({
      created: ["a.ts"],
      modified: ["b.ts"],
      deleted: ["c.ts"],
    });

    expect(
      logSpy.mock.calls.map((call) => normalizeOutput(String(call[0])))
    ).toEqual(
      expect.arrayContaining([
        normalizeOutput(chalk.green("  Created:")),
        normalizeOutput(chalk.yellow("  Modified:")),
        normalizeOutput(chalk.red("  Deleted:")),
      ])
    );

    logSpy.mockClear();

    fileChanges({ created: [], modified: [], deleted: [] });
    expect(
      logSpy.mock.calls.map((call) => normalizeOutput(String(call[0])))
    ).toEqual(expect.arrayContaining([normalizeOutput(chalk.dim("  No file changes"))]));
  });
});

describe("output helpers (non-TTY)", () => {
  const originalLevel = chalk.level;
  let logSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    chalk.level = originalLevel;
    logSpy.mockRestore();
  });

  it("prints plain separators and symbols", async () => {
    const { header, subheader, success, warning } = await loadOutput(false);

    header("Plain");
    subheader("Section");
    success("Saved");
    warning("Heads up");

    expect(logSpy).toHaveBeenCalled();
    expect(logSpy.mock.calls).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([ASCII_THICK_SEPARATOR]),
        expect.arrayContaining(["  PLAIN"]),
        expect.arrayContaining([ASCII_SEPARATOR]),
        expect.arrayContaining(["> Section"]),
        expect.arrayContaining(["OK Saved"]),
        expect.arrayContaining(["WARN Heads up"]),
      ])
    );
  });
});
