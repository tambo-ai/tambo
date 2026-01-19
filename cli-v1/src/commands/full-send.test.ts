/**
 * Tests for full-send alias command (DEPRECATED).
 */

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { captureStdout, withArgs } from "../__fixtures__/test-utils.js";

const mockInitRun = jest.fn<() => Promise<void>>();

const mockInit = {
  meta: { name: "init", description: "init" },
  args: { json: { type: "boolean" as const, default: false } },
  subCommands: {},
  run: mockInitRun,
};

jest.unstable_mockModule("./init.js", () => ({
  init: mockInit,
}));

const { fullSend } = await import("./full-send.js");

describe("full-send", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("has deprecated meta information", () => {
    // Meta is a Resolvable, access it directly
    const meta = fullSend.meta as { name?: string; description?: string };
    expect(meta?.name).toBe("full-send");
    expect(meta?.description).toContain("DEPRECATED");
  });

  it("delegates to init command when run", async () => {
    await captureStdout(async () => {
      // Cast to unknown to bypass strict type checking in tests
      const run = fullSend.run as ((ctx: unknown) => Promise<void>) | undefined;
      await run?.({ rawArgs: [], args: withArgs({ json: true }), cmd: {} });
    });

    expect(mockInitRun).toHaveBeenCalled();
  });

  it("shows deprecation warning when not in JSON mode", async () => {
    const output = await captureStdout(async () => {
      const run = fullSend.run as ((ctx: unknown) => Promise<void>) | undefined;
      await run?.({ rawArgs: [], args: withArgs({ json: false }), cmd: {} });
    });

    expect(output).toContain("DEPRECATED");
    expect(mockInitRun).toHaveBeenCalled();
  });

  it("does not show deprecation warning in JSON mode", async () => {
    const output = await captureStdout(async () => {
      const run = fullSend.run as ((ctx: unknown) => Promise<void>) | undefined;
      await run?.({ rawArgs: [], args: withArgs({ json: true }), cmd: {} });
    });

    // Should not log deprecation warning in JSON mode
    expect(output).not.toContain("DEPRECATED");
    expect(mockInitRun).toHaveBeenCalled();
  });
});
