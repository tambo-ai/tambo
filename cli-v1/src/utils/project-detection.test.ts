/**
 * Tests for project detection utilities.
 */

import { describe, expect, it, jest } from "@jest/globals";

import path from "path";

import { mockFs } from "../__fixtures__/test-utils.js";

const mockIsTokenValid = jest.fn<() => boolean>();
const mockVerifySession = jest.fn<() => Promise<boolean>>();
const mockFindTamboApiKey =
  jest.fn<(content: string) => { keyName: string; value: string } | null>();
const mockGetLibDirectory = jest.fn<() => string>(() => "/tmp/lib");
const mockDetectPackageManager =
  jest.fn<() => "npm" | "pnpm" | "yarn" | "bun">();

jest.unstable_mockModule("../lib/device-auth.js", () => ({
  isTokenValid: mockIsTokenValid,
  verifySession: mockVerifySession,
}));

jest.unstable_mockModule("./dotenv-utils.js", () => ({
  findTamboApiKey: mockFindTamboApiKey,
}));

const mockGetComponentDirectoryPath = jest.fn<() => string>(
  () => "/tmp/components/tambo",
);
jest.unstable_mockModule("./path-utils.js", () => ({
  getLibDirectory: mockGetLibDirectory,
  getComponentDirectoryPath: mockGetComponentDirectoryPath,
}));

jest.unstable_mockModule("./package-manager.js", () => ({
  detectPackageManager: mockDetectPackageManager,
}));

const { detectProjectStatus } = await import("./project-detection.js");

describe("detectProjectStatus", () => {
  it("detects project status from files", async () => {
    mockIsTokenValid.mockReturnValue(true);
    mockVerifySession.mockResolvedValue(true);
    mockFindTamboApiKey.mockReturnValue({
      keyName: "TAMBO_API_KEY",
      value: "key",
    });
    mockDetectPackageManager.mockReturnValue("npm");

    const cwd = process.cwd();
    mockFs({
      [path.join(cwd, "package.json")]: JSON.stringify({
        dependencies: {
          "@tambo-ai/react": "1.0.0",
        },
      }),
      [path.join(cwd, ".env.local")]: "TAMBO_API_KEY=key",
      "/tmp/lib/tambo.ts": "content",
      "/tmp/components/tambo/SKILL.md": "content",
    });

    const status = await detectProjectStatus(cwd, "src/components");

    expect(status.hasPackageJson).toBe(true);
    expect(status.packageManager).toBe("npm");
    expect(status.hasTamboReact).toBe(true);
    expect(status.authenticated).toBe(true);
    expect(status.hasApiKey).toBe(true);
    expect(status.hasTamboTs).toBe(true);
    expect(status.hasAgentDocs).toBe(true);
  });

  it("returns unauthenticated when session invalid", async () => {
    mockIsTokenValid.mockReturnValue(true);
    mockVerifySession.mockResolvedValue(false);
    mockDetectPackageManager.mockReturnValue("npm");
    mockFindTamboApiKey.mockReturnValue(null);

    const cwd = process.cwd();
    mockFs({
      [path.join(cwd, "package.json")]: JSON.stringify({}),
    });

    const status = await detectProjectStatus(cwd, "src/components");

    expect(status.authenticated).toBe(false);
    expect(status.hasApiKey).toBe(false);
  });
});
