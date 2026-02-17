/**
 * Tests for execution orchestrator (agentic loop)
 *
 * These tests verify the orchestration flow with mocked client-core dependencies.
 */

import { jest } from "@jest/globals";
import type { ConfirmationResult } from "../user-confirmation/types.js";
import type { InstallationPlan } from "../plan-generation/types.js";

// Mock child_process
const mockExecSync = jest.fn();
const mockExec = jest.fn((...args: unknown[]) => {
  const cb = args[args.length - 1] as (...cbArgs: unknown[]) => void;
  cb(null, { stdout: "", stderr: "" });
});
jest.unstable_mockModule("node:child_process", () => ({
  execSync: mockExecSync,
  exec: mockExec,
}));

// Mock client-core
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCreateTamboClient = jest.fn() as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCreateToolRegistry = jest.fn() as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockExecuteRun = jest.fn() as any;

jest.unstable_mockModule("@tambo-ai/client-core", () => ({
  createTamboClient: mockCreateTamboClient,
  createToolRegistry: mockCreateToolRegistry,
  executeRun: mockExecuteRun,
}));

// Mock file-operations
jest.unstable_mockModule("./file-operations.js", () => ({
  createBackup: jest.fn(),
  restoreBackups: jest.fn(),
  cleanupBackups: jest.fn(),
  executeFileOperations: jest.fn(),
  writeFileAtomic: jest.fn(),
}));

// Mock dependency-installer
jest.unstable_mockModule("./dependency-installer.js", () => ({
  installDependencies: jest.fn(),
  collectDependencies: jest.fn(() => ({
    dependencies: ["@tambo-ai/react"],
    devDependencies: [],
  })),
}));

// Mock verification
jest.unstable_mockModule("./verification.js", () => ({
  verifyExecution: jest.fn(() => []),
}));

// Mock error-recovery
jest.unstable_mockModule("./error-recovery.js", () => ({
  categorizeExecutionError: jest.fn(() => ({
    phase: "file-write",
    cause: "test error",
    suggestions: [],
  })),
  formatExecutionError: jest.fn(() => "formatted error"),
}));

// Mock inquirer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockInquirerPrompt = jest.fn() as jest.Mock<any>;
jest.unstable_mockModule("inquirer", () => ({
  default: { prompt: mockInquirerPrompt },
}));

// Mock agent-tools
jest.unstable_mockModule("./agent-tools.js", () => ({
  agentTools: [
    {
      name: "readFile",
      description: "Read file",
      inputSchema: { parse: (v: unknown) => v },
      execute: jest.fn(),
    },
    {
      name: "readFiles",
      description: "Read multiple files",
      inputSchema: { parse: (v: unknown) => v },
      execute: jest.fn(),
    },
    {
      name: "writeFile",
      description: "Write file",
      inputSchema: { parse: (v: unknown) => v },
      execute: jest.fn(),
    },
    {
      name: "listFiles",
      description: "List files",
      inputSchema: { parse: (v: unknown) => v },
      execute: jest.fn(),
    },
    {
      name: "submitPlan",
      description: "Submit plan",
      inputSchema: { parse: (v: unknown) => v },
      execute: jest.fn(),
    },
    {
      name: "updatePlan",
      description: "Update plan",
      inputSchema: { parse: (v: unknown) => v },
      execute: jest.fn(),
    },
  ],
}));

// Mock execution-prompt
jest.unstable_mockModule("./execution-prompt.js", () => ({
  buildExecutionPrompt: jest.fn(() => "test execution prompt"),
}));

// Mock ora - must match how ora ESM exports work
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockOraFn = jest.fn() as any;
jest.unstable_mockModule("ora", () => {
  return { default: mockOraFn };
});

const { executeCodeChanges } = await import("./index.js");
const execPrompt = await import("./execution-prompt.js");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockBuildExecutionPrompt = execPrompt.buildExecutionPrompt as any;
const depInstaller = await import("./dependency-installer.js");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCollectDependencies = depInstaller.collectDependencies as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockInstallDependencies = depInstaller.installDependencies as any;

describe("executeCodeChanges", () => {
  const mockThread = { id: "test-thread-123" };
  const mockRegistry = {
    register: jest.fn(),
    has: jest.fn(),
    execute: jest.fn(),
    toApiFormat: jest.fn(() => []),
    clear: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup ora mock spinner
    const spinner = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      start: jest.fn().mockReturnThis() as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stop: jest.fn().mockReturnThis() as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      succeed: jest.fn().mockReturnThis() as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fail: jest.fn().mockReturnThis() as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      warn: jest.fn().mockReturnThis() as any,
      text: "",
    };
    // Make start/stop etc return the spinner itself
    spinner.start.mockReturnValue(spinner);
    spinner.stop.mockReturnValue(spinner);
    spinner.succeed.mockReturnValue(spinner);
    spinner.fail.mockReturnValue(spinner);
    spinner.warn.mockReturnValue(spinner);
    mockOraFn.mockReturnValue(spinner);

    mockCreateTamboClient.mockReturnValue({
      sdk: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      threads: { create: (jest.fn() as any).mockResolvedValue(mockThread) },
    });
    mockCreateToolRegistry.mockReturnValue(mockRegistry);
    mockExecuteRun.mockResolvedValue("Done");
    mockBuildExecutionPrompt.mockReturnValue("test execution prompt");

    // Re-setup dependency-installer mock after clearAllMocks
    mockCollectDependencies.mockReturnValue({
      dependencies: ["@tambo-ai/react"],
      devDependencies: [],
    });
    mockInstallDependencies.mockResolvedValue(undefined);
    mockExec.mockImplementation((...args: unknown[]) => {
      const cb = args[args.length - 1] as (...cbArgs: unknown[]) => void;
      cb(null, { stdout: "", stderr: "" });
    });
  });

  test("throws when confirmation is not approved", async () => {
    const confirmation: ConfirmationResult = {
      approved: false,
      selectedItems: [],
      plan: {} as InstallationPlan,
    };

    await expect(
      executeCodeChanges(confirmation, { apiKey: "sk_test" }),
    ).rejects.toThrow("Cannot execute: plan was not approved");
  });

  test("creates client and executes agentic loop", async () => {
    const confirmation: ConfirmationResult = {
      approved: true,
      selectedItems: ["provider-setup"],
      plan: {
        providerSetup: {
          filePath: "app/layout.tsx",
          nestingLevel: 0,
          rationale: "Root layout",
          confidence: 0.95,
        },
        componentRecommendations: [],
        toolRecommendations: [],
        interactableRecommendations: [],
        chatWidgetSetup: {
          position: "bottom-right",
          filePath: "app/page.tsx",
          rationale: "Standard position",
          confidence: 0.9,
        },
      },
    };

    const result = await executeCodeChanges(confirmation, {
      apiKey: "sk_test",
      yes: true,
    });

    expect(result.success).toBe(true);
    expect(mockCreateTamboClient).toHaveBeenCalledWith({
      apiKey: "sk_test",
      userKey: "cli",
    });
    expect(mockExecuteRun).toHaveBeenCalledWith(
      expect.anything(),
      "test-thread-123",
      "test execution prompt",
      expect.objectContaining({
        tools: mockRegistry,
        maxToolRounds: 200,
      }),
    );
  });

  test("registers all agent tools", async () => {
    const confirmation: ConfirmationResult = {
      approved: true,
      selectedItems: ["provider-setup"],
      plan: {
        providerSetup: {
          filePath: "app/layout.tsx",
          nestingLevel: 0,
          rationale: "Root layout",
          confidence: 0.95,
        },
        componentRecommendations: [],
        toolRecommendations: [],
        interactableRecommendations: [],
        chatWidgetSetup: {
          position: "bottom-right",
          filePath: "app/page.tsx",
          rationale: "Standard position",
          confidence: 0.9,
        },
      },
    };

    await executeCodeChanges(confirmation, { apiKey: "sk_test", yes: true });

    // Should register all 6 agent tools
    expect(mockRegistry.register).toHaveBeenCalledTimes(6);
  });

  test("pre-installs chat widget when chat-widget is selected", async () => {
    const confirmation: ConfirmationResult = {
      approved: true,
      selectedItems: ["provider-setup", "chat-widget"],
      plan: {
        providerSetup: {
          filePath: "app/layout.tsx",
          nestingLevel: 0,
          rationale: "Root layout",
          confidence: 0.95,
        },
        componentRecommendations: [],
        toolRecommendations: [],
        interactableRecommendations: [],
        chatWidgetSetup: {
          position: "bottom-right",
          filePath: "app/page.tsx",
          rationale: "Standard position",
          confidence: 0.9,
        },
      },
    };

    await executeCodeChanges(confirmation, { apiKey: "sk_test", yes: true });

    expect(mockExec).toHaveBeenCalledWith(
      "npx tambo add message-thread-full --yes",
      expect.objectContaining({ cwd: expect.any(String) }),
      expect.any(Function),
    );
    // Execution prompt should include chatWidgetInstalled = true
    expect(mockBuildExecutionPrompt).toHaveBeenCalledWith(
      confirmation.plan,
      confirmation.selectedItems,
      true,
      "sk_test",
    );
  });

  test("falls back gracefully when chat widget pre-install fails", async () => {
    mockExec.mockImplementation((...args: unknown[]) => {
      const cb = args[args.length - 1] as (...cbArgs: unknown[]) => void;
      cb(new Error("tambo add failed"));
    });

    const confirmation: ConfirmationResult = {
      approved: true,
      selectedItems: ["chat-widget"],
      plan: {
        providerSetup: {
          filePath: "app/layout.tsx",
          nestingLevel: 0,
          rationale: "Root layout",
          confidence: 0.95,
        },
        componentRecommendations: [],
        toolRecommendations: [],
        interactableRecommendations: [],
        chatWidgetSetup: {
          position: "bottom-right",
          filePath: "app/page.tsx",
          rationale: "Standard position",
          confidence: 0.9,
        },
      },
    };

    const result = await executeCodeChanges(confirmation, {
      apiKey: "sk_test",
      yes: true,
    });

    expect(result.success).toBe(true);
    // Should pass false for chatWidgetInstalled
    expect(mockBuildExecutionPrompt).toHaveBeenCalledWith(
      confirmation.plan,
      confirmation.selectedItems,
      false,
      "sk_test",
    );
  });

  test("returns execution result with dependency info", async () => {
    const confirmation: ConfirmationResult = {
      approved: true,
      selectedItems: ["provider-setup"],
      plan: {
        providerSetup: {
          filePath: "app/layout.tsx",
          nestingLevel: 0,
          rationale: "Root layout",
          confidence: 0.95,
        },
        componentRecommendations: [],
        toolRecommendations: [],
        interactableRecommendations: [],
        chatWidgetSetup: {
          position: "bottom-right",
          filePath: "app/page.tsx",
          rationale: "Standard position",
          confidence: 0.9,
        },
      },
    };

    const result = await executeCodeChanges(confirmation, {
      apiKey: "sk_test",
      yes: true,
    });

    expect(result.success).toBe(true);
    expect(result.dependenciesInstalled).toContain("@tambo-ai/react");
  });

  test("soft round limit prompts user at round 50", async () => {
    // Capture the onRoundComplete callback
    let capturedOnRoundComplete:
      | ((round: number) => Promise<boolean>)
      | undefined;
    mockExecuteRun.mockImplementation(
      async (
        _client: unknown,
        _threadId: unknown,
        _prompt: unknown,
        opts: { onRoundComplete?: (round: number) => Promise<boolean> },
      ) => {
        capturedOnRoundComplete = opts.onRoundComplete;
        // Simulate reaching round 50
        if (capturedOnRoundComplete) {
          const result = await capturedOnRoundComplete(50);
          if (!result)
            throw new Error("Execution aborted by onRoundComplete callback");
        }
        return "Done";
      },
    );

    // User says yes
    mockInquirerPrompt.mockResolvedValueOnce({ shouldContinue: true });

    const confirmation: ConfirmationResult = {
      approved: true,
      selectedItems: ["provider-setup"],
      plan: {
        providerSetup: {
          filePath: "app/layout.tsx",
          nestingLevel: 0,
          rationale: "Root layout",
          confidence: 0.95,
        },
        componentRecommendations: [],
        toolRecommendations: [],
        interactableRecommendations: [],
        chatWidgetSetup: {
          position: "bottom-right",
          filePath: "app/page.tsx",
          rationale: "Standard position",
          confidence: 0.9,
        },
      },
    };

    const result = await executeCodeChanges(confirmation, {
      apiKey: "sk_test",
    });

    expect(result.success).toBe(true);
    expect(mockInquirerPrompt).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: "shouldContinue",
          message: expect.stringContaining("50 tool rounds"),
        }),
      ]),
    );
  });

  test("soft round limit aborts when user says no", async () => {
    mockExecuteRun.mockImplementation(
      async (
        _client: unknown,
        _threadId: unknown,
        _prompt: unknown,
        opts: { onRoundComplete?: (round: number) => Promise<boolean> },
      ) => {
        if (opts.onRoundComplete) {
          const result = await opts.onRoundComplete(50);
          if (!result)
            throw new Error("Execution aborted by onRoundComplete callback");
        }
        return "Done";
      },
    );

    // User says no
    mockInquirerPrompt
      .mockResolvedValueOnce({ shouldContinue: false })
      // Then user picks revert in the rollback prompt
      .mockResolvedValueOnce({ action: "revert" });

    const confirmation: ConfirmationResult = {
      approved: true,
      selectedItems: ["provider-setup"],
      plan: {
        providerSetup: {
          filePath: "app/layout.tsx",
          nestingLevel: 0,
          rationale: "Root layout",
          confidence: 0.95,
        },
        componentRecommendations: [],
        toolRecommendations: [],
        interactableRecommendations: [],
        chatWidgetSetup: {
          position: "bottom-right",
          filePath: "app/page.tsx",
          rationale: "Standard position",
          confidence: 0.9,
        },
      },
    };

    await expect(
      executeCodeChanges(confirmation, { apiKey: "sk_test" }),
    ).rejects.toThrow("aborted");
  });

  test("non-interactive mode auto-reverts on failure", async () => {
    mockExecuteRun.mockRejectedValue(new Error("agent crashed"));

    const confirmation: ConfirmationResult = {
      approved: true,
      selectedItems: ["provider-setup"],
      plan: {
        providerSetup: {
          filePath: "app/layout.tsx",
          nestingLevel: 0,
          rationale: "Root layout",
          confidence: 0.95,
        },
        componentRecommendations: [],
        toolRecommendations: [],
        interactableRecommendations: [],
        chatWidgetSetup: {
          position: "bottom-right",
          filePath: "app/page.tsx",
          rationale: "Standard position",
          confidence: 0.9,
        },
      },
    };

    await expect(
      executeCodeChanges(confirmation, { apiKey: "sk_test", yes: true }),
    ).rejects.toThrow("agent crashed");

    // Should NOT have prompted the user
    expect(mockInquirerPrompt).not.toHaveBeenCalled();
  });

  test("interactive rollback prompt: keep changes", async () => {
    mockExecuteRun.mockRejectedValue(new Error("agent crashed"));
    mockInquirerPrompt.mockResolvedValueOnce({ action: "keep" });

    const confirmation: ConfirmationResult = {
      approved: true,
      selectedItems: ["provider-setup"],
      plan: {
        providerSetup: {
          filePath: "app/layout.tsx",
          nestingLevel: 0,
          rationale: "Root layout",
          confidence: 0.95,
        },
        componentRecommendations: [],
        toolRecommendations: [],
        interactableRecommendations: [],
        chatWidgetSetup: {
          position: "bottom-right",
          filePath: "app/page.tsx",
          rationale: "Standard position",
          confidence: 0.9,
        },
      },
    };

    const fileOps = await import("./file-operations.js");

    await expect(
      executeCodeChanges(confirmation, { apiKey: "sk_test" }),
    ).rejects.toThrow("agent crashed");

    // Should have cleaned up backups (not restored them)
    expect(fileOps.cleanupBackups).toHaveBeenCalled();
    expect(fileOps.restoreBackups).not.toHaveBeenCalled();
  });
});

describe("re-exports", () => {
  test("exports executeCodeChanges", async () => {
    const module = await import("./index.js");
    expect(module.executeCodeChanges).toBeDefined();
    expect(typeof module.executeCodeChanges).toBe("function");
  });

  test("re-exports verifyExecution", async () => {
    const module = await import("./index.js");
    expect(module.verifyExecution).toBeDefined();
  });

  test("re-exports formatExecutionError", async () => {
    const module = await import("./index.js");
    expect(module.formatExecutionError).toBeDefined();
  });

  test("re-exports categorizeExecutionError", async () => {
    const module = await import("./index.js");
    expect(module.categorizeExecutionError).toBeDefined();
  });

  test("re-exports writeFileAtomic", async () => {
    const module = await import("./index.js");
    expect(module.writeFileAtomic).toBeDefined();
  });

  test("re-exports installDependencies", async () => {
    const module = await import("./index.js");
    expect(module.installDependencies).toBeDefined();
  });

  test("re-exports collectDependencies", async () => {
    const module = await import("./index.js");
    expect(module.collectDependencies).toBeDefined();
  });
});
