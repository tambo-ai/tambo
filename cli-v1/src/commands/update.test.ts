/**
 * Tests for update command behavior and JSON output.
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
const mockHandleUpdateComponents = jest.fn<
  (components: string[], options: Record<string, unknown>) => Promise<void>
>();
const mockGetInstalledComponents = jest.fn<
  (prefix: string, isExplicitPrefix: boolean) => Promise<string[]>
>();

jest.unstable_mockModule("../utils/project-helpers.js", () => ({
  requirePackageJson: mockRequirePackageJson,
}));

jest.unstable_mockModule("./update-core.js", () => ({
  handleUpdateComponents: mockHandleUpdateComponents,
}));

jest.unstable_mockModule("./add/utils.js", () => ({
  getInstalledComponents: mockGetInstalledComponents,
}));

jest.unstable_mockModule("ora", () => ({
  default: jest.fn(() => ({
    start: jest.fn(() => ({ succeed: jest.fn(), fail: jest.fn() })),
  })),
}));

const { update } = await import("./update.js");

describe("update command", () => {
  let exitSpy: jest.SpiedFunction<typeof process.exit>;
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    exitSpy = mockProcessExit();
    mockRequirePackageJson.mockReturnValue(true);
    mockGetInstalledComponents.mockResolvedValue(["message-thread-full"]);
    mockHandleUpdateComponents.mockResolvedValue(undefined);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    setIsTTY(originalIsTTY);
    jest.clearAllMocks();
  });

  it("exits when no components specified", async () => {
    await expect(
      Promise.resolve(
        update.run?.(
          makeContext(
            withArgs({
              json: true,
            all: false,
            components: "",
            prefix: "src/components",
            "legacy-peer-deps": false,
            })
          )
        )
      )
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("updates specific components", async () => {
    const output = await captureStdout(async () => {
      await update.run?.(
        makeContext(
          withArgs({
            json: true,
            components: "message-thread-full",
            all: false,
            prefix: "src/components",
            "legacy-peer-deps": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.componentsUpdated).toEqual(["message-thread-full"]);
  });

  it("updates all installed components", async () => {
    const output = await captureStdout(async () => {
      await update.run?.(
        makeContext(
          withArgs({
            json: true,
            all: true,
            components: "installed",
            prefix: "src/components",
            "legacy-peer-deps": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.componentsUpdated).toEqual(["message-thread-full"]);
  });

  it("handles update failures", async () => {
    mockHandleUpdateComponents.mockRejectedValue(new Error("fail"));

    await expect(
      Promise.resolve(
        update.run?.(
          makeContext(
            withArgs({
              json: true,
            all: true,
            components: "installed",
            prefix: "src/components",
            "legacy-peer-deps": false,
            })
          )
        )
      )
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("runs in TTY mode", async () => {
    setIsTTY(true);

    const output = await captureStdout(async () => {
      await update.run?.(
        makeContext(
          withArgs({
            json: true,
            all: true,
            components: "installed",
            prefix: "src/components",
            "legacy-peer-deps": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  it("runs in non-TTY mode", async () => {
    setIsTTY(false);

    const output = await captureStdout(async () => {
      await update.run?.(
        makeContext(
          withArgs({
            json: true,
            all: true,
            components: "installed",
            prefix: "src/components",
            "legacy-peer-deps": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });
});
