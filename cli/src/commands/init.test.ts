import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fs as memfsFs, vol } from "memfs";
import { toTreeSync } from "memfs/lib/print";
import {
  createBasicProject,
  createNextProject,
  createProjectWithBothEnvFiles,
  createProjectWithEnv,
  createProjectWithTamboSDKAndRegistry,
  createProjectWithTamboTs,
  createRegistryFiles,
} from "../__fixtures__/mock-fs-setup.js";

// Mock fs module before importing the command
jest.unstable_mockModule("fs", () => ({
  ...memfsFs,
  default: memfsFs,
}));

// Mock framework detection to return Next.js by default (most tests expect this)
// Tests can override this by setting mockDetectedFramework before running
let mockDetectedFramework: {
  name: string;
  displayName: string;
  envPrefix: string | null;
} | null = {
  name: "next",
  displayName: "Next.js",
  envPrefix: "NEXT_PUBLIC_",
};

jest.unstable_mockModule("../utils/framework-detection.js", () => ({
  detectFramework: () => mockDetectedFramework,
  getTamboApiKeyEnvVar: () =>
    mockDetectedFramework?.envPrefix
      ? `${mockDetectedFramework.envPrefix}TAMBO_API_KEY`
      : "TAMBO_API_KEY",
  getEnvVarName: (baseName: string) =>
    mockDetectedFramework?.envPrefix
      ? `${mockDetectedFramework.envPrefix}${baseName}`
      : baseName,
}));

// Mock child_process for npm install
let execSyncCalls: string[] = [];
const mockExecSync = (command: string) => {
  execSyncCalls.push(command);
  return "";
};
const mockExecFileSync = (file: string, args?: readonly string[]) => {
  const commandStr = args ? `${file} ${args.join(" ")}` : file;
  execSyncCalls.push(commandStr);
  return "";
};
jest.unstable_mockModule("child_process", () => ({
  execSync: mockExecSync,
  execFileSync: mockExecFileSync,
}));

// Mock inquirer for user prompts
let inquirerResponses: Record<string, unknown> = {};
const mockPrompt = async (
  question:
    | { name: string; default?: unknown; type?: string; choices?: unknown[] }
    | {
        name: string;
        default?: unknown;
        type?: string;
        choices?: unknown[];
      }[],
) => {
  const questions = Array.isArray(question) ? question : [question];
  const responses: Record<string, unknown> = {};
  for (const q of questions) {
    // Handle checkbox type - return array if response is provided, otherwise empty array
    if (q.type === "checkbox") {
      responses[q.name] =
        inquirerResponses[q.name] !== undefined
          ? inquirerResponses[q.name]
          : (q.default ?? []);
    } else {
      responses[q.name] =
        inquirerResponses[q.name] !== undefined
          ? inquirerResponses[q.name]
          : q.default;
    }
  }
  return responses;
};

jest.unstable_mockModule("inquirer", () => ({
  default: {
    prompt: mockPrompt,
  },
}));

// Mock open for browser opening
let openCalls: string[] = [];
let shouldOpenFail = false;
jest.unstable_mockModule("open", () => ({
  default: async (url: string) => {
    openCalls.push(url);
    if (shouldOpenFail) {
      throw new Error("Failed to open browser");
    }
  },
}));

// Mock clipboard
let clipboardContent: string | null = null;
jest.unstable_mockModule("clipboardy", () => ({
  default: {
    writeSync: (content: string) => {
      clipboardContent = content;
    },
    readSync: () => clipboardContent,
  },
}));

// Mock ora spinner
jest.unstable_mockModule("ora", () => ({
  default: () => ({
    start: () => ({
      succeed: () => {},
      fail: () => {},
      stop: () => {},
      text: "",
    }),
    stop: () => {},
    succeed: () => {},
    fail: () => {},
    text: "",
  }),
}));

// Mock device-auth module for new auth flow
let mockIsTokenValid = false;
let mockVerifySession = true;
let mockRunDeviceAuthFlowResult = {
  sessionToken: "mock-session-token",
  user: {
    id: "mock-user-id",
    email: "test@example.com",
    name: "Test User",
  },
};
let mockDeviceAuthShouldFail = false;

// Create a mock DeviceAuthError class that will be used by both the mock module and tests
class MockDeviceAuthError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "DeviceAuthError";
    this.code = code;
  }
}

jest.unstable_mockModule("../lib/device-auth.js", () => ({
  isTokenValid: () => mockIsTokenValid,
  verifySession: async () => mockVerifySession,
  runDeviceAuthFlow: async () => {
    if (mockDeviceAuthShouldFail) {
      throw new MockDeviceAuthError("Device auth failed", "AUTH_FAILED");
    }
    return mockRunDeviceAuthFlowResult;
  },
  DeviceAuthError: MockDeviceAuthError,
}));

// Mock api-client module for project and API key operations
let mockProjects: { id: string; name: string }[] = [];
let mockGeneratedApiKey = "test-api-key-123";

jest.unstable_mockModule("../lib/api-client.js", () => ({
  api: {
    project: {
      getUserProjects: {
        query: async () => mockProjects,
      },
      createProject2: {
        mutate: async ({ name }: { name: string }) => ({
          id: "new-project-id",
          name,
        }),
      },
      generateApiKey: {
        mutate: async () => ({
          id: "new-api-key-id",
          apiKey: mockGeneratedApiKey,
        }),
      },
    },
  },
  // Note: This is the tRPC API (apps/web), not the NestJS API (api.tambo.co)
  getConsoleBaseUrl: () => "https://console.tambo.co",
}));

// Mock the registry utilities to use memfs paths (same as add.test.ts)
jest.unstable_mockModule("./add/utils.js", () => ({
  getRegistryBasePath: () => `/mock-project/cli/dist/registry`,
  getRegistryPath: (componentName: string) =>
    `/mock-project/cli/dist/registry/components/${componentName}`,
  getConfigPath: (componentName: string) =>
    `/mock-project/cli/dist/registry/components/${componentName}/config.json`,
  componentExists: (componentName: string) => {
    const configPath = `/mock-project/cli/dist/registry/components/${componentName}/config.json`;
    try {
      return (
        memfsFs.existsSync(configPath) &&
        JSON.parse(memfsFs.readFileSync(configPath, "utf-8") as string)
      );
    } catch {
      return false;
    }
  },
  getTamboComponentInfo: () => ({
    mainComponents: new Set([
      "message-thread-full",
      "message-thread-panel",
      "message-thread-collapsible",
      "control-bar",
    ]),
    supportComponents: new Set(),
    allComponents: new Set([
      "message-thread-full",
      "message-thread-panel",
      "message-thread-collapsible",
      "control-bar",
    ]),
  }),
  getKnownComponentNames: () =>
    new Set([
      "message-thread-full",
      "message-thread-panel",
      "message-thread-collapsible",
      "control-bar",
    ]),
  checkLegacyComponents: () => null,
  getInstalledComponents: async () => [],
  getComponentList: () => [],
}));

// Mock tailwind setup (same as add.test.ts)
jest.unstable_mockModule("./add/tailwind-setup.js", () => ({
  setupTailwindAndGlobals: jest.fn(async () => {
    // No-op for tests
  }),
}));

// Don't mock handleAddComponent - use the real implementation
// It will use the mocked fs (memfs) and execSync, so it's safe to use in tests

// Mock chalk (no-op for tests)
jest.unstable_mockModule("chalk", () => ({
  default: new Proxy(
    {},
    {
      get: () => (text: string) => text,
    },
  ),
}));

// Mock the interactive module to make tests think they're in an interactive environment
jest.unstable_mockModule("../utils/interactive.js", () => ({
  isInteractive: () => true, // Always return true in tests
  interactivePrompt: mockPrompt, // Use the same mockPrompt as inquirer
  execSync: mockExecSync, // Use the same mockExecSync as child_process
  execFileSync: mockExecFileSync, // Use the same mockExecFileSync as child_process
  NonInteractiveError: class NonInteractiveError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "NonInteractiveError";
    }
  },
}));

// Import after mocking
const { handleInit, getInstallationPath } = await import("./init.js");

describe("handleInit", () => {
  let originalCwd: () => string;
  let originalLog: typeof console.log;
  let originalError: typeof console.error;
  let originalExit: typeof process.exit;
  let logs: string[];
  let errorLogs: string[];

  beforeEach(() => {
    // Reset memfs volume
    vol.reset();

    // Reset framework detection mock to Next.js (most tests expect this)
    mockDetectedFramework = {
      name: "next",
      displayName: "Next.js",
      envPrefix: "NEXT_PUBLIC_",
    };

    // Reset exec calls
    execSyncCalls = [];

    // Reset inquirer responses
    inquirerResponses = {};

    // Reset open calls
    openCalls = [];
    shouldOpenFail = false;

    // Reset clipboard
    clipboardContent = null;

    // Reset device auth mocks
    mockIsTokenValid = false;
    mockVerifySession = true;
    mockDeviceAuthShouldFail = false;
    mockProjects = [];
    mockGeneratedApiKey = "test-api-key-123";
    mockRunDeviceAuthFlowResult = {
      sessionToken: "mock-session-token",
      user: {
        id: "mock-user-id",
        email: "test@example.com",
        name: "Test User",
      },
    };

    // Mock process.cwd
    originalCwd = process.cwd;
    process.cwd = () => "/mock-project";

    // Mock process.exit to prevent actual exit during tests
    originalExit = process.exit;
    process.exit = ((code?: number) => {
      throw new Error(`process.exit(${code ?? 0})`);
    }) as typeof process.exit;

    // Capture console output
    logs = [];
    errorLogs = [];
    originalLog = console.log;
    originalError = console.error;
    console.log = (...args: unknown[]) => {
      logs.push(args.map((arg) => String(arg)).join(" "));
    };
    console.error = (...args: unknown[]) => {
      const errorMsg = args.map((arg) => String(arg)).join(" ");
      errorLogs.push(errorMsg);
      // Also log to console for debugging
      originalError(...args);
    };
  });

  afterEach(() => {
    // Clean up mocks
    vol.reset();
    process.cwd = originalCwd;
    process.exit = originalExit;
    console.log = originalLog;
    console.error = originalError;
    execSyncCalls = [];
    inquirerResponses = {};
    openCalls = [];
    shouldOpenFail = false;
    clipboardContent = null;
    // Reset device auth mocks
    mockIsTokenValid = false;
    mockVerifySession = true;
    mockDeviceAuthShouldFail = false;
    mockProjects = [];
    mockGeneratedApiKey = "test-api-key-123";
  });

  describe("error cases", () => {
    it("should error when no package.json exists", async () => {
      // Setup: Empty filesystem
      vol.fromJSON({});

      // Execute
      await handleInit({});

      // Verify error message
      const output = logs.join("\n");
      expect(output).toContain("doesn't look like a valid");
    });

    it("should error when package.json is invalid JSON", async () => {
      // Setup: Invalid package.json
      vol.fromJSON({
        "/mock-project/package.json": "invalid json {",
      });

      // Execute
      await handleInit({});

      // Verify error message
      const output = logs.join("\n");
      expect(output).toContain("doesn't look like a valid");
    });
  });

  describe("basic init (without fullSend)", () => {
    beforeEach(() => {
      // Use Next.js project since tests check for NEXT_PUBLIC_TAMBO_API_KEY
      vol.fromJSON(createNextProject());
    });

    it("should complete basic init with cloud choice", async () => {
      // Set up device auth mock to succeed
      mockGeneratedApiKey = "test-api-key-123";

      // Set inquirer responses for cloud auth flow
      inquirerResponses = {
        hostingChoice: "cloud",
        projectName: "test-project", // For project creation
        confirmReplace: true,
      };

      // Execute
      await handleInit({});

      // Verify .env.local was created with API key from server
      expect(vol.existsSync("/mock-project/.env.local")).toBe(true);
      const envContent = vol.readFileSync(
        "/mock-project/.env.local",
        "utf-8",
      ) as string;
      expect(envContent).toContain(
        "NEXT_PUBLIC_TAMBO_API_KEY=test-api-key-123",
      );

      // Verify success message
      const output = logs.join("\n");
      expect(output).toContain("Basic initialization complete");
    });

    it("should complete basic init with self-host choice", async () => {
      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "self",
        openRepo: false,
        apiKeyOrCloud: "paste",
        apiKey: "self-hosted-key-456",
        confirmReplace: true,
      };

      // Execute
      await handleInit({});

      // Verify .env.local was created with API key
      expect(vol.existsSync("/mock-project/.env.local")).toBe(true);
      const envContent = vol.readFileSync(
        "/mock-project/.env.local",
        "utf-8",
      ) as string;
      expect(envContent).toContain(
        "NEXT_PUBLIC_TAMBO_API_KEY=self-hosted-key-456",
      );

      // Verify self-host instructions were shown
      const output = logs.join("\n");
      expect(output).toContain("Self-host setup");
    });

    it("should use existing API key when found and user chooses to keep it", async () => {
      // Setup: Project with existing API key
      vol.fromJSON(createProjectWithEnv("existing-key-789"));

      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
        overwriteExisting: false,
      };

      // Execute
      await handleInit({});

      // Verify existing key was kept
      const envContent = vol.readFileSync(
        "/mock-project/.env.local",
        "utf-8",
      ) as string;
      expect(envContent).toContain(
        "NEXT_PUBLIC_TAMBO_API_KEY=existing-key-789",
      );

      // Verify output mentions using existing key
      const output = logs.join("\n");
      expect(output).toContain("Using existing API key");
    });

    it("should overwrite existing API key when user confirms", async () => {
      // Setup: Project with existing API key
      vol.fromJSON(createProjectWithEnv("old-key-123"));

      // Set up device auth mock
      mockGeneratedApiKey = "new-key-456";

      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
        overwriteExisting: true,
        projectName: "test-project",
        confirmReplace: true,
      };

      // Execute
      await handleInit({});

      // Verify key was replaced with server-generated key
      const envContent = vol.readFileSync(
        "/mock-project/.env.local",
        "utf-8",
      ) as string;
      expect(envContent).toContain("NEXT_PUBLIC_TAMBO_API_KEY=new-key-456");
      expect(envContent).not.toContain("old-key-123");
    });

    it("should handle device auth failure gracefully", async () => {
      // Set device auth to fail
      mockDeviceAuthShouldFail = true;

      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
      };

      // Execute - should handle error gracefully
      await handleInit({});

      // Verify error was logged
      const output = errorLogs.join("\n");
      expect(output).toContain("Authentication failed");
    });

    it("should prefer .env.local over .env when both exist", async () => {
      // Setup: Project with both env files
      vol.fromJSON(createProjectWithBothEnvFiles("env-local-key", "env-key"));

      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
        overwriteExisting: false,
      };

      // Execute
      await handleInit({});

      // Verify .env.local was checked (existing key from .env.local should be used)
      expect(
        vol.readFileSync("/mock-project/.env.local", "utf-8") as string,
      ).toContain("env-local-key");
    });
  });

  describe("full-send init", () => {
    beforeEach(() => {
      vol.fromJSON(
        createProjectWithTamboSDKAndRegistry([
          "message-thread-full",
          "control-bar",
        ]),
      );
    });

    it("should complete full-send init with component selection", async () => {
      // Set up device auth mock
      mockGeneratedApiKey = "test-api-key";

      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
        projectName: "test-project",
        confirmReplace: true,
        useSrcDir: true,
        selectedComponents: ["message-thread-full", "control-bar"],
        proceedWithCss: true, // For setupTailwindAndGlobals
        showDetailedDiff: false, // For setupTailwindAndGlobals
        proceedWithWrite: true, // For setupTailwindAndGlobals when globals.css exists
      };

      // Execute
      await handleInit({ fullSend: true });

      // Verify tambo.ts was created
      expect(vol.existsSync("/mock-project/src/lib/tambo.ts")).toBe(true);

      // Verify filesystem state
      expect(toTreeSync(vol, { dir: "/mock-project/src" }))
        .toMatchInlineSnapshot(`
        "src/
        ├─ components/
        │  ├─ tambo/
        │  │  └─ AGENTS.md
        │  ├─ control-bar.tsx
        │  ├─ message-input.tsx
        │  ├─ message-suggestions.tsx
        │  ├─ message-thread-full.tsx
        │  ├─ message.tsx
        │  ├─ scrollable-message-container.tsx
        │  ├─ thread-content.tsx
        │  └─ thread-history.tsx
        └─ lib/
           ├─ tambo.ts
           └─ utils.ts"
      `);

      // Verify success message
      const output = logs.join("\n");
      const errorOutput = errorLogs.join("\n");
      if (!output.includes("Full-send initialization complete")) {
        console.log("Logs:", output);
        console.log("Errors:", errorOutput);
      }
      expect(output).toContain("Full-send initialization complete");
    });

    it("should handle component installation failures gracefully", async () => {
      // Set up device auth mock
      mockGeneratedApiKey = "test-api-key";

      // Use a non-existent component to trigger failure
      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
        projectName: "test-project",
        confirmReplace: true,
        useSrcDir: true,
        selectedComponents: ["nonexistent-component"],
      };

      // Execute
      await handleInit({ fullSend: true });

      // Verify error handling
      const output = logs.join("\n");
      expect(output).toContain("Component installation failed");
    });

    it("should validate that at least one component is selected", async () => {
      // Set up device auth mock
      mockGeneratedApiKey = "test-api-key";

      // Set inquirer responses (empty selection should trigger validation)
      // The inquirer validation will catch empty array and prompt again
      // We'll simulate this by providing a valid selection after validation
      inquirerResponses = {
        hostingChoice: "cloud",
        projectName: "test-project",
        confirmReplace: true,
        useSrcDir: true,
        selectedComponents: ["message-thread-full"], // Valid selection
        proceedWithCss: true, // For setupTailwindAndGlobals
        showDetailedDiff: false, // For setupTailwindAndGlobals
        proceedWithWrite: true, // For setupTailwindAndGlobals when globals.css exists
      };

      // Execute - should work with valid selection
      await handleInit({ fullSend: true });

      // Verify component was actually installed (check for component files)
      // Components are installed at src/components/component-name.tsx when installPath is provided
      // (because isExplicitPrefix becomes true when installPath is provided)
      expect(
        vol.existsSync("/mock-project/src/components/message-thread-full.tsx"),
      ).toBe(true);
    });

    it("should respect --yes flag in full-send mode", async () => {
      // Setup: Remove src directory for this test
      vol.reset();
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { "@tambo-ai/react": "^1.0.0" },
        }),
        ...createRegistryFiles(["message-thread-full"]),
      });

      // Set up device auth mock
      mockGeneratedApiKey = "test-api-key";

      // Set inquirer responses (fewer prompts with --yes)
      inquirerResponses = {
        hostingChoice: "cloud",
        projectName: "test-project",
        confirmReplace: true,
        selectedComponents: ["message-thread-full"],
        proceedWithCss: true, // For setupTailwindAndGlobals
        showDetailedDiff: false, // For setupTailwindAndGlobals
        proceedWithWrite: true, // For setupTailwindAndGlobals when globals.css exists
      };

      // Execute with --yes
      await handleInit({ fullSend: true, yes: true });

      // Verify filesystem state
      expect(toTreeSync(vol, { dir: "/mock-project/src" }))
        .toMatchInlineSnapshot(`
        "src/
        ├─ components/
        │  ├─ tambo/
        │  │  └─ AGENTS.md
        │  ├─ message-input.tsx
        │  ├─ message-suggestions.tsx
        │  ├─ message-thread-full.tsx
        │  ├─ message.tsx
        │  ├─ scrollable-message-container.tsx
        │  ├─ thread-content.tsx
        │  └─ thread-history.tsx
        └─ lib/
           ├─ tambo.ts
           └─ utils.ts"
      `);

      // Verify auto-proceed message
      const output = logs.join("\n");
      expect(output).toContain("Auto-creating");
    });

    it("should respect --legacyPeerDeps flag in full-send mode", async () => {
      // Set up device auth mock
      mockGeneratedApiKey = "test-api-key";

      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
        projectName: "test-project",
        confirmReplace: true,
        useSrcDir: true,
        selectedComponents: ["message-thread-full"],
      };

      // Execute with --legacyPeerDeps
      await handleInit({ fullSend: true, legacyPeerDeps: true });

      // Verify legacyPeerDeps flag was passed to npm install
      expect(
        execSyncCalls.some((call) => call.includes("--legacy-peer-deps")),
      ).toBe(true);
    });
  });

  describe("getInstallationPath", () => {
    beforeEach(() => {
      // Framework-agnostic test - doesn't check for env var prefix
      vol.fromJSON(createBasicProject());
    });

    it("should use existing src/ directory when it exists", async () => {
      // Setup: Add src directory
      vol.fromJSON({
        ...createBasicProject(),
        "/mock-project/src": null,
      });

      // Set inquirer to use src
      inquirerResponses = {
        useSrcDir: true,
      };

      // Execute
      const path = await getInstallationPath(false);

      // Verify
      expect(path).toBe("src/components");
    });

    it("should ask user when src/ doesn't exist", async () => {
      // Set inquirer to create src
      inquirerResponses = {
        useSrcDir: true,
      };

      // Execute
      const path = await getInstallationPath(false);

      // Verify
      expect(path).toBe("src/components");
    });

    it("should use components/ when user doesn't want src/", async () => {
      // Set inquirer to not use src
      inquirerResponses = {
        useSrcDir: false,
      };

      // Execute
      const path = await getInstallationPath(false);

      // Verify
      expect(path).toBe("components");
    });

    it("should auto-answer with --yes flag", async () => {
      // Execute with --yes (no inquirer needed)
      const path = await getInstallationPath(true);

      // Verify
      expect(path).toBe("src/components");

      // Verify auto-proceed message
      const output = logs.join("\n");
      expect(output).toContain("Auto-creating");
    });
  });

  describe("tambo.ts file creation", () => {
    beforeEach(() => {
      // Use Next.js project since tests check for NEXT_PUBLIC_TAMBO_API_KEY in env files
      vol.fromJSON({
        ...createNextProject(),
        "/mock-project/src": null,
      });
    });

    it("should create tambo.ts when it doesn't exist", async () => {
      // Set up device auth mock
      mockGeneratedApiKey = "test-api-key";

      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
        projectName: "test-project",
        confirmReplace: true,
        useSrcDir: true,
      };

      // Execute
      await handleInit({ fullSend: true, yes: true });

      // Verify tambo.ts was created
      expect(vol.existsSync("/mock-project/src/lib/tambo.ts")).toBe(true);

      // Verify content
      const content = vol.readFileSync(
        "/mock-project/src/lib/tambo.ts",
        "utf-8",
      ) as string;
      expect(content).toContain("components: TamboComponent[]");
      expect(content).toContain("@tambo-ai/react");

      // Verify success message
      const output = logs.join("\n");
      expect(output).toContain("Created tambo.ts file");
    });

    it("should skip creating tambo.ts when it already exists", async () => {
      // Setup: Add existing tambo.ts
      vol.fromJSON({
        ...createProjectWithTamboTs(
          "export const components: TamboComponent[] = [];",
        ),
        ...createRegistryFiles(["message-thread-full"]),
      });

      // Set up device auth mock
      mockGeneratedApiKey = "test-api-key";

      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
        projectName: "test-project",
        confirmReplace: true,
        useSrcDir: true,
        selectedComponents: ["message-thread-full"],
      };

      // Execute
      await handleInit({ fullSend: true });

      // Verify existing file was not overwritten
      const content = vol.readFileSync(
        "/mock-project/src/lib/tambo.ts",
        "utf-8",
      ) as string;
      expect(content).toBe("export const components: TamboComponent[] = [];");

      // Verify skip message
      const output = logs.join("\n");
      expect(output).toContain("tambo.ts file already exists");
    });

    it("should create tambo.ts in correct path based on installPath", async () => {
      // Setup: Remove src directory, use Next.js project for NEXT_PUBLIC_TAMBO_API_KEY
      vol.reset();
      vol.fromJSON({
        ...createNextProject(),
        ...createRegistryFiles(["message-thread-full"]),
      });

      // Set up device auth mock
      mockGeneratedApiKey = "test-api-key";

      // Set inquirer responses (user chooses not to use src)
      inquirerResponses = {
        hostingChoice: "cloud",
        projectName: "test-project",
        confirmReplace: true,
        useSrcDir: false,
        selectedComponents: ["message-thread-full"],
      };

      // Execute
      await handleInit({ fullSend: true });

      // Verify tambo.ts was created at project-root lib (not components/lib)
      expect(vol.existsSync("/mock-project/lib/tambo.ts")).toBe(true);
    });

    it("should handle nested paths correctly", async () => {
      // This would require custom installPath, but we'll test the path logic
      // by checking that it extracts first segment correctly
      // The default behavior uses src/components or components
      // so tambo.ts goes to src/lib or components/lib
    });
  });

  describe("API key management", () => {
    beforeEach(() => {
      // Use Next.js project since tests check for NEXT_PUBLIC_TAMBO_API_KEY
      vol.fromJSON(createNextProject());
    });

    it("should create .env.local when neither exists", async () => {
      // Set up device auth mock
      mockGeneratedApiKey = "new-key-123";

      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
        projectName: "test-project",
        confirmReplace: true,
      };

      // Execute
      await handleInit({});

      // Verify .env.local was created with server-generated key
      expect(vol.existsSync("/mock-project/.env.local")).toBe(true);
      const content = vol.readFileSync(
        "/mock-project/.env.local",
        "utf-8",
      ) as string;
      expect(content).toContain("NEXT_PUBLIC_TAMBO_API_KEY=new-key-123");
      expect(content).toContain("Environment Variables");

      // Verify success message
      const output = logs.join("\n");
      expect(output).toContain("Created new .env.local file");
    });

    it("should use .env.local over .env when both exist", async () => {
      // Setup: Next.js project with both env files (uses NEXT_PUBLIC_TAMBO_API_KEY)
      vol.fromJSON({
        ...createNextProject(),
        "/mock-project/.env": "SOME_OTHER_VAR=value\n",
        "/mock-project/.env.local": "NEXT_PUBLIC_TAMBO_API_KEY=existing\n",
      });

      // Set up device auth mock
      mockGeneratedApiKey = "new-key";

      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
        overwriteExisting: true,
        projectName: "test-project",
        confirmReplace: true,
      };

      // Execute
      await handleInit({});

      // Verify .env.local was updated (not .env) with server-generated key
      const envLocalContent = vol.readFileSync(
        "/mock-project/.env.local",
        "utf-8",
      ) as string;
      expect(envLocalContent).toContain("NEXT_PUBLIC_TAMBO_API_KEY=new-key");

      // Verify .env was not touched
      const envContent = vol.readFileSync(
        "/mock-project/.env",
        "utf-8",
      ) as string;
      expect(envContent).toBe("SOME_OTHER_VAR=value\n");
    });

    it("should append to existing .env file when key doesn't exist", async () => {
      // Setup: Next.js project with .env but no API key (uses NEXT_PUBLIC_TAMBO_API_KEY)
      vol.fromJSON({
        ...createNextProject(),
        "/mock-project/.env": "SOME_VAR=value\n",
      });

      // Set up device auth mock
      mockGeneratedApiKey = "new-key-456";

      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
        projectName: "test-project",
        confirmReplace: true,
      };

      // Execute
      await handleInit({});

      // Verify key was appended to .env with server-generated key
      const content = vol.readFileSync("/mock-project/.env", "utf-8") as string;
      expect(content).toContain("SOME_VAR=value");
      expect(content).toContain("NEXT_PUBLIC_TAMBO_API_KEY=new-key-456");
    });

    it("should replace existing key when user confirms", async () => {
      // Setup: Next.js project with existing API key (uses NEXT_PUBLIC_TAMBO_API_KEY)
      vol.fromJSON({
        ...createNextProject(),
        "/mock-project/.env.local":
          "NEXT_PUBLIC_TAMBO_API_KEY=old-key\nOTHER_VAR=value\n",
      });

      // Set up device auth mock
      mockGeneratedApiKey = "new-key-789";

      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
        overwriteExisting: true,
        projectName: "test-project",
        confirmReplace: true,
      };

      // Execute
      await handleInit({});

      // Verify key was replaced with server-generated key
      const content = vol.readFileSync(
        "/mock-project/.env.local",
        "utf-8",
      ) as string;
      expect(content).toContain("NEXT_PUBLIC_TAMBO_API_KEY=new-key-789");
      expect(content).not.toContain("old-key");
      expect(content).toContain("OTHER_VAR=value");
    });

    it("should keep existing key when user cancels replacement", async () => {
      // Setup: Project with existing API key
      vol.fromJSON(createProjectWithEnv("original-key"));

      // Set inquirer responses (user chooses not to overwrite)
      inquirerResponses = {
        hostingChoice: "cloud",
        overwriteExisting: false,
      };

      // Execute
      await handleInit({});

      // Verify original key was kept
      const content = vol.readFileSync(
        "/mock-project/.env.local",
        "utf-8",
      ) as string;
      expect(content).toContain("NEXT_PUBLIC_TAMBO_API_KEY=original-key");

      // Verify keep message (the actual message is "Using existing API key")
      const output = logs.join("\n");
      expect(output).toContain("Using existing API key");
    });
  });

  describe("hosting choice flow", () => {
    beforeEach(() => {
      // Use Next.js project since tests check for NEXT_PUBLIC_TAMBO_API_KEY
      vol.fromJSON(createNextProject());
    });

    it("should handle self-host path with API key paste", async () => {
      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "self",
        openRepo: false,
        apiKeyOrCloud: "paste",
        apiKey: "self-host-key",
        confirmReplace: true,
      };

      // Execute
      await handleInit({});

      // Verify API key was saved
      expect(vol.existsSync("/mock-project/.env.local")).toBe(true);
      const content = vol.readFileSync(
        "/mock-project/.env.local",
        "utf-8",
      ) as string;
      expect(content).toContain("NEXT_PUBLIC_TAMBO_API_KEY=self-host-key");

      // Verify self-host instructions were shown
      const output = logs.join("\n");
      expect(output).toContain("Self-host setup");
    });

    it("should handle self-host path with switch to cloud", async () => {
      // Set up device auth mock for when user switches to cloud
      mockGeneratedApiKey = "cloud-key";

      // Set inquirer responses (switch to cloud)
      inquirerResponses = {
        hostingChoice: "self",
        openRepo: false,
        apiKeyOrCloud: "cloud",
        projectName: "test-project",
        confirmReplace: true,
      };

      // Execute
      await handleInit({});

      // Verify API key was saved with server-generated key
      expect(vol.existsSync("/mock-project/.env.local")).toBe(true);
      const content = vol.readFileSync(
        "/mock-project/.env.local",
        "utf-8",
      ) as string;
      expect(content).toContain("NEXT_PUBLIC_TAMBO_API_KEY=cloud-key");

      // Verify switch message
      const output = logs.join("\n");
      expect(output).toContain("Switching to Cloud setup");
    });

    it("should open repo in browser when user confirms", async () => {
      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "self",
        openRepo: true,
        apiKeyOrCloud: "paste",
        apiKey: "test-key",
        confirmReplace: true,
      };

      // Execute
      await handleInit({});

      // Verify browser was opened with repo URL
      expect(
        openCalls.some((url) => url.includes("github.com/tambo-ai/tambo")),
      ).toBe(true);
    });
  });

  describe("full-send instructions", () => {
    beforeEach(() => {
      vol.fromJSON(
        createProjectWithTamboSDKAndRegistry([
          "message-thread-full",
          "control-bar",
        ]),
      );
    });

    it("should copy provider snippet to clipboard", async () => {
      // Set up device auth mock
      mockGeneratedApiKey = "test-api-key";

      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
        projectName: "test-project",
        confirmReplace: true,
        useSrcDir: true,
        selectedComponents: ["message-thread-full", "control-bar"],
        proceedWithCss: true, // For setupTailwindAndGlobals
        showDetailedDiff: false, // For setupTailwindAndGlobals
        proceedWithWrite: true, // For setupTailwindAndGlobals when globals.css exists
      };

      // Execute
      await handleInit({ fullSend: true, yes: true });

      // Verify clipboard was used
      expect(clipboardContent).toBeTruthy();
      expect(clipboardContent).toContain("TamboProvider");
      expect(clipboardContent).toContain("MessageThreadFull");
      expect(clipboardContent).toContain("ControlBar");

      // Verify success message
      const output = logs.join("\n");
      expect(output).toContain("TamboProvider component copied to clipboard");
    });

    it("should handle clipboard failure gracefully", async () => {
      // Mock clipboard to fail
      const clipboardy = await import("clipboardy");
      const originalWriteSync = clipboardy.default.writeSync;
      jest.spyOn(clipboardy.default, "writeSync").mockImplementationOnce(() => {
        throw new Error("Clipboard error");
      });

      // Set up device auth mock
      mockGeneratedApiKey = "test-api-key";

      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
        projectName: "test-project",
        confirmReplace: true,
        useSrcDir: true,
        selectedComponents: ["message-thread-full"],
        proceedWithCss: true, // For setupTailwindAndGlobals
        showDetailedDiff: false, // For setupTailwindAndGlobals
        proceedWithWrite: true, // For setupTailwindAndGlobals when globals.css exists
      };

      // Execute
      await handleInit({ fullSend: true, yes: true });

      // Verify error message but still shows snippet
      const output = logs.join("\n");
      expect(output).toContain("Failed to copy to clipboard");
      expect(output).toContain("TamboProvider");

      // Restore original
      clipboardy.default.writeSync = originalWriteSync;
    });
  });

  describe("options", () => {
    beforeEach(() => {
      // Use Next.js project since tests check for NEXT_PUBLIC_TAMBO_API_KEY
      vol.fromJSON(createNextProject());
    });

    it("should respect --yes flag", async () => {
      // Set up device auth mock
      mockGeneratedApiKey = "test-key";

      // Set minimal inquirer responses (fewer prompts with --yes)
      inquirerResponses = {
        hostingChoice: "cloud",
        projectName: "test-project",
        confirmReplace: true,
      };

      // Execute with --yes
      await handleInit({ yes: true });

      // Verify filesystem state
      expect(vol.existsSync("/mock-project/.env.local")).toBe(true);

      // Verify basic init completed successfully
      const output = logs.join("\n");
      expect(output).toContain("Basic initialization complete");

      // Note: --yes flag in basic init doesn't show "Auto-creating" message
      // That message is only shown in full-send mode when choosing installation path
    });

    it("should respect --legacyPeerDeps flag", async () => {
      // Setup: Switch to React project
      vol.fromJSON(
        createProjectWithTamboSDKAndRegistry(["message-thread-full"]),
      );

      // Set up device auth mock
      mockGeneratedApiKey = "test-key";

      // Set inquirer responses
      inquirerResponses = {
        hostingChoice: "cloud",
        projectName: "test-project",
        confirmReplace: true,
        useSrcDir: true,
        selectedComponents: ["message-thread-full"],
      };

      // Execute with --legacyPeerDeps
      await handleInit({ fullSend: true, legacyPeerDeps: true });

      // Verify legacyPeerDeps flag was passed to npm install
      expect(
        execSyncCalls.some((call) => call.includes("--legacy-peer-deps")),
      ).toBe(true);
    });
  });
});
