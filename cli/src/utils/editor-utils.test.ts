import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { detectEditor } from "./editor-utils.js";

// Mock interactive utils and child_process
jest.mock("./interactive.js", () => ({
  execSync: jest.fn(),
  interactivePrompt: jest.fn(),
}));

jest.mock("child_process", () => ({
  spawn: jest.fn(),
}));

describe("editor-utils", () => {
  let originalEnv: {
    VISUAL?: string;
    EDITOR?: string;
  };

  beforeEach(() => {
    originalEnv = {
      VISUAL: process.env.VISUAL,
      EDITOR: process.env.EDITOR,
    };
    delete process.env.VISUAL;
    delete process.env.EDITOR;
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalEnv.VISUAL === undefined) delete process.env.VISUAL;
    else process.env.VISUAL = originalEnv.VISUAL;

    if (originalEnv.EDITOR === undefined) delete process.env.EDITOR;
    else process.env.EDITOR = originalEnv.EDITOR;
  });

  describe("detectEditor", () => {
    it("detects editor from VISUAL environment variable", async () => {
      process.env.VISUAL = "nvim";

      const { execSync } = await import("./interactive.js");
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
      mockExecSync.mockReturnValue(Buffer.from("/usr/bin/nvim"));

      const result = detectEditor();
      expect(result).toEqual({
        command: "nvim",
        name: "default editor",
      });
    });

    it("detects editor from EDITOR environment variable", async () => {
      process.env.EDITOR = "vim";

      const { execSync } = await import("./interactive.js");
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
      mockExecSync.mockReturnValue(Buffer.from("/usr/bin/vim"));

      const result = detectEditor();
      expect(result).toEqual({
        command: "vim",
        name: "default editor",
      });
    });

    it("prioritizes VISUAL over EDITOR", async () => {
      process.env.VISUAL = "nvim";
      process.env.EDITOR = "vim";

      const { execSync } = await import("./interactive.js");
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
      mockExecSync.mockReturnValue(Buffer.from("/usr/bin/nvim"));

      const result = detectEditor();
      expect(result?.command).toBe("nvim");
    });

    it("detects VS Code when installed", async () => {
      const { execSync } = await import("./interactive.js");
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

      // Mock code being available
      mockExecSync.mockImplementation((cmd) => {
        if (typeof cmd === "string" && cmd.includes("code")) {
          return Buffer.from("/usr/local/bin/code");
        }
        throw new Error("Command not found");
      });

      const result = detectEditor();
      expect(result).toEqual({
        command: "code",
        name: "VS Code",
      });
    });

    it("detects Cursor when installed", async () => {
      const { execSync } = await import("./interactive.js");
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

      mockExecSync.mockImplementation((cmd) => {
        if (typeof cmd === "string" && cmd.includes("cursor")) {
          return Buffer.from("/usr/local/bin/cursor");
        }
        throw new Error("Command not found");
      });

      const result = detectEditor();
      expect(result).toEqual({
        command: "cursor",
        name: "Cursor",
      });
    });

    it("returns null when no editor is found", async () => {
      const { execSync } = await import("./interactive.js");
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
      mockExecSync.mockImplementation(() => {
        throw new Error("Command not found");
      });

      const result = detectEditor();
      expect(result).toBeNull();
    });

    it("returns null when VISUAL is set but not available", async () => {
      process.env.VISUAL = "nonexistent-editor";

      const { execSync } = await import("./interactive.js");
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
      mockExecSync.mockImplementation(() => {
        throw new Error("Command not found");
      });

      const result = detectEditor();
      expect(result).toBeNull();
    });

    it("checks editors in correct priority order", async () => {
      const { execSync } = await import("./interactive.js");
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
      const checkedEditors: string[] = [];

      mockExecSync.mockImplementation((cmd) => {
        if (typeof cmd === "string") {
          const regex = /command -v (\w+)|where (\w+)/;
          const match = regex.exec(cmd);
          if (match) {
            const editor = match[1] || match[2];
            checkedEditors.push(editor);
            // Make webstorm the first available editor
            if (editor === "webstorm") {
              return Buffer.from("/usr/local/bin/webstorm");
            }
          }
        }
        throw new Error("Command not found");
      });

      const result = detectEditor();

      // Should have checked code and cursor before finding webstorm
      expect(checkedEditors.slice(0, 3)).toEqual(["code", "cursor", "idea"]);
      expect(result).toEqual({
        command: "webstorm",
        name: "WebStorm",
      });
    });
  });
});
