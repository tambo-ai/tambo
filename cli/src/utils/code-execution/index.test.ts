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
jest.unstable_mockModule("node:child_process", () => ({
  execSync: mockExecSync,
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
        maxToolRounds: 20,
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

    // Should register 3 tools (readFile, writeFile, listFiles)
    expect(mockRegistry.register).toHaveBeenCalledTimes(3);
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

    expect(mockExecSync).toHaveBeenCalledWith(
      "npx tambo add message-thread-full --yes",
      expect.objectContaining({ stdio: "pipe" }),
    );
    // Execution prompt should include chatWidgetInstalled = true
    expect(mockBuildExecutionPrompt).toHaveBeenCalledWith(
      confirmation.plan,
      confirmation.selectedItems,
      true,
    );
  });

  test("falls back gracefully when chat widget pre-install fails", async () => {
    mockExecSync.mockImplementation(() => {
      throw new Error("tambo add failed");
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
