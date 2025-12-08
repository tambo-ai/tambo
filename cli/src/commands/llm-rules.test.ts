import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fs as memfsFs, vol } from "memfs";

jest.unstable_mockModule("fs", () => ({
  ...memfsFs,
  default: memfsFs,
}));

jest.unstable_mockModule("ora", () => ({
  default: () => ({
    start: () => ({
      succeed: jest.fn(),
      fail: jest.fn(),
    }),
  }),
}));

jest.unstable_mockModule("inquirer", () => ({
  default: {
    prompt: jest.fn(async () => ({ proceed: true })),
  },
}));

const { upgradeAgentDocsAndRemoveCursorRules } =
  await import("../../src/commands/upgrade/llm-rules.js");

describe("upgradeAgentDocsAndRemoveCursorRules", () => {
  let originalCwd: () => string;

  beforeEach(() => {
    vol.reset();
    originalCwd = process.cwd;
    process.cwd = () => "/mock-project";
  });

  afterEach(() => {
    vol.reset();
    process.cwd = originalCwd;
  });

  it("creates agent docs when none exist", async () => {
    vol.fromJSON({
      "/mock-project/package.json": "{}",
    });

    await expect(
      upgradeAgentDocsAndRemoveCursorRules({ yes: true }),
    ).resolves.toBe(true);

    expect(memfsFs.existsSync("/mock-project/AGENTS.md")).toBe(true);
  });

  it("skips when skipAgentDocs is true", async () => {
    vol.fromJSON({
      "/mock-project/package.json": "{}",
    });

    await expect(
      upgradeAgentDocsAndRemoveCursorRules({ yes: true, skipAgentDocs: true }),
    ).resolves.toBe(true);

    expect(memfsFs.existsSync("/mock-project/AGENTS.md")).toBe(false);
  });

  it("removes legacy tambo-ai.mdc cursor rules file", async () => {
    vol.fromJSON({
      "/mock-project/.cursor/rules/tambo-ai.mdc": "# Legacy Tambo rules",
      "/mock-project/package.json": "{}",
    });

    await expect(
      upgradeAgentDocsAndRemoveCursorRules({ yes: true }),
    ).resolves.toBe(true);

    // Legacy file should be removed
    expect(memfsFs.existsSync("/mock-project/.cursor/rules/tambo-ai.mdc")).toBe(
      false,
    );
    // Empty rules directory should be cleaned up
    expect(memfsFs.existsSync("/mock-project/.cursor/rules")).toBe(false);
    // .cursor directory should still exist
    expect(memfsFs.existsSync("/mock-project/.cursor")).toBe(true);
    // Agent docs should be created
    expect(memfsFs.existsSync("/mock-project/AGENTS.md")).toBe(true);
  });

  it("keeps other cursor rules files (user-owned)", async () => {
    vol.fromJSON({
      "/mock-project/.cursor/rules/tambo-ai.mdc": "# Legacy Tambo rules",
      "/mock-project/.cursor/rules/my-rules.md": "# My custom rules",
      "/mock-project/package.json": "{}",
    });

    await expect(
      upgradeAgentDocsAndRemoveCursorRules({ yes: true }),
    ).resolves.toBe(true);

    // Legacy Tambo file should be removed
    expect(memfsFs.existsSync("/mock-project/.cursor/rules/tambo-ai.mdc")).toBe(
      false,
    );
    // User's custom rules should be kept
    expect(memfsFs.existsSync("/mock-project/.cursor/rules/my-rules.md")).toBe(
      true,
    );
    // Rules directory should still exist (not empty)
    expect(memfsFs.existsSync("/mock-project/.cursor/rules")).toBe(true);
  });

  it("does not touch .cursorrules (user-owned file)", async () => {
    vol.fromJSON({
      "/mock-project/.cursorrules": "user cursor rules",
      "/mock-project/package.json": "{}",
    });

    await expect(
      upgradeAgentDocsAndRemoveCursorRules({ yes: true }),
    ).resolves.toBe(true);

    // .cursorrules is not a Tambo-created file, should be kept
    expect(memfsFs.existsSync("/mock-project/.cursorrules")).toBe(true);
    expect(memfsFs.existsSync("/mock-project/AGENTS.md")).toBe(true);
  });

  it("updates existing CLAUDE.md instead of creating AGENTS.md", async () => {
    vol.fromJSON({
      "/mock-project/CLAUDE.md": "# Existing Claude instructions",
      "/mock-project/package.json": "{}",
    });

    await expect(
      upgradeAgentDocsAndRemoveCursorRules({ yes: true }),
    ).resolves.toBe(true);

    // Should update CLAUDE.md, not create AGENTS.md
    expect(memfsFs.existsSync("/mock-project/AGENTS.md")).toBe(false);
    const content = memfsFs.readFileSync("/mock-project/CLAUDE.md", "utf-8");
    expect(content).toContain("Tambo AI");
  });
});
