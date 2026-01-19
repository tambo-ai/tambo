/**
 * Tests for upgrade command behavior and JSON output.
 *
 * CRITICAL: Includes non-interactive safety tests to ensure inquirer.prompt
 * is NEVER called when running in non-TTY mode. This prevents CI/agent hangs.
 */

import fs from "fs";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import {
  captureStdout,
  getSubcommand,
  mockProcessExit,
  setIsTTY,
  withArgs,
} from "../__fixtures__/test-utils.js";

const mockRequirePackageJson =
  jest.fn<(args: { json: boolean }, result: { errors: string[] }) => boolean>();
const mockUpgradeNpmPackages =
  jest.fn<(options: Record<string, unknown>) => Promise<boolean>>();
const mockUpgradeSkill = jest.fn<
  (options: Record<string, unknown>) => Promise<{
    success: boolean;
    result?: { targetPath: string; filesInstalled: string[] };
  }>
>();
const mockUpgradeComponents =
  jest.fn<(options: Record<string, unknown>) => Promise<boolean>>();

// CRITICAL: Track inquirer.prompt calls to ensure non-interactive safety
const mockInquirerPrompt = jest.fn<() => Promise<Record<string, unknown>>>();

jest.unstable_mockModule("../utils/project-helpers.js", () => ({
  requirePackageJson: mockRequirePackageJson,
}));

jest.unstable_mockModule("./upgrade/npm-packages.js", () => ({
  upgradeNpmPackages: mockUpgradeNpmPackages,
}));

jest.unstable_mockModule("./upgrade/skill.js", () => ({
  upgradeSkill: mockUpgradeSkill,
}));

jest.unstable_mockModule("./upgrade/components.js", () => ({
  upgradeComponents: mockUpgradeComponents,
}));

jest.unstable_mockModule("ora", () => ({
  default: jest.fn(() => ({
    start: jest.fn(() => ({ succeed: jest.fn(), fail: jest.fn() })),
  })),
}));

// Mock inquirer to track if prompts are ever triggered
jest.unstable_mockModule("inquirer", () => ({
  default: { prompt: mockInquirerPrompt },
}));

const { upgrade } = await import("./upgrade.js");

describe("upgrade command", () => {
  let exitSpy: jest.SpiedFunction<typeof process.exit>;
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    exitSpy = mockProcessExit();
    mockRequirePackageJson.mockReturnValue(true);
    mockUpgradeNpmPackages.mockResolvedValue(true);
    mockUpgradeSkill.mockResolvedValue({
      success: true,
      result: {
        targetPath: "src/components/tambo",
        filesInstalled: ["SKILL.md"],
      },
    });
    mockUpgradeComponents.mockResolvedValue(true);
    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue(
        JSON.stringify({ dependencies: { "@tambo-ai/react": "^1.0.0" } }),
      );
  });

  afterEach(() => {
    exitSpy.mockRestore();
    setIsTTY(originalIsTTY);
    jest.clearAllMocks();
  });

  it("upgrades packages successfully", async () => {
    const output = await captureStdout(async () => {
      await getSubcommand(upgrade, "packages")?.run?.({
        args: withArgs({ json: true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  it("upgrades components successfully", async () => {
    const output = await captureStdout(async () => {
      await getSubcommand(upgrade, "components")?.run?.({
        args: withArgs({ json: true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  it("upgrades agent docs successfully", async () => {
    const output = await captureStdout(async () => {
      await getSubcommand(upgrade, "skill")?.run?.({
        args: withArgs({ json: true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  it("runs all upgrades and respects skip-agent-docs", async () => {
    const output = await captureStdout(async () => {
      await getSubcommand(upgrade, "all")?.run?.({
        args: withArgs({ json: true, "skip-agent-docs": true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.skillInstalled).toBe(false);
    expect(mockUpgradeSkill).not.toHaveBeenCalled();
  });

  it("runs in TTY mode", async () => {
    setIsTTY(true);

    const output = await captureStdout(async () => {
      await getSubcommand(upgrade, "packages")?.run?.({
        args: withArgs({ json: true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  it("runs in non-TTY mode", async () => {
    setIsTTY(false);

    const output = await captureStdout(async () => {
      await getSubcommand(upgrade, "packages")?.run?.({
        args: withArgs({ json: true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  it("runs all upgrades without skip-agent-docs", async () => {
    const output = await captureStdout(async () => {
      await getSubcommand(upgrade, "all")?.run?.({
        args: withArgs({ json: true, "skip-agent-docs": false }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.skillInstalled).toBe(true);
    expect(mockUpgradeSkill).toHaveBeenCalled();
  });

  it("warns when no tambo dependency found", async () => {
    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue(JSON.stringify({ dependencies: {} }));

    const output = await captureStdout(async () => {
      await getSubcommand(upgrade, "packages")?.run?.({
        args: withArgs({ json: true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
  });

  // Non-JSON output tests - lightweight, verify commands run without crashing
  describe("non-JSON output", () => {
    it("runs packages in non-JSON mode", async () => {
      await captureStdout(async () => {
        await getSubcommand(upgrade, "packages")?.run?.({
          args: withArgs({ json: false, "legacy-peer-deps": false }),
        });
      });
    });

    it("runs components in non-JSON mode", async () => {
      await captureStdout(async () => {
        await getSubcommand(upgrade, "components")?.run?.({
          args: withArgs({
            json: false,
            prefix: "src/components",
            "legacy-peer-deps": false,
          }),
        });
      });
    });

    it("runs skill in non-JSON mode", async () => {
      await captureStdout(async () => {
        await getSubcommand(upgrade, "skill")?.run?.({
          args: withArgs({ json: false, prefix: "src/components" }),
        });
      });
    });

    it("runs all in non-JSON mode", async () => {
      await captureStdout(async () => {
        await getSubcommand(upgrade, "all")?.run?.({
          args: withArgs({
            json: false,
            prefix: "src/components",
            "legacy-peer-deps": false,
            "skip-agent-docs": false,
          }),
        });
      });
    });

    it("runs all with skip-agent-docs in non-JSON mode", async () => {
      await captureStdout(async () => {
        await getSubcommand(upgrade, "all")?.run?.({
          args: withArgs({
            json: false,
            prefix: "src/components",
            "legacy-peer-deps": false,
            "skip-agent-docs": true,
          }),
        });
      });
    });
  });

  // ============================================================================
  // NON-INTERACTIVE SAFETY TESTS
  // ============================================================================
  // CRITICAL: These tests ensure upgrade commands NEVER trigger interactive prompts
  // when running in non-TTY mode. If these fail, CI/agent workflows will hang.
  describe("non-interactive mode never triggers prompts", () => {
    beforeEach(() => {
      setIsTTY(false);
      mockInquirerPrompt.mockClear();
    });

    it("packages subcommand never calls inquirer.prompt in non-TTY mode", async () => {
      await captureStdout(async () => {
        await getSubcommand(upgrade, "packages")?.run?.({
          args: withArgs({ json: true }),
        });
      });
      expect(mockInquirerPrompt).not.toHaveBeenCalled();
    });

    it("components subcommand never calls inquirer.prompt in non-TTY mode", async () => {
      await captureStdout(async () => {
        await getSubcommand(upgrade, "components")?.run?.({
          args: withArgs({ json: true }),
        });
      });
      expect(mockInquirerPrompt).not.toHaveBeenCalled();
    });

    it("skill subcommand never calls inquirer.prompt in non-TTY mode", async () => {
      await captureStdout(async () => {
        await getSubcommand(upgrade, "skill")?.run?.({
          args: withArgs({ json: true }),
        });
      });
      expect(mockInquirerPrompt).not.toHaveBeenCalled();
    });

    it("all subcommand never calls inquirer.prompt in non-TTY mode", async () => {
      await captureStdout(async () => {
        await getSubcommand(upgrade, "all")?.run?.({
          args: withArgs({ json: true, "skip-agent-docs": false }),
        });
      });
      expect(mockInquirerPrompt).not.toHaveBeenCalled();
    });

    it("all subcommand with skip-agent-docs never calls inquirer.prompt", async () => {
      await captureStdout(async () => {
        await getSubcommand(upgrade, "all")?.run?.({
          args: withArgs({ json: true, "skip-agent-docs": true }),
        });
      });
      expect(mockInquirerPrompt).not.toHaveBeenCalled();
    });

    it("passes yes:true to underlying functions preventing prompts", async () => {
      await captureStdout(async () => {
        await getSubcommand(upgrade, "all")?.run?.({
          args: withArgs({ json: true }),
        });
      });

      // Verify all underlying functions received yes: true
      expect(mockUpgradeNpmPackages).toHaveBeenCalledWith(
        expect.objectContaining({ yes: true }),
      );
      expect(mockUpgradeSkill).toHaveBeenCalledWith(
        expect.objectContaining({ yes: true }),
      );
      expect(mockUpgradeComponents).toHaveBeenCalledWith(
        expect.objectContaining({ yes: true }),
      );
    });
  });
});
