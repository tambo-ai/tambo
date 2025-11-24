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

// Don't mock agent-docs, let it run with the mocked fs

const { upgradeAgentDocsAndRemoveCursorRules } = await import(
  "../../src/commands/upgrade/llm-rules.js"
);

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

  it("returns when cursor directory is missing", async () => {
    vol.fromJSON({
      "/mock-project/package.json": "{}",
    });
    await expect(
      upgradeAgentDocsAndRemoveCursorRules({ yes: true }),
    ).resolves.toBe(true);
  });

  it("removes files with tambo markers and keeps others, then writes docs", async () => {
    vol.fromJSON({
      "/mock-project/.cursor/rules/tambo.md": "# Some rules",
      "/mock-project/.cursor/rules/my-tambo-guide.md": "# More rules",
      "/mock-project/.cursor/rules/keep.md": "# Keep me (no tambo in name)",
      "/mock-project/package.json": "{}",
    });

    const result = await upgradeAgentDocsAndRemoveCursorRules({
      yes: true,
    });

    expect(result).toBe(true);
    expect(memfsFs.existsSync("/mock-project/.cursor/rules/tambo.md")).toBe(
      false,
    );
    expect(
      memfsFs.existsSync("/mock-project/.cursor/rules/my-tambo-guide.md"),
    ).toBe(false);
    expect(memfsFs.existsSync("/mock-project/.cursor/rules/keep.md")).toBe(
      true,
    );
    expect(memfsFs.existsSync("/mock-project/AGENTS.md")).toBe(true);
  });

  it("removes directory when emptied", async () => {
    vol.fromJSON({
      "/mock-project/.cursor/rules/tambo-guidance.md": "Tambo AI guidance",
      "/mock-project/package.json": "{}",
    });

    await expect(
      upgradeAgentDocsAndRemoveCursorRules({ yes: true }),
    ).resolves.toBe(true);

    expect(memfsFs.existsSync("/mock-project/.cursor/rules")).toBe(false);
    expect(memfsFs.existsSync("/mock-project/.cursor")).toBe(true);
  });

  it("removes .cursorrules", async () => {
    vol.fromJSON({
      "/mock-project/.cursorrules": "legacy cursor rules",
      "/mock-project/package.json": "{}",
    });

    await expect(
      upgradeAgentDocsAndRemoveCursorRules({ yes: true }),
    ).resolves.toBe(true);

    expect(memfsFs.existsSync("/mock-project/.cursorrules")).toBe(false);
    expect(memfsFs.existsSync("/mock-project/AGENTS.md")).toBe(true);
  });
});
