import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";

// Mock token-storage before importing api-client
const mockGetEffectiveSessionToken = jest.fn<() => string | null>();
const mockClearToken = jest.fn();

jest.unstable_mockModule("./token-storage.js", () => ({
  getEffectiveSessionToken: mockGetEffectiveSessionToken,
  clearToken: mockClearToken,
}));

// Mock @trpc/client
const mockTRPCClientError = class TRPCClientError extends Error {
  data?: { code?: string; httpStatus?: number };
  shape?: { data?: { code?: string } };
  constructor(
    message: string,
    opts?: {
      data?: { code?: string; httpStatus?: number };
      shape?: { data?: { code?: string } };
    },
  ) {
    super(message);
    this.name = "TRPCClientError";
    this.data = opts?.data;
    this.shape = opts?.shape;
  }
};

jest.unstable_mockModule("@trpc/client", () => ({
  createTRPCClient: jest.fn(() => ({
    deviceAuth: {
      listSessions: {
        query: jest.fn(),
      },
    },
  })),
  httpLink: jest.fn(() => ({})),
  TRPCClientError: mockTRPCClientError,
}));

const { getConsoleBaseUrl, ApiError, isAuthError } = await import("./api-client.js");

describe("api-client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getConsoleBaseUrl", () => {
    it("returns default URL when env var not set", () => {
      delete process.env.TAMBO_CLI_CONSOLE_BASE_URL;

      const url = getConsoleBaseUrl();

      expect(url).toBe("https://console.tambo.co");
    });

    it("returns custom URL when env var is set", () => {
      process.env.TAMBO_CLI_CONSOLE_BASE_URL = "https://custom.example.com";

      const url = getConsoleBaseUrl();

      expect(url).toBe("https://custom.example.com");
    });
  });

  describe("ApiError", () => {
    it("creates error with message only", () => {
      const error = new ApiError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.name).toBe("ApiError");
      expect(error.statusCode).toBeUndefined();
      expect(error.code).toBeUndefined();
    });

    it("creates error with message and status code", () => {
      const error = new ApiError("Not found", 404);

      expect(error.message).toBe("Not found");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBeUndefined();
    });

    it("creates error with message, status code, and code", () => {
      const error = new ApiError("Unauthorized", 401, "UNAUTHORIZED");

      expect(error.message).toBe("Unauthorized");
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
    });

    it("is an instance of Error", () => {
      const error = new ApiError("Test");

      expect(error instanceof Error).toBe(true);
    });
  });

  describe("isAuthError", () => {
    it("returns false for non-TRPCClientError", () => {
      const error = new Error("Regular error");

      expect(isAuthError(error)).toBe(false);
    });

    it("returns false for null/undefined", () => {
      expect(isAuthError(null)).toBe(false);
      expect(isAuthError(undefined)).toBe(false);
    });

    it("returns true for UNAUTHORIZED code in data", () => {
      const error = new mockTRPCClientError("Auth error", {
        data: { code: "UNAUTHORIZED" },
      });

      expect(isAuthError(error)).toBe(true);
    });

    it("returns true for UNAUTHORIZED code in shape.data", () => {
      const error = new mockTRPCClientError("Auth error", {
        shape: { data: { code: "UNAUTHORIZED" } },
      });

      expect(isAuthError(error)).toBe(true);
    });

    it("returns true for 401 status", () => {
      const error = new mockTRPCClientError("Auth error", {
        data: { httpStatus: 401 },
      });

      expect(isAuthError(error)).toBe(true);
    });

    it("returns true for 403 status", () => {
      const error = new mockTRPCClientError("Auth error", {
        data: { httpStatus: 403 },
      });

      expect(isAuthError(error)).toBe(true);
    });

    it("returns false for other status codes", () => {
      const error = new mockTRPCClientError("Not found", {
        data: { httpStatus: 404 },
      });

      expect(isAuthError(error)).toBe(false);
    });

    it("returns false for TRPCClientError without auth indicators", () => {
      const error = new mockTRPCClientError("Generic error", {
        data: { code: "BAD_REQUEST", httpStatus: 400 },
      });

      expect(isAuthError(error)).toBe(false);
    });
  });
});
