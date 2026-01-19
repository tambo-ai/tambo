/**
 * Tests for create-app command behavior and JSON output.
 */

import fs from "fs";

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  captureStdout,
  makeContext,
  mockProcessExit,
  ProcessExitError,
  setIsTTY,
  withArgs,
} from "../__fixtures__/test-utils.js";

const mockExecSync = jest.fn();
const mockExecFileSync = jest.fn();
const mockValidatePackageManager = jest.fn();
const mockDetectPackageManager = jest.fn<() => "npm">();
const mockGetInstallCommand = jest.fn<() => string>();

jest.unstable_mockModule("child_process", () => ({
  execSync: mockExecSync,
  execFileSync: mockExecFileSync,
}));

jest.unstable_mockModule("../utils/package-manager.js", () => ({
  detectPackageManager: mockDetectPackageManager,
  getInstallCommand: mockGetInstallCommand,
  validatePackageManager: mockValidatePackageManager,
}));

const mockInquirerPrompt = jest.fn<() => Promise<{ appName: string; templateKey: string }>>();
jest.unstable_mockModule("inquirer", () => ({
  default: {
    prompt: mockInquirerPrompt,
  },
}));

const { createApp } = await import("./create-app.js");
type CreateAppContext = Parameters<NonNullable<typeof createApp.run>>[0];

describe("create-app command", () => {
  let exitSpy: jest.SpiedFunction<typeof process.exit>;
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    exitSpy = mockProcessExit();
    mockDetectPackageManager.mockReturnValue("npm");
    mockGetInstallCommand.mockReturnValue("install");
    jest.spyOn(fs, "existsSync").mockReturnValue(false);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    setIsTTY(originalIsTTY);
    jest.restoreAllMocks();
  });

  it("returns guidance when non-interactive and args are missing", async () => {
    setIsTTY(false);

    const output = await captureStdout(async () => {
      const context = makeContext(
        withArgs({
          json: true,
          name: "my-app",
          "install-deps": true,
          "no-install-deps": false,
          "init-git": false,
          "dry-run": false,
        })
      ) as unknown as CreateAppContext;
      await createApp.run?.(context);
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(false);
    expect(result.reason).toBe("interactive_required");
  });

  it("returns success for dry run with args", async () => {
    setIsTTY(false);

    const output = await captureStdout(async () => {
      await createApp.run?.(
        makeContext(
          withArgs({
            json: true,
            name: "my-app",
            template: "standard",
            "install-deps": true,
            "no-install-deps": false,
            "init-git": false,
            "dry-run": true,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.appName).toBe("my-app");
    expect(mockExecSync).not.toHaveBeenCalled();
    expect(mockExecFileSync).not.toHaveBeenCalled();
  });

  it("exits when directory exists", async () => {
    setIsTTY(false);
    jest.spyOn(fs, "existsSync").mockReturnValue(true);

    await expect(
      Promise.resolve(
        createApp.run?.(
          makeContext(
            withArgs({
              json: true,
              name: "existing",
              template: "standard",
              "install-deps": true,
              "no-install-deps": false,
              "init-git": false,
              "dry-run": false,
            })
          )
        )
      )
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits when invalid template is specified", async () => {
    setIsTTY(false);

    await expect(
      Promise.resolve(
        createApp.run?.(
          makeContext(
            withArgs({
              json: true,
              name: "my-app",
              template: "invalid",
              "install-deps": true,
              "no-install-deps": false,
              "init-git": false,
              "dry-run": false,
            })
          )
        )
      )
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits when invalid app name is specified", async () => {
    setIsTTY(false);

    await expect(
      Promise.resolve(
        createApp.run?.(
          makeContext(
            withArgs({
              json: true,
              name: "invalid name!",
              template: "standard",
              "install-deps": true,
              "no-install-deps": false,
              "init-git": false,
              "dry-run": false,
            })
          )
        )
      )
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("handles dry run with analytics template", async () => {
    setIsTTY(false);

    const output = await captureStdout(async () => {
      await createApp.run?.(
        makeContext(
          withArgs({
            json: true,
            name: "my-app",
            template: "analytics",
            "install-deps": true,
            "no-install-deps": false,
            "init-git": false,
            "dry-run": true,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.template).toBe("analytics");
  });

  it("handles dry run with no-install-deps", async () => {
    setIsTTY(false);

    const output = await captureStdout(async () => {
      await createApp.run?.(
        makeContext(
          withArgs({
            json: true,
            name: "my-app",
            template: "standard",
            "install-deps": false,
            "no-install-deps": true,
            "init-git": false,
            "dry-run": true,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  it("handles dry run with init-git", async () => {
    setIsTTY(false);

    const output = await captureStdout(async () => {
      await createApp.run?.(
        makeContext(
          withArgs({
            json: true,
            name: "my-app",
            template: "standard",
            "install-deps": false,
            "no-install-deps": true,
            "init-git": true,
            "dry-run": true,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  // Non-interactive safety tests - ensure no prompts that could hang in CI/agent environments
  describe("non-interactive mode never triggers prompts", () => {
    it("never calls inquirer.prompt when TTY is false with all args provided", async () => {
      setIsTTY(false);

      await captureStdout(async () => {
        await createApp.run?.(
          makeContext(
            withArgs({
              json: true,
              name: "my-app",
              template: "standard",
              "install-deps": false,
              "no-install-deps": true,
              "init-git": false,
              "dry-run": true,
            })
          )
        );
      });

      expect(mockInquirerPrompt).not.toHaveBeenCalled();
    });

    it("never calls inquirer.prompt even when template is missing (returns guidance)", async () => {
      setIsTTY(false);

      await captureStdout(async () => {
        const context = makeContext(
          withArgs({
            json: true,
            name: "my-app",
            "install-deps": true,
            "no-install-deps": false,
            "init-git": false,
            "dry-run": false,
          })
        ) as unknown as CreateAppContext;
        await createApp.run?.(context);
      });

      expect(mockInquirerPrompt).not.toHaveBeenCalled();
    });

    it("returns guidance instead of prompting when non-interactive and args missing", async () => {
      setIsTTY(false);

      const output = await captureStdout(async () => {
        const context = makeContext(
          withArgs({
            json: true,
            name: "my-app",
            "install-deps": true,
            "no-install-deps": false,
            "init-git": false,
            "dry-run": false,
          })
        ) as unknown as CreateAppContext;
        await createApp.run?.(context);
      });

      expect(mockInquirerPrompt).not.toHaveBeenCalled();
      const result = JSON.parse(output);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("interactive_required");
      expect(result.guidance).toBeDefined();
    });

    it("completes without prompting when all required args are provided in non-TTY", async () => {
      setIsTTY(false);

      const output = await captureStdout(async () => {
        await createApp.run?.(
          makeContext(
            withArgs({
              json: true,
              name: "test-app",
              template: "standard",
              "install-deps": false,
              "no-install-deps": true,
              "init-git": false,
              "dry-run": true,
            })
          )
        );
      });

      expect(mockInquirerPrompt).not.toHaveBeenCalled();
      const result = JSON.parse(output);
      expect(result.success).toBe(true);
    });
  });

  // Non-JSON output tests
  describe("non-JSON output", () => {
    it("returns dry run with args in non-JSON mode", async () => {
      setIsTTY(false);

      await captureStdout(async () => {
        await createApp.run?.(
          makeContext(
            withArgs({
              json: false,
              name: "my-app",
              template: "standard",
              "install-deps": true,
              "no-install-deps": false,
              "init-git": false,
              "dry-run": true,
            })
          )
        );
      });
    });

    it("exits on invalid template in non-JSON mode", async () => {
      setIsTTY(false);

      await expect(
        Promise.resolve(
          createApp.run?.(
            makeContext(
              withArgs({
                json: false,
                name: "my-app",
                template: "bad-template",
                "install-deps": true,
                "no-install-deps": false,
                "init-git": false,
                "dry-run": false,
              })
            )
          )
        )
      ).rejects.toBeInstanceOf(ProcessExitError);
    });
  });

});
