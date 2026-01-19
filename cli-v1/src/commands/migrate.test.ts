/**
 * Tests for migrate command behavior and JSON output.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  captureStdout,
  makeContext,
  mockProcessExit,
  ProcessExitError,
  setIsTTY,
  withArgs,
} from "../__fixtures__/test-utils.js";

const mockRequirePackageJson = jest.fn<
  (args: { json: boolean }, result: { errors: string[] }) => boolean
>();
const mockHandleMigrate = jest.fn<(options: Record<string, unknown>) => Promise<void>>();

jest.unstable_mockModule("../utils/project-helpers.js", () => ({
  requirePackageJson: mockRequirePackageJson,
}));

jest.unstable_mockModule("./migrate-core.js", () => ({
  handleMigrate: mockHandleMigrate,
}));

const { migrate } = await import("./migrate.js");

describe("migrate command", () => {
  let exitSpy: jest.SpiedFunction<typeof process.exit>;
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    exitSpy = mockProcessExit();
    mockRequirePackageJson.mockReturnValue(true);
    mockHandleMigrate.mockResolvedValue(undefined);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    setIsTTY(originalIsTTY);
    jest.clearAllMocks();
  });

  it("runs migration in json mode", async () => {
    const output = await captureStdout(async () => {
      await migrate.run?.(makeContext(withArgs({ json: true, "dry-run": false })));
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(false);
  });

  it("supports dry-run mode", async () => {
    const output = await captureStdout(async () => {
      await migrate.run?.(makeContext(withArgs({ json: true, "dry-run": true })));
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(true);
  });

  it("handles migration failures", async () => {
    mockHandleMigrate.mockRejectedValue(new Error("fail"));

    await expect(
      Promise.resolve(
        migrate.run?.(makeContext(withArgs({ json: true, "dry-run": false })))
      )
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("runs in TTY mode", async () => {
    setIsTTY(true);

    const output = await captureStdout(async () => {
      await migrate.run?.(makeContext(withArgs({ json: true, "dry-run": false })));
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  it("runs in non-TTY mode", async () => {
    setIsTTY(false);

    const output = await captureStdout(async () => {
      await migrate.run?.(makeContext(withArgs({ json: true, "dry-run": false })));
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  it("exits when no package.json exists", async () => {
    mockRequirePackageJson.mockReturnValue(false);

    await expect(
      Promise.resolve(
        migrate.run?.(makeContext(withArgs({ json: false, "dry-run": false })))
      )
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  // Non-JSON output tests
  describe("non-JSON output", () => {
    it("runs migration in non-JSON mode", async () => {
      await captureStdout(async () => {
        await migrate.run?.(makeContext(withArgs({ json: false, "dry-run": false })));
      });
    });

    it("runs dry-run in non-JSON mode", async () => {
      await captureStdout(async () => {
        await migrate.run?.(makeContext(withArgs({ json: false, "dry-run": true })));
      });
    });

    it("handles migration failure in non-JSON mode", async () => {
      mockHandleMigrate.mockRejectedValue(new Error("Migration failed"));

      await expect(
        Promise.resolve(
          migrate.run?.(makeContext(withArgs({ json: false, "dry-run": false })))
        )
      ).rejects.toBeInstanceOf(ProcessExitError);
    });
  });
});
