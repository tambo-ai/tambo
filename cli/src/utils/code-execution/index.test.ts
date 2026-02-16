/**
 * Tests for execution orchestrator
 *
 * These tests verify the full execution flow using mocked dependencies.
 * Note: Due to ESM Jest limitations, we use integration-style tests
 * with real temporary files instead of heavy mocking.
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { executeCodeChanges } from "./index.js";
import type { ConfirmationResult } from "../user-confirmation/types.js";
import type { InstallationPlan } from "../plan-generation/types.js";

describe("executeCodeChanges", () => {
  let testDir: string;

  beforeEach(async () => {
    // Create unique temp directory for each test
    testDir = path.join(os.tmpdir(), `tambo-exec-test-${crypto.randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  test("throws when confirmation is not approved", async () => {
    const confirmation: ConfirmationResult = {
      approved: false,
      selectedItems: [],
      plan: {} as InstallationPlan,
    };

    await expect(executeCodeChanges(confirmation)).rejects.toThrow(
      "Cannot execute: plan was not approved",
    );
  });

  test("executes provider setup successfully", async () => {
    // Create a mock layout file
    const layoutPath = path.join(testDir, "layout.tsx");
    const layoutContent = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Test App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
    await fs.writeFile(layoutPath, layoutContent, "utf-8");

    const confirmation: ConfirmationResult = {
      approved: true,
      selectedItems: ["provider-setup"],
      plan: {
        providerSetup: {
          filePath: layoutPath,
          nestingLevel: 1,
          rationale: "Main layout file for app",
          confidence: 0.95,
        },
        componentRecommendations: [],
        toolRecommendations: [],
        interactableRecommendations: [],
        chatWidgetSetup: {
          position: "bottom-right",
          filePath: path.join(testDir, "page.tsx"),
          rationale: "Main page for chat widget",
          confidence: 0.9,
        },
      },
    };

    const result = await executeCodeChanges(confirmation, { yes: true });

    expect(result.success).toBe(true);
    expect(result.filesModified).toContain(layoutPath);
    expect(result.filesCreated).toEqual([]);

    // Verify file was actually modified
    const modifiedContent = await fs.readFile(layoutPath, "utf-8");
    expect(modifiedContent).toContain("TamboProvider");
    expect(modifiedContent).toContain("@tambo-ai/react");
  });

  test("creates new tool file successfully", async () => {
    const toolPath = path.join(testDir, "tools", "get-user-data.ts");

    const confirmation: ConfirmationResult = {
      approved: true,
      selectedItems: ["tool-0"],
      plan: {
        providerSetup: {
          filePath: path.join(testDir, "layout.tsx"),
          nestingLevel: 1,
          rationale: "Main layout file",
          confidence: 0.95,
        },
        componentRecommendations: [],
        toolRecommendations: [
          {
            name: "getUserData",
            type: "exported-function",
            reason: "Fetch user data from API",
            suggestedSchema: "z.object({ userId: z.string() })",
            filePath: toolPath,
            confidence: 0.9,
          },
        ],
        interactableRecommendations: [],
        chatWidgetSetup: {
          position: "bottom-right",
          filePath: path.join(testDir, "page.tsx"),
          rationale: "Main page",
          confidence: 0.9,
        },
      },
    };

    const result = await executeCodeChanges(confirmation, { yes: true });

    expect(result.success).toBe(true);
    expect(result.filesCreated).toContain(toolPath);
    expect(result.filesModified).toEqual([]);

    // Verify tool file was created with correct content
    const toolContent = await fs.readFile(toolPath, "utf-8");
    expect(toolContent).toContain("export const getUserDataSchema");
    expect(toolContent).toContain("export async function getUserData");
    expect(toolContent).toContain("z.object({ userId: z.string() })");
  });

  test("handles multiple file operations in one execution", async () => {
    // Create layout file
    const layoutPath = path.join(testDir, "layout.tsx");
    await fs.writeFile(
      layoutPath,
      `export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}`,
      "utf-8",
    );

    // Define tool path (will be created)
    const toolPath = path.join(testDir, "tools", "test-tool.ts");

    const confirmation: ConfirmationResult = {
      approved: true,
      selectedItems: ["provider-setup", "tool-0"],
      plan: {
        providerSetup: {
          filePath: layoutPath,
          nestingLevel: 1,
          rationale: "Main layout",
          confidence: 0.95,
        },
        componentRecommendations: [],
        toolRecommendations: [
          {
            name: "testTool",
            type: "exported-function",
            reason: "Test tool for testing",
            suggestedSchema: "z.object({})",
            filePath: toolPath,
            confidence: 0.9,
          },
        ],
        interactableRecommendations: [],
        chatWidgetSetup: {
          position: "bottom-right",
          filePath: path.join(testDir, "page.tsx"),
          rationale: "Main page",
          confidence: 0.9,
        },
      },
    };

    const result = await executeCodeChanges(confirmation, { yes: true });

    expect(result.success).toBe(true);
    expect(result.filesModified).toContain(layoutPath);
    expect(result.filesCreated).toContain(toolPath);

    // Verify both files exist
    await expect(fs.access(layoutPath)).resolves.toBeUndefined();
    await expect(fs.access(toolPath)).resolves.toBeUndefined();
  });

  test("correctly identifies new vs modified files", async () => {
    // Create existing file
    const existingPath = path.join(testDir, "existing.tsx");
    await fs.writeFile(existingPath, "export const OLD = 1;", "utf-8");

    // New file path
    const newPath = path.join(testDir, "new.ts");

    const confirmation: ConfirmationResult = {
      approved: true,
      selectedItems: ["component-0", "tool-0"],
      plan: {
        providerSetup: {
          filePath: path.join(testDir, "layout.tsx"),
          nestingLevel: 1,
          rationale: "Main layout",
          confidence: 0.95,
        },
        componentRecommendations: [
          {
            name: "Button",
            reason: "Reusable button component",
            suggestedRegistration: 'registerComponent("Button", Button);',
            filePath: existingPath,
            confidence: 0.95,
          },
        ],
        toolRecommendations: [
          {
            name: "newTool",
            type: "exported-function",
            reason: "New tool for testing",
            suggestedSchema: "z.object({})",
            filePath: newPath,
            confidence: 0.9,
          },
        ],
        interactableRecommendations: [],
        chatWidgetSetup: {
          position: "bottom-right",
          filePath: path.join(testDir, "page.tsx"),
          rationale: "Main page",
          confidence: 0.9,
        },
      },
    };

    const result = await executeCodeChanges(confirmation, { yes: true });

    expect(result.success).toBe(true);
    expect(result.filesModified).toContain(existingPath);
    expect(result.filesCreated).toContain(newPath);
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
    expect(typeof module.verifyExecution).toBe("function");
  });

  test("re-exports formatExecutionError", async () => {
    const module = await import("./index.js");
    expect(module.formatExecutionError).toBeDefined();
    expect(typeof module.formatExecutionError).toBe("function");
  });

  test("re-exports categorizeExecutionError", async () => {
    const module = await import("./index.js");
    expect(module.categorizeExecutionError).toBeDefined();
    expect(typeof module.categorizeExecutionError).toBe("function");
  });

  test("re-exports writeFileAtomic", async () => {
    const module = await import("./index.js");
    expect(module.writeFileAtomic).toBeDefined();
    expect(typeof module.writeFileAtomic).toBe("function");
  });

  test("re-exports installDependencies", async () => {
    const module = await import("./index.js");
    expect(module.installDependencies).toBeDefined();
    expect(typeof module.installDependencies).toBe("function");
  });

  test("re-exports collectDependencies", async () => {
    const module = await import("./index.js");
    expect(module.collectDependencies).toBeDefined();
    expect(typeof module.collectDependencies).toBe("function");
  });
});
