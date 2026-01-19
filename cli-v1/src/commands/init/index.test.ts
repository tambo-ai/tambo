/**
 * Tests for init command behavior and JSON output.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  captureStdout,
  makeContext,
  mockFs,
  mockProcessExit,
  ProcessExitError,
  setIsTTY,
  withArgs,
} from "../../__fixtures__/test-utils.js";
import type { ProjectStatus } from "../../utils/project-detection.js";

const mockRequirePackageJson = jest.fn<
  (args: { json: boolean }, result: { errors: string[] }) => boolean
>();
const mockDetectProjectStatus = jest.fn<() => Promise<ProjectStatus>>();
const mockBuildInitGuidance = jest.fn();
const mockInstallSkill = jest.fn<() => Promise<void>>();
const mockWriteApiKeyToEnv = jest.fn<
  (apiKey: string, options: { jsonMode: boolean; onFileCreated?: (file: string) => void }) => {
    envFile: string;
    created: boolean;
    modified: boolean;
  }
>();
const mockGetLibDirectory = jest.fn<() => string>(() => "/tmp/lib");
const mockRunDeviceAuthFlow = jest.fn<
  () => Promise<{ user: { id: string; email?: string; name?: string } }>
>();
const mockApi = {
  project: {
    createProject2: {
      mutate: jest.fn<() => Promise<{ id: string; name: string }>>(),
    },
    generateApiKey: {
      mutate: jest.fn<() => Promise<{ apiKey: string }>>(),
    },
  },
};
const mockExecFileSync = jest.fn();
const mockDetectPackageManager = jest.fn<() => "npm" | "pnpm" | "yarn" | "bun">();
const mockGetInstallCommand = jest.fn<() => string>();

jest.unstable_mockModule("../../utils/project-helpers.js", () => ({
  requirePackageJson: mockRequirePackageJson,
}));

jest.unstable_mockModule("../../utils/project-detection.js", () => ({
  detectProjectStatus: mockDetectProjectStatus,
}));

jest.unstable_mockModule("../../utils/guidance.js", () => ({
  buildInitGuidance: mockBuildInitGuidance,
}));

jest.unstable_mockModule("../shared/skill-install.js", () => ({
  installSkill: mockInstallSkill,
}));

jest.unstable_mockModule("../../templates/tambo-ts.js", () => ({
  tamboTsTemplate: "template",
}));

jest.unstable_mockModule("../../utils/env-helpers.js", () => ({
  writeApiKeyToEnv: mockWriteApiKeyToEnv,
}));

jest.unstable_mockModule("../../utils/path-utils.js", () => ({
  getLibDirectory: mockGetLibDirectory,
}));

jest.unstable_mockModule("../../utils/package-manager.js", () => ({
  detectPackageManager: mockDetectPackageManager,
  getInstallCommand: mockGetInstallCommand,
}));

jest.unstable_mockModule("../../lib/device-auth.js", () => ({
  runDeviceAuthFlow: mockRunDeviceAuthFlow,
  DeviceAuthError: class MockDeviceAuthError extends Error {},
}));

jest.unstable_mockModule("../../lib/api-client.js", () => ({
  api: mockApi,
}));

const mockExecSync = jest.fn();
jest.unstable_mockModule("child_process", () => ({
  execFileSync: mockExecFileSync,
  execSync: mockExecSync,
}));

jest.unstable_mockModule("ora", () => ({
  default: jest.fn(() => ({
    start: jest.fn(() => ({
      succeed: jest.fn(),
      fail: jest.fn(),
    })),
  })),
}));

const mockInquirerPrompt = jest.fn<() => Promise<{ projectName: string }>>();
jest.unstable_mockModule("inquirer", () => ({
  default: {
    prompt: mockInquirerPrompt,
  },
}));

const { init } = await import("./index.js");

describe("init command", () => {
  let exitSpy: jest.SpiedFunction<typeof process.exit>;
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    jest.clearAllMocks();
    exitSpy = mockProcessExit();
    mockRequirePackageJson.mockReturnValue(true);
    mockDetectProjectStatus.mockResolvedValue({
      hasPackageJson: true,
      packageManager: "npm",
      hasTamboReact: false,
      authenticated: false,
      hasApiKey: false,
      hasTamboTs: false,
      hasAgentDocs: false,
    });
    mockBuildInitGuidance.mockReturnValue({
      description: "guidance",
      commands: [],
    });
    mockInstallSkill.mockResolvedValue(undefined);
    mockWriteApiKeyToEnv.mockImplementation((_apiKey, options) => {
      options.onFileCreated?.(".env.local");
      return { envFile: ".env.local", created: true, modified: false };
    });
    mockRunDeviceAuthFlow.mockResolvedValue({ user: { id: "u1", email: "u@e.com" } });
    mockApi.project.createProject2.mutate.mockResolvedValue({ id: "p1", name: "proj" });
    mockApi.project.generateApiKey.mutate.mockResolvedValue({ apiKey: "key" });
    mockDetectPackageManager.mockReturnValue("npm");
    mockGetInstallCommand.mockReturnValue("install");
  });

  afterEach(() => {
    exitSpy.mockRestore();
    setIsTTY(originalIsTTY);
    jest.restoreAllMocks();
  });

  it("returns guidance when non-interactive without --yes", async () => {
    setIsTTY(false);

    const output = await captureStdout(async () => {
      await init.run?.(
        makeContext(
          withArgs({
            json: true,
            prefix: "src/components",
            yes: false,
            "project-name": "proj",
            "skip-agent-docs": false,
            "dry-run": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(false);
    expect(result.reason).toBe("interactive_required");
    expect(result.guidance.description).toBe("guidance");
  });

  it("runs full flow with --yes", async () => {
    setIsTTY(false);
    mockFs({});

    const output = await captureStdout(async () => {
      await init.run?.(
        makeContext(
          withArgs({
            json: true,
            prefix: "src/components",
            yes: true,
            "project-name": "proj",
            "skip-agent-docs": false,
            "dry-run": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.projectCreated).toBe(true);
    expect(result.apiKeyCreated).toBe(true);
    expect(result.tamboTsCreated).toBe(true);
    expect(result.skillInstalled).toBe(true);
    expect(result.filesCreated).toContain(".env.local");
    expect(result.filesCreated).toContain("/tmp/lib/tambo.ts");
  });

  it("skips agent docs when flag is set", async () => {
    setIsTTY(false);
    mockFs({});

    const output = await captureStdout(async () => {
      await init.run?.(
        makeContext(
          withArgs({
            json: true,
            prefix: "src/components",
            yes: true,
            "project-name": "proj",
            "skip-agent-docs": true,
            "dry-run": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.skillInstalled).toBe(false);
    expect(mockInstallSkill).not.toHaveBeenCalled();
  });

  it("exits when no package.json", async () => {
    mockRequirePackageJson.mockReturnValue(false);

    await expect(
      Promise.resolve(
        init.run?.(
          makeContext(
            withArgs({
              json: true,
              prefix: "src/components",
              yes: true,
              "project-name": "proj",
              "skip-agent-docs": false,
              "dry-run": false,
            })
          )
        )
      )
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("skips install when tambo-react already installed", async () => {
    setIsTTY(false);
    mockFs({});
    mockDetectProjectStatus.mockResolvedValue({
      hasPackageJson: true,
      packageManager: "npm",
      hasTamboReact: true,
      authenticated: false,
      hasApiKey: false,
      hasTamboTs: false,
      hasAgentDocs: false,
    });

    const output = await captureStdout(async () => {
      await init.run?.(
        makeContext(
          withArgs({
            json: true,
            prefix: "src/components",
            yes: true,
            "project-name": "proj",
            "skip-agent-docs": false,
            "dry-run": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.tamboReactInstalled).toBe(true);
    expect(mockExecFileSync).not.toHaveBeenCalled();
  });

  it("skips auth when already authenticated", async () => {
    setIsTTY(false);
    mockFs({});
    mockDetectProjectStatus.mockResolvedValue({
      hasPackageJson: true,
      packageManager: "npm",
      hasTamboReact: true,
      authenticated: true,
      hasApiKey: false,
      hasTamboTs: false,
      hasAgentDocs: false,
    });

    const output = await captureStdout(async () => {
      await init.run?.(
        makeContext(
          withArgs({
            json: true,
            prefix: "src/components",
            yes: true,
            "project-name": "proj",
            "skip-agent-docs": false,
            "dry-run": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.authenticated).toBe(true);
  });

  it("skips project creation when API key exists", async () => {
    setIsTTY(false);
    mockFs({ "/.env.local": "TAMBO_API_KEY=test" });
    mockDetectProjectStatus.mockResolvedValue({
      hasPackageJson: true,
      packageManager: "npm",
      hasTamboReact: true,
      authenticated: true,
      hasApiKey: true,
      hasTamboTs: false,
      hasAgentDocs: false,
    });

    const output = await captureStdout(async () => {
      await init.run?.(
        makeContext(
          withArgs({
            json: true,
            prefix: "src/components",
            yes: true,
            "project-name": "proj",
            "skip-agent-docs": true,
            "dry-run": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.projectCreated).toBe(false);
    expect(mockApi.project.createProject2.mutate).not.toHaveBeenCalled();
  });

  it("handles dry run", async () => {
    setIsTTY(false);

    const output = await captureStdout(async () => {
      await init.run?.(
        makeContext(
          withArgs({
            json: true,
            prefix: "src/components",
            yes: true,
            "project-name": "proj",
            "skip-agent-docs": false,
            "dry-run": true,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(mockExecFileSync).not.toHaveBeenCalled();
    expect(mockApi.project.createProject2.mutate).not.toHaveBeenCalled();
  });

  it("exits when --yes without --project-name and no API key", async () => {
    setIsTTY(false);

    await expect(
      Promise.resolve(
        init.run?.(
          makeContext(
            withArgs({
              json: true,
              prefix: "src/components",
              yes: true,
              "project-name": "",
              "skip-agent-docs": false,
              "dry-run": false,
            })
          )
        )
      )
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("skips tambo.ts creation when it exists", async () => {
    setIsTTY(false);
    mockFs({ "/tmp/lib/tambo.ts": "existing" });
    mockDetectProjectStatus.mockResolvedValue({
      hasPackageJson: true,
      packageManager: "npm",
      hasTamboReact: true,
      authenticated: true,
      hasApiKey: true,
      hasTamboTs: true,
      hasAgentDocs: false,
    });

    const output = await captureStdout(async () => {
      await init.run?.(
        makeContext(
          withArgs({
            json: true,
            prefix: "src/components",
            yes: true,
            "project-name": "proj",
            "skip-agent-docs": true,
            "dry-run": false,
          })
        )
      );
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.tamboTsCreated).toBe(false);
  });

  // Non-interactive safety tests - ensure no prompts that could hang in CI/agent environments
  describe("non-interactive mode never triggers prompts", () => {
    it("never calls inquirer.prompt when TTY is false", async () => {
      setIsTTY(false);

      await captureStdout(async () => {
        await init.run?.(
          makeContext(
            withArgs({
              json: true,
              prefix: "src/components",
              yes: false,
              "project-name": "proj",
              "skip-agent-docs": false,
              "dry-run": false,
            })
          )
        );
      });

      expect(mockInquirerPrompt).not.toHaveBeenCalled();
    });

    it("never calls inquirer.prompt with --yes flag in non-TTY", async () => {
      setIsTTY(false);
      mockFs({});

      await captureStdout(async () => {
        await init.run?.(
          makeContext(
            withArgs({
              json: true,
              prefix: "src/components",
              yes: true,
              "project-name": "proj",
              "skip-agent-docs": false,
              "dry-run": false,
            })
          )
        );
      });

      expect(mockInquirerPrompt).not.toHaveBeenCalled();
    });

    it("returns guidance instead of prompting when non-interactive without required args", async () => {
      setIsTTY(false);

      const output = await captureStdout(async () => {
        await init.run?.(
          makeContext(
            withArgs({
              json: true,
              prefix: "src/components",
              yes: false,
              "project-name": "",
              "skip-agent-docs": false,
              "dry-run": false,
            })
          )
        );
      });

      expect(mockInquirerPrompt).not.toHaveBeenCalled();
      const result = JSON.parse(output);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("interactive_required");
      expect(result.guidance).toBeDefined();
    });
  });

  // Non-JSON output tests
  describe("non-JSON output", () => {
    it("runs full flow in non-JSON mode", async () => {
      setIsTTY(false);
      mockFs({});

      await captureStdout(async () => {
        await init.run?.(
          makeContext(
            withArgs({
              json: false,
              prefix: "src/components",
              yes: true,
              "project-name": "proj",
              "skip-agent-docs": false,
              "dry-run": false,
            })
          )
        );
      });
    });

    it("runs dry run in non-JSON mode", async () => {
      setIsTTY(false);

      await captureStdout(async () => {
        await init.run?.(
          makeContext(
            withArgs({
              json: false,
              prefix: "src/components",
              yes: true,
              "project-name": "proj",
              "skip-agent-docs": false,
              "dry-run": true,
            })
          )
        );
      });
    });

    it("runs with skip-agent-docs in non-JSON mode", async () => {
      setIsTTY(false);
      mockFs({});

      await captureStdout(async () => {
        await init.run?.(
          makeContext(
            withArgs({
              json: false,
              prefix: "src/components",
              yes: true,
              "project-name": "proj",
              "skip-agent-docs": true,
              "dry-run": false,
            })
          )
        );
      });
    });

    it("handles existing tambo.ts in non-JSON mode", async () => {
      setIsTTY(false);
      mockFs({ "/tmp/lib/tambo.ts": "existing" });
      mockDetectProjectStatus.mockResolvedValue({
        hasPackageJson: true,
        packageManager: "npm",
        hasTamboReact: true,
        authenticated: true,
        hasApiKey: true,
        hasTamboTs: true,
        hasAgentDocs: false,
      });

      await captureStdout(async () => {
        await init.run?.(
          makeContext(
            withArgs({
              json: false,
              prefix: "src/components",
              yes: true,
              "project-name": "proj",
              "skip-agent-docs": true,
              "dry-run": false,
            })
          )
        );
      });
    });
  });
});
