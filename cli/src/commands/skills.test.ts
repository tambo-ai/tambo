import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

// ============================================================================
// Mutable mock state
// ============================================================================

let mockHasStoredToken = false;
let mockIsTokenValid = false;

jest.unstable_mockModule("../lib/token-storage.js", () => ({
  hasStoredToken: () => mockHasStoredToken,
  isTokenValid: () => mockIsTokenValid,
  loadToken: () => null,
  getCurrentUser: () => null,
  clearToken: () => {},
  getTokenStoragePath: () => "/mock/.tambo/token.json",
}));

// Mock skills API responses
let mockSkillsList: {
  id: string;
  name: string;
  description: string;
  instructions: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}[] = [];
let mockResolvedProjectId = "proj_123";
let mockApiError: Error | null = null;
let mockCreateError: Error | null = null;
let mockDeleteError: Error | null = null;

jest.unstable_mockModule("../lib/api-client.js", () => ({
  api: {
    project: {
      resolveProjectFromApiKey: {
        mutate: async () => {
          if (mockApiError) throw mockApiError;
          return { projectId: mockResolvedProjectId };
        },
      },
    },
    skills: {
      list: {
        query: async () => {
          if (mockApiError) throw mockApiError;
          return mockSkillsList;
        },
      },
      create: {
        mutate: async (input: { name: string }) => {
          if (mockCreateError) throw mockCreateError;
          return {
            id: `sk_new_${input.name}`,
            ...input,
            enabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        },
      },
      update: {
        mutate: async (input: { skillId: string; name?: string }) => {
          if (mockApiError) throw mockApiError;
          return {
            id: input.skillId,
            ...input,
            enabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        },
      },
      delete: {
        mutate: async () => {
          if (mockDeleteError) throw mockDeleteError;
        },
      },
    },
  },
  isAuthError: (error: unknown) => {
    return error instanceof Error && error.message === "UNAUTHORIZED";
  },
}));

// Mock fs
let mockFiles: Record<string, string> = {};
jest.unstable_mockModule("fs", () => ({
  default: {
    existsSync: (path: string) => path in mockFiles,
    readFileSync: (path: string) => {
      if (!(path in mockFiles)) throw new Error(`ENOENT: ${path}`);
      return mockFiles[path];
    },
  },
}));

// Mock inquirer prompts
let mockConfirmResult = true;
jest.unstable_mockModule("@inquirer/prompts", () => ({
  confirm: async () => mockConfirmResult,
}));

// Mock interactive utilities
let mockIsInteractive = true;
jest.unstable_mockModule("../utils/interactive.js", () => ({
  isInteractive: () => mockIsInteractive,
  GuidanceError: class GuidanceError extends Error {
    guidance: string[];
    constructor(message: string, guidance: string[]) {
      super(message);
      this.name = "GuidanceError";
      this.guidance = guidance;
    }
  },
}));

// Mock dotenv-utils
let mockEnvApiKey: string | null = null;
jest.unstable_mockModule("../utils/dotenv-utils.js", () => ({
  findTamboApiKey: () =>
    mockEnvApiKey
      ? { keyName: "NEXT_PUBLIC_TAMBO_API_KEY", value: mockEnvApiKey }
      : null,
}));

// Mock telemetry
jest.unstable_mockModule("../lib/telemetry.js", () => ({
  EVENTS: { COMMAND_COMPLETED: "cli.command.completed" },
  trackEvent: () => {},
}));

// Mock ora spinner
jest.unstable_mockModule("ora", () => ({
  default: () => ({
    start: function () {
      return this;
    },
    succeed: function () {
      return this;
    },
    fail: function () {
      return this;
    },
    stop: function () {
      return this;
    },
    text: "",
  }),
}));

// Mock chalk (pass through)
jest.unstable_mockModule("chalk", () => ({
  default: new Proxy(
    {},
    {
      get: () => {
        const fn = (text: string) => text;
        return new Proxy(fn, {
          get: () => fn,
        });
      },
    },
  ),
}));

// Mock cli-table3
jest.unstable_mockModule("cli-table3", () => ({
  default: class MockTable {
    rows: string[][] = [];
    push(...rows: string[][]) {
      this.rows.push(...rows);
    }
    toString() {
      return this.rows.map((r) => r.join(" | ")).join("\n");
    }
  },
}));

// Import after mocking
const { handleSkills } = await import("./skills.js");

// ============================================================================
// Tests
// ============================================================================

describe("skills commands", () => {
  let consoleLogs: string[] = [];
  let consoleErrors: string[] = [];
  let stdoutWrites: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalStdoutWrite = process.stdout.write;
  const originalExit = process.exit;

  beforeEach(() => {
    // Reset all mock state
    mockHasStoredToken = true;
    mockIsTokenValid = true;
    mockEnvApiKey = "tambo_test_key";
    mockResolvedProjectId = "proj_123";
    mockApiError = null;
    mockCreateError = null;
    mockDeleteError = null;
    mockSkillsList = [];
    mockFiles = {
      ".env.local": "NEXT_PUBLIC_TAMBO_API_KEY=tambo_test_key",
    };
    mockConfirmResult = true;
    mockIsInteractive = true;

    consoleLogs = [];
    consoleErrors = [];
    stdoutWrites = [];
    console.log = (...args: unknown[]) => {
      consoleLogs.push(args.join(" "));
    };
    console.error = (...args: unknown[]) => {
      consoleErrors.push(args.join(" "));
    };
    process.stdout.write = ((data: string) => {
      stdoutWrites.push(data);
      return true;
    }) as typeof process.stdout.write;
    // Prevent process.exit from actually exiting
    process.exit = (() => {
      throw new Error("process.exit called");
    }) as never;
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    process.stdout.write = originalStdoutWrite;
    process.exit = originalExit;
  });

  // --------------------------------------------------------------------------
  // Help
  // --------------------------------------------------------------------------

  describe("help", () => {
    it("shows help when no subcommand is given", async () => {
      await handleSkills(undefined, [], {});
      expect(consoleLogs.some((l) => l.includes("tambo skills"))).toBe(true);
    });

    it("shows help for 'help' subcommand", async () => {
      await handleSkills("help", [], {});
      expect(consoleLogs.some((l) => l.includes("tambo skills"))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Project resolution errors
  // --------------------------------------------------------------------------

  describe("project resolution", () => {
    it("fails when both API key and session are missing", async () => {
      mockHasStoredToken = false;
      mockIsTokenValid = false;
      mockFiles = {};

      await expect(handleSkills("list", [], {})).rejects.toThrow(
        "process.exit",
      );

      expect(consoleErrors.some((l) => l.includes("resolve project"))).toBe(
        true,
      );
    });

    it("fails when session token is missing", async () => {
      mockHasStoredToken = false;
      mockIsTokenValid = false;

      await expect(handleSkills("list", [], {})).rejects.toThrow(
        "process.exit",
      );

      expect(consoleErrors.some((l) => l.includes("authenticated"))).toBe(true);
    });

    it("fails when API key is missing", async () => {
      mockFiles = {};

      await expect(handleSkills("list", [], {})).rejects.toThrow(
        "process.exit",
      );

      expect(consoleErrors.some((l) => l.includes("API key"))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // List
  // --------------------------------------------------------------------------

  describe("list", () => {
    it("shows empty state when no skills exist", async () => {
      mockSkillsList = [];
      await handleSkills("list", [], {});
      expect(consoleLogs.some((l) => l.includes("No skills found"))).toBe(true);
    });

    it("shows skills in a table", async () => {
      mockSkillsList = [
        {
          id: "sk_1",
          name: "my-skill",
          description: "A test skill",
          instructions: "Do things",
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      await handleSkills("list", [], {});
      expect(consoleLogs.some((l) => l.includes("my-skill"))).toBe(true);
    });

    it("truncates long descriptions", async () => {
      mockSkillsList = [
        {
          id: "sk_1",
          name: "my-skill",
          description: "A".repeat(50),
          instructions: "Do things",
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      await handleSkills("list", [], {});
      expect(consoleLogs.some((l) => l.includes("..."))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Add
  // --------------------------------------------------------------------------

  describe("add", () => {
    it("fails when no files specified", async () => {
      await expect(handleSkills("add", [], {})).rejects.toThrow("process.exit");
      expect(consoleErrors.some((l) => l.includes("No files"))).toBe(true);
    });

    it("creates a skill from a valid file", async () => {
      mockFiles["skill.md"] =
        "---\nname: test-skill\ndescription: A test\n---\nInstructions here";
      await handleSkills("add", ["skill.md"], {});
      // Should not throw (exit code 0)
      expect(consoleLogs.join(" ")).not.toContain("failed");
    });

    it("handles file not found", async () => {
      await expect(handleSkills("add", ["missing.md"], {})).rejects.toThrow(
        "process.exit",
      );
    });

    it("handles invalid frontmatter", async () => {
      mockFiles["bad.md"] = "no frontmatter here";
      await expect(handleSkills("add", ["bad.md"], {})).rejects.toThrow(
        "process.exit",
      );
    });

    it("handles name conflict error", async () => {
      mockFiles["skill.md"] =
        "---\nname: existing\ndescription: A test\n---\nInstructions";
      const conflictError = new Error("CONFLICT") as Error & {
        data: { code: string };
      };
      conflictError.data = { code: "CONFLICT" };
      mockCreateError = conflictError;

      await expect(handleSkills("add", ["skill.md"], {})).rejects.toThrow(
        "process.exit",
      );
    });

    it("processes multiple files and continues on error", async () => {
      mockFiles["good.md"] =
        "---\nname: good-skill\ndescription: Good\n---\nGood instructions";
      mockFiles["bad.md"] = "no frontmatter";

      // One good, one bad -- should succeed (exit 0) since at least one succeeded
      await handleSkills("add", ["good.md", "bad.md"], {});
      expect(consoleLogs.some((l) => l.includes("1 failed"))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Get
  // --------------------------------------------------------------------------

  describe("get", () => {
    it("fails when no name specified", async () => {
      await expect(handleSkills("get", [], {})).rejects.toThrow("process.exit");
      expect(consoleErrors.some((l) => l.includes("skill name"))).toBe(true);
    });

    it("prints skill as markdown to stdout", async () => {
      mockSkillsList = [
        {
          id: "sk_1",
          name: "my-skill",
          description: "A test skill",
          instructions: "Do the thing",
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      await handleSkills("get", ["my-skill"], {});
      const output = stdoutWrites.join("");
      expect(output).toContain("---");
      expect(output).toContain("my-skill");
      expect(output).toContain("Do the thing");
    });

    it("fails when skill not found", async () => {
      mockSkillsList = [];
      await expect(handleSkills("get", ["nonexistent"], {})).rejects.toThrow(
        "process.exit",
      );
    });
  });

  // --------------------------------------------------------------------------
  // Update
  // --------------------------------------------------------------------------

  describe("update", () => {
    it("fails when no files specified", async () => {
      await expect(handleSkills("update", [], {})).rejects.toThrow(
        "process.exit",
      );
    });

    it("updates an existing skill", async () => {
      mockSkillsList = [
        {
          id: "sk_1",
          name: "my-skill",
          description: "Old description",
          instructions: "Old instructions",
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockFiles["my-skill.md"] =
        "---\nname: my-skill\ndescription: New description\n---\nNew instructions";

      await handleSkills("update", ["my-skill.md"], {});
      // Should not throw
    });

    it("fails when skill not found for update", async () => {
      mockSkillsList = [];
      mockFiles["new.md"] =
        "---\nname: nonexistent\ndescription: Test\n---\nBody";

      await expect(handleSkills("update", ["new.md"], {})).rejects.toThrow(
        "process.exit",
      );
    });
  });

  // --------------------------------------------------------------------------
  // Delete
  // --------------------------------------------------------------------------

  describe("delete", () => {
    it("fails when no name specified", async () => {
      await expect(handleSkills("delete", [], {})).rejects.toThrow(
        "process.exit",
      );
    });

    it("deletes with confirmation", async () => {
      mockSkillsList = [
        {
          id: "sk_1",
          name: "my-skill",
          description: "Test",
          instructions: "Body",
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockConfirmResult = true;

      await handleSkills("delete", ["my-skill"], {});
      // Should not throw
    });

    it("cancels when user declines confirmation", async () => {
      mockSkillsList = [
        {
          id: "sk_1",
          name: "my-skill",
          description: "Test",
          instructions: "Body",
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockConfirmResult = false;

      await handleSkills("delete", ["my-skill"], {});
      expect(consoleLogs.some((l) => l.includes("Cancelled"))).toBe(true);
    });

    it("deletes with --force flag without confirmation", async () => {
      mockSkillsList = [
        {
          id: "sk_1",
          name: "my-skill",
          description: "Test",
          instructions: "Body",
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await handleSkills("delete", ["my-skill"], { force: true });
      // Should not throw
    });

    it("throws GuidanceError in non-interactive mode without --force", async () => {
      mockSkillsList = [
        {
          id: "sk_1",
          name: "my-skill",
          description: "Test",
          instructions: "Body",
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockIsInteractive = false;

      try {
        await handleSkills("delete", ["my-skill"], {});
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).name).toBe("GuidanceError");
      }
    });

    it("fails when skill not found", async () => {
      mockSkillsList = [];
      await expect(
        handleSkills("delete", ["nonexistent"], { force: true }),
      ).rejects.toThrow("process.exit");
    });
  });

  // --------------------------------------------------------------------------
  // Unknown subcommand
  // --------------------------------------------------------------------------

  describe("unknown subcommand", () => {
    it("exits with error for unknown subcommand", async () => {
      await expect(handleSkills("bogus", [], {})).rejects.toThrow(
        "process.exit",
      );
    });
  });
});
