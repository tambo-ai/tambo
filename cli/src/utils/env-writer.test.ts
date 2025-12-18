import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { vol } from "memfs";
import { writeEnvVar } from "./env-writer.js";

// Mock fs module
jest.mock("fs");

// Mock interactive utils
jest.mock("./interactive.js", () => ({
  interactivePrompt: jest.fn(),
}));

describe("writeEnvVar", () => {
  beforeEach(() => {
    vol.reset();
  });

  afterEach(() => {
    vol.reset();
    jest.clearAllMocks();
  });

  describe("file selection", () => {
    it("creates .env.local when no env files exist", async () => {
      vol.fromJSON({
        "/project/package.json": "{}",
      });

      const result = await writeEnvVar(
        "/project",
        "TAMBO_API_KEY",
        "test_key",
        "NEXT_PUBLIC_",
        { promptOverwrite: false },
      );

      expect(result.success).toBe(true);
      expect(result.filePath).toBe("/project/.env.local");
      expect(result.overwrote).toBe(false);

      const fs = await import("fs");
      const content = fs.readFileSync("/project/.env.local", "utf-8");
      expect(content).toContain("NEXT_PUBLIC_TAMBO_API_KEY=test_key");
    });

    it("uses existing .env.local when it exists", async () => {
      vol.fromJSON({
        "/project/.env.local": "EXISTING_VAR=value\n",
      });

      const result = await writeEnvVar(
        "/project",
        "TAMBO_API_KEY",
        "test_key",
        "NEXT_PUBLIC_",
        { promptOverwrite: false },
      );

      expect(result.success).toBe(true);
      expect(result.filePath).toBe("/project/.env.local");

      const fs = await import("fs");
      const content = fs.readFileSync("/project/.env.local", "utf-8");
      expect(content).toContain("EXISTING_VAR=value");
      expect(content).toContain("NEXT_PUBLIC_TAMBO_API_KEY=test_key");
    });

    it("uses .env when it exists and .env.local does not", async () => {
      vol.fromJSON({
        "/project/.env": "EXISTING_VAR=value\n",
      });

      const result = await writeEnvVar(
        "/project",
        "TAMBO_API_KEY",
        "test_key",
        "NEXT_PUBLIC_",
        { promptOverwrite: false },
      );

      expect(result.success).toBe(true);
      expect(result.filePath).toBe("/project/.env");
    });

    it("prefers .env.local over .env when both exist", async () => {
      vol.fromJSON({
        "/project/.env": "OLD_VAR=value\n",
        "/project/.env.local": "NEW_VAR=value\n",
      });

      const result = await writeEnvVar(
        "/project",
        "TAMBO_API_KEY",
        "test_key",
        "NEXT_PUBLIC_",
        { promptOverwrite: false },
      );

      expect(result.filePath).toBe("/project/.env.local");
    });
  });

  describe("key writing", () => {
    it("appends new key when it does not exist", async () => {
      vol.fromJSON({
        "/project/.env.local": "EXISTING_VAR=value\n",
      });

      const result = await writeEnvVar(
        "/project",
        "TAMBO_API_KEY",
        "test_key",
        "NEXT_PUBLIC_",
        { promptOverwrite: false },
      );

      expect(result.success).toBe(true);
      expect(result.overwrote).toBe(false);

      const fs = await import("fs");
      const content = fs.readFileSync("/project/.env.local", "utf-8");
      expect(content).toContain("EXISTING_VAR=value");
      expect(content).toContain("NEXT_PUBLIC_TAMBO_API_KEY=test_key");
    });

    it("replaces existing key without prompt when promptOverwrite is false", async () => {
      vol.fromJSON({
        "/project/.env.local": "NEXT_PUBLIC_TAMBO_API_KEY=old_key\n",
      });

      const result = await writeEnvVar(
        "/project",
        "TAMBO_API_KEY",
        "new_key",
        "NEXT_PUBLIC_",
        { promptOverwrite: false },
      );

      expect(result.success).toBe(true);
      expect(result.overwrote).toBe(true);

      const fs = await import("fs");
      const content = fs.readFileSync("/project/.env.local", "utf-8");
      expect(content).toBe("NEXT_PUBLIC_TAMBO_API_KEY=new_key\n");
      expect(content).not.toContain("old_key");
    });

    it("prompts user when key exists and promptOverwrite is true", async () => {
      vol.fromJSON({
        "/project/.env.local": "NEXT_PUBLIC_TAMBO_API_KEY=old_key\n",
      });

      const { interactivePrompt } = await import("./interactive.js");
      const mockPrompt = interactivePrompt as jest.MockedFunction<
        typeof interactivePrompt
      >;
      mockPrompt.mockResolvedValue({ shouldOverwrite: true });

      const result = await writeEnvVar(
        "/project",
        "TAMBO_API_KEY",
        "new_key",
        "NEXT_PUBLIC_",
        { promptOverwrite: true },
      );

      expect(result.success).toBe(true);
      expect(result.overwrote).toBe(true);
      expect(mockPrompt).toHaveBeenCalled();
    });

    it("skips writing when user declines overwrite", async () => {
      vol.fromJSON({
        "/project/.env.local": "NEXT_PUBLIC_TAMBO_API_KEY=old_key\n",
      });

      const { interactivePrompt } = await import("./interactive.js");
      const mockPrompt = interactivePrompt as jest.MockedFunction<
        typeof interactivePrompt
      >;
      mockPrompt.mockResolvedValue({ shouldOverwrite: false });

      const result = await writeEnvVar(
        "/project",
        "TAMBO_API_KEY",
        "new_key",
        "NEXT_PUBLIC_",
        { promptOverwrite: true },
      );

      expect(result.success).toBe(false);
      expect(result.overwrote).toBe(false);

      const fs = await import("fs");
      const content = fs.readFileSync("/project/.env.local", "utf-8");
      expect(content).toBe("NEXT_PUBLIC_TAMBO_API_KEY=old_key\n");
    });
  });

  describe("prefix handling", () => {
    it("applies framework prefix correctly", async () => {
      vol.fromJSON({
        "/project/.env.local": "",
      });

      await writeEnvVar("/project", "TAMBO_API_KEY", "test_key", "VITE_", {
        promptOverwrite: false,
      });

      const fs = await import("fs");
      const content = fs.readFileSync("/project/.env.local", "utf-8");
      expect(content).toContain("VITE_TAMBO_API_KEY=test_key");
    });

    it("handles empty prefix (Remix)", async () => {
      vol.fromJSON({
        "/project/.env.local": "",
      });

      await writeEnvVar("/project", "TAMBO_API_KEY", "test_key", "", {
        promptOverwrite: false,
      });

      const fs = await import("fs");
      const content = fs.readFileSync("/project/.env.local", "utf-8");
      expect(content).toContain("TAMBO_API_KEY=test_key");
      expect(content).not.toContain("undefined");
    });
  });

  describe("edge cases", () => {
    it("handles keys with special regex characters", async () => {
      vol.fromJSON({
        "/project/.env.local": "MY.SPECIAL[KEY]=old\n",
      });

      const result = await writeEnvVar(
        "/project",
        ".SPECIAL[KEY]",
        "new_value",
        "MY",
        { promptOverwrite: false },
      );

      expect(result.success).toBe(true);
      expect(result.overwrote).toBe(true);

      const fs = await import("fs");
      const content = fs.readFileSync("/project/.env.local", "utf-8");
      expect(content).toContain("MY.SPECIAL[KEY]=new_value");
    });

    it("appends with newline when file does not end with newline", async () => {
      vol.fromJSON({
        "/project/.env.local": "EXISTING=value",
      });

      await writeEnvVar("/project", "NEW_KEY", "new_value", "NEXT_PUBLIC_", {
        promptOverwrite: false,
      });

      const fs = await import("fs");
      const content = fs.readFileSync("/project/.env.local", "utf-8");
      const lines = content.split("\n").filter((line) => line.trim());
      expect(lines).toHaveLength(2);
    });
  });
});
