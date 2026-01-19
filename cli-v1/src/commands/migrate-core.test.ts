import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";

const mockExistsSync = jest.fn<(p: unknown) => boolean>();
const mockReaddirSync = jest.fn<(p: unknown) => string[]>();
const mockReadFileSync = jest.fn<(p: unknown, encoding?: unknown) => string>();
const mockWriteFileSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockRmdirSync = jest.fn();
const mockUnlinkSync = jest.fn();

const mockInteractivePrompt = jest.fn<() => Promise<{ proceed?: boolean; confirm?: boolean }>>();
const mockOraStart = jest.fn();
const mockOraSucceed = jest.fn();
const mockOraFail = jest.fn();
const mockOra = jest.fn(() => ({
  start: mockOraStart.mockReturnThis(),
  succeed: mockOraSucceed,
  fail: mockOraFail,
}));

const mockGetInstallationPath = jest.fn<() => Promise<string>>();
const mockGetTamboComponentInfo = jest.fn<() => {
  mainComponents: Set<string>;
  supportComponents: Set<string>;
  allComponents: Set<string>;
}>();

jest.unstable_mockModule("fs", () => ({
  default: {
    existsSync: mockExistsSync,
    readdirSync: mockReaddirSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    mkdirSync: mockMkdirSync,
    rmdirSync: mockRmdirSync,
    unlinkSync: mockUnlinkSync,
  },
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  mkdirSync: mockMkdirSync,
  rmdirSync: mockRmdirSync,
  unlinkSync: mockUnlinkSync,
}));

jest.unstable_mockModule("ora", () => ({
  default: mockOra,
}));

jest.unstable_mockModule("../utils/interactive.js", () => ({
  interactivePrompt: mockInteractivePrompt,
}));

jest.unstable_mockModule("./init.js", () => ({
  getInstallationPath: mockGetInstallationPath,
}));

jest.unstable_mockModule("./add/utils.js", () => ({
  getTamboComponentInfo: mockGetTamboComponentInfo,
}));

// Suppress console output
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

const { updateImportPaths, handleMigrate } = await import("./migrate-core.js");

describe("migrate-core", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
    mockGetInstallationPath.mockResolvedValue("src");
    mockGetTamboComponentInfo.mockReturnValue({
      mainComponents: new Set(["message-input", "thread-list"]),
      supportComponents: new Set(["message-renderer"]),
      allComponents: new Set(["message-input", "thread-list", "message-renderer"]),
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe("updateImportPaths", () => {
    it("updates ui/ imports to tambo/ by default", () => {
      const content = `import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";`;

      const result = updateImportPaths(content);

      expect(result).toBe(`import { Button } from "@/components/tambo/button";
import { Input } from "@/components/tambo/input";`);
    });

    it("updates ui/ imports to tambo/ when targetLocation is tambo", () => {
      const content = `import { Component } from "@/components/ui/component";`;

      const result = updateImportPaths(content, "tambo");

      expect(result).toBe(`import { Component } from "@/components/tambo/component";`);
    });

    it("updates tambo/ imports to ui/ when targetLocation is ui", () => {
      const content = `import { Button } from "@/components/tambo/button";
import { Input } from "@/components/tambo/input";`;

      const result = updateImportPaths(content, "ui");

      expect(result).toBe(`import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";`);
    });

    it("does not modify non-matching imports", () => {
      const content = `import { useState } from "react";
import { clsx } from "clsx";`;

      const result = updateImportPaths(content);

      expect(result).toBe(content);
    });

    it("handles mixed content with multiple import types", () => {
      const content = `import { useState } from "react";
import { Button } from "@/components/ui/button";
import { clsx } from "clsx";
import { Input } from "@/components/ui/input";`;

      const result = updateImportPaths(content, "tambo");

      expect(result).toContain(`"@/components/tambo/button"`);
      expect(result).toContain(`"@/components/tambo/input"`);
      expect(result).toContain(`"react"`);
      expect(result).toContain(`"clsx"`);
    });

    it("handles empty content", () => {
      const result = updateImportPaths("");
      expect(result).toBe("");
    });
  });

  describe("handleMigrate", () => {
    it("returns early when legacy path does not exist", async () => {
      mockExistsSync.mockReturnValue(false);

      await handleMigrate({ yes: true });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("No components found in legacy location"),
      );
      expect(mockMkdirSync).not.toHaveBeenCalled();
    });

    it("returns early when no .tsx files in legacy path", async () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue(["readme.md", "styles.css"]);

      await handleMigrate({ yes: true });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("No components found to migrate"),
      );
    });

    it("categorizes components correctly", async () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        // Legacy path exists, new path does not
        return pathStr.includes("ui");
      });
      mockReaddirSync.mockReturnValue([
        "message-input.tsx",
        "message-renderer.tsx",
        "custom-component.tsx",
      ]);
      mockReadFileSync.mockReturnValue("const x = 1;");

      await handleMigrate({ yes: true });

      // Should show categorized components in output
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("Tambo components"));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("Tambo support components"));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("Custom components"));
    });

    it("shows dry-run output without modifying files", async () => {
      mockExistsSync.mockImplementation((p) => String(p).includes("ui"));
      mockReaddirSync.mockReturnValue(["message-input.tsx"]);

      await handleMigrate({ yes: true, dryRun: true });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("--dry-run mode"),
      );
      expect(mockMkdirSync).not.toHaveBeenCalled();
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });

    it("prompts for confirmation when not --yes and files exist in new location", async () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr.includes("tambo")) {
          return ["existing.tsx"];
        }
        return ["message-input.tsx"];
      });
      mockInteractivePrompt.mockResolvedValue({ proceed: false });

      await handleMigrate({ yes: false });

      expect(mockInteractivePrompt).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("cancelled"));
    });

    it("proceeds with migration when user confirms", async () => {
      // Only legacy "ui" path exists, not the new "tambo" path
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr.includes("/ui") || pathStr.endsWith("/ui");
      });
      mockReaddirSync.mockReturnValue(["message-input.tsx"]);
      mockInteractivePrompt.mockResolvedValue({ confirm: true });
      mockReadFileSync.mockReturnValue('import { x } from "@/components/ui/x";');

      await handleMigrate({ yes: false });

      expect(mockInteractivePrompt).toHaveBeenCalled();
      expect(mockMkdirSync).toHaveBeenCalled();
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it("cancels migration when user declines confirmation", async () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr.includes("/ui") || pathStr.endsWith("/ui");
      });
      mockReaddirSync.mockReturnValue(["message-input.tsx"]);
      mockInteractivePrompt.mockResolvedValue({ confirm: false });

      await handleMigrate({ yes: false });

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("cancelled"));
      expect(mockMkdirSync).not.toHaveBeenCalled();
    });

    it("migrates files with updated import paths", async () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr.includes("/ui") || pathStr.endsWith("/ui");
      });
      mockReaddirSync.mockReturnValue(["message-input.tsx"]);
      mockReadFileSync.mockReturnValue('import { Button } from "@/components/ui/button";');

      await handleMigrate({ yes: true });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("message-input.tsx"),
        expect.stringContaining("@/components/tambo/button"),
      );
    });

    it("removes old files after migration", async () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr.includes("/ui") || pathStr.endsWith("/ui");
      });
      mockReaddirSync.mockReturnValue(["message-input.tsx"]);
      mockReadFileSync.mockReturnValue("const x = 1;");

      await handleMigrate({ yes: true });

      expect(mockUnlinkSync).toHaveBeenCalled();
    });

    it("removes empty legacy directory after migration", async () => {
      let migrationDone = false;
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr.includes("/ui") || pathStr.endsWith("/ui");
      });
      mockReaddirSync.mockImplementation(() => {
        // After migration, legacy dir is empty
        if (migrationDone) {
          return [];
        }
        return ["message-input.tsx"];
      });
      mockReadFileSync.mockReturnValue("const x = 1;");
      mockUnlinkSync.mockImplementation(() => {
        migrationDone = true;
      });

      await handleMigrate({ yes: true });

      expect(mockRmdirSync).toHaveBeenCalled();
    });

    it("does not remove legacy directory if files remain", async () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr.includes("/ui") || pathStr.endsWith("/ui");
      });
      let callCount = 0;
      mockReaddirSync.mockImplementation(() => {
        callCount++;
        // First call returns files to migrate, second call (after migration) returns remaining custom file
        if (callCount > 1) {
          return ["custom-component.tsx"];
        }
        return ["message-input.tsx", "custom-component.tsx"];
      });
      mockReadFileSync.mockReturnValue("const x = 1;");

      await handleMigrate({ yes: true });

      // rmdirSync should not be called because custom-component.tsx remains
      expect(mockOraSucceed).toHaveBeenCalled();
      expect(mockRmdirSync).not.toHaveBeenCalled();
    });

    it("handles file migration errors gracefully", async () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr.includes("/ui") || pathStr.endsWith("/ui");
      });
      mockReaddirSync.mockReturnValue(["message-input.tsx"]);
      mockReadFileSync.mockImplementation(() => {
        throw new Error("Read error");
      });

      await handleMigrate({ yes: true });

      // Should still complete but report errors
      expect(mockOraSucceed).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("errors"),
      );
    });

    it("reports success count after migration", async () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr.includes("/ui") || pathStr.endsWith("/ui");
      });
      mockReaddirSync.mockReturnValue(["message-input.tsx", "thread-list.tsx"]);
      mockReadFileSync.mockReturnValue("const x = 1;");

      await handleMigrate({ yes: true });

      expect(mockOraSucceed).toHaveBeenCalledWith(
        expect.stringContaining("2 components"),
      );
    });

    it("shows next steps after successful migration", async () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr.includes("/ui") || pathStr.endsWith("/ui");
      });
      mockReaddirSync.mockReturnValue(["message-input.tsx"]);
      mockReadFileSync.mockReturnValue("const x = 1;");

      await handleMigrate({ yes: true });

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("Next steps"));
    });

    it("reports custom components that remain in legacy location", async () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr.includes("/ui") || pathStr.endsWith("/ui");
      });
      mockReaddirSync.mockReturnValue(["message-input.tsx", "my-custom.tsx"]);
      mockReadFileSync.mockReturnValue("const x = 1;");

      await handleMigrate({ yes: true });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("custom component"),
      );
    });
  });
});
