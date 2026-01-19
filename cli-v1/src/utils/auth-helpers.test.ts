/**
 * Tests for authentication helper behavior.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockIsTokenValid = jest.fn<() => boolean>();
const mockVerifySession = jest.fn<() => Promise<boolean>>();
const mockSpinnerStop = jest.fn();
const mockOraStart = jest.fn(() => ({ stop: mockSpinnerStop }));

jest.unstable_mockModule("../lib/device-auth.js", () => ({
  isTokenValid: mockIsTokenValid,
  verifySession: mockVerifySession,
}));

jest.unstable_mockModule("ora", () => ({
  default: jest.fn(() => ({ start: mockOraStart })),
}));

const { requireAuthentication } = await import("./auth-helpers.js");
const { out } = await import("./output.js");

describe("requireAuthentication", () => {
  let jsonSpy: jest.SpiedFunction<typeof out.json>;
  let errorSpy: jest.SpiedFunction<typeof out.error>;

  beforeEach(() => {
    jsonSpy = jest.spyOn(out, "json").mockImplementation(() => undefined);
    errorSpy = jest.spyOn(out, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jsonSpy.mockRestore();
    errorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("returns false and outputs json when no token", async () => {
    mockIsTokenValid.mockReturnValue(false);

    const result = { errors: [] as string[] };
    const isValid = await requireAuthentication({ json: true }, result);

    expect(isValid).toBe(false);
    expect(result.errors).toContain("Not authenticated");
    expect(jsonSpy).toHaveBeenCalledWith(result);
  });

  it("returns false and outputs error when no token in non-json mode", async () => {
    mockIsTokenValid.mockReturnValue(false);

    const result = { errors: [] as string[] };
    const isValid = await requireAuthentication({ json: false }, result);

    expect(isValid).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      "Not authenticated. Run 'tambov1 auth login' first."
    );
  });

  it("returns false when session expired", async () => {
    mockIsTokenValid.mockReturnValue(true);
    mockVerifySession.mockResolvedValue(false);

    const result = { errors: [] as string[] };
    const isValid = await requireAuthentication({ json: true }, result);

    expect(isValid).toBe(false);
    expect(result.errors).toContain("Session expired");
    expect(jsonSpy).toHaveBeenCalledWith(result);
  });

  it("returns true and sets authenticated flag when session valid", async () => {
    mockIsTokenValid.mockReturnValue(true);
    mockVerifySession.mockResolvedValue(true);

    const result = { errors: [] as string[], authenticated: false };
    const isValid = await requireAuthentication({ json: false }, result);

    expect(isValid).toBe(true);
    expect(result.authenticated).toBe(true);
  });
});
