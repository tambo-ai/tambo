/**
 * Tests for env file helpers.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import { mockFs } from "../__fixtures__/test-utils.js";

const mockFindTamboApiKey = jest.fn();
const mockSetTamboApiKey = jest.fn();
const mockDetectFramework = jest.fn();
const mockGetTamboApiKeyEnvVar = jest.fn();

jest.unstable_mockModule("./dotenv-utils.js", () => ({
  findTamboApiKey: mockFindTamboApiKey,
  setTamboApiKey: mockSetTamboApiKey,
}));

jest.unstable_mockModule("./framework-detection.js", () => ({
  detectFramework: mockDetectFramework,
  getTamboApiKeyEnvVar: mockGetTamboApiKeyEnvVar,
}));

const { writeApiKeyToEnv } = await import("./env-helpers.js");
const { out } = await import("./output.js");

describe("writeApiKeyToEnv", () => {
  let infoSpy: jest.SpiedFunction<typeof out.info>;
  let successSpy: jest.SpiedFunction<typeof out.success>;
  let warningSpy: jest.SpiedFunction<typeof out.warning>;

  beforeEach(() => {
    infoSpy = jest.spyOn(out, "info").mockImplementation(() => undefined);
    successSpy = jest.spyOn(out, "success").mockImplementation(() => undefined);
    warningSpy = jest.spyOn(out, "warning").mockImplementation(() => undefined);
    mockGetTamboApiKeyEnvVar.mockReturnValue("TAMBO_API_KEY");
    mockDetectFramework.mockReturnValue(null);
    mockFindTamboApiKey.mockReturnValue(null);
    mockSetTamboApiKey.mockImplementation((content, name, value) => {
      return `${content}${name}=${value}\n`;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("creates .env.local when no env file exists", () => {
    const { writeSpy } = mockFs({});
    const onFileCreated = jest.fn();

    const result = writeApiKeyToEnv("key-123", {
      jsonMode: false,
      onFileCreated,
    });

    expect(result.envFile).toBe(".env.local");
    expect(result.created).toBe(true);
    expect(onFileCreated).toHaveBeenCalledWith(".env.local");
    expect(writeSpy).toHaveBeenCalled();
  });

  it("uses .env when present and .env.local is missing", () => {
    mockFs({ ".env": "EXISTING=1\n" });

    const result = writeApiKeyToEnv("key-123", { jsonMode: false });

    expect(result.envFile).toBe(".env");
    expect(result.modified).toBe(true);
  });

  it("updates existing file and warns about overwriting keys", () => {
    const { writeSpy } = mockFs({ ".env.local": "TAMBO_API_KEY=old\n" });
    const onFileModified = jest.fn();
    mockFindTamboApiKey.mockReturnValue({
      keyName: "TAMBO_API_KEY",
      value: "old",
    });
    mockSetTamboApiKey.mockReturnValue("TAMBO_API_KEY=new\n");

    const result = writeApiKeyToEnv("new", {
      jsonMode: false,
      onFileModified,
    });

    expect(result.modified).toBe(true);
    expect(onFileModified).toHaveBeenCalledWith(".env.local");
    expect(warningSpy).toHaveBeenCalledWith(
      "Existing API key found (TAMBO_API_KEY). Overwriting...",
    );
    expect(writeSpy).toHaveBeenCalledWith(".env.local", "TAMBO_API_KEY=new\n");
  });

  it("suppresses console output in json mode", () => {
    mockFs({});

    writeApiKeyToEnv("key-123", { jsonMode: true });

    expect(infoSpy).not.toHaveBeenCalled();
    expect(successSpy).not.toHaveBeenCalled();
    expect(warningSpy).not.toHaveBeenCalled();
  });

  it("uses framework env var name when detected", () => {
    const { writeSpy } = mockFs({});
    mockDetectFramework.mockReturnValue({ displayName: "Next.js" });
    mockGetTamboApiKeyEnvVar.mockReturnValue("NEXT_PUBLIC_TAMBO_API_KEY");

    writeApiKeyToEnv("key-xyz", { jsonMode: false });

    expect(infoSpy).toHaveBeenCalledWith("Detected Next.js project");
    expect(writeSpy).toHaveBeenCalledWith(
      ".env.local",
      "# Environment Variables\nNEXT_PUBLIC_TAMBO_API_KEY=key-xyz\n",
    );
  });
});
