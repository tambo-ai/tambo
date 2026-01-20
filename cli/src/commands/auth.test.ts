import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

// Mock token-storage module
let mockHasStoredToken = false;
let mockIsTokenValid = false;
let mockTokenData: { expiresAt?: string } | null = null;
let mockCurrentUser: { id: string; email?: string; name?: string } | null =
  null;
let mockClearTokenCalled = false;

jest.unstable_mockModule("../lib/token-storage.js", () => ({
  hasStoredToken: () => mockHasStoredToken,
  isTokenValid: () => mockIsTokenValid,
  loadToken: () => mockTokenData,
  getCurrentUser: () => mockCurrentUser,
  clearToken: () => {
    mockClearTokenCalled = true;
  },
  getTokenStoragePath: () => "/mock/.tambo/token.json",
}));

// Mock api-client module
let mockVerifySessionResult = true;
let mockSessionsList: {
  id: string;
  createdAt: Date;
  expiresAt?: Date;
}[] = [];
let mockApiError: Error | null = null;

jest.unstable_mockModule("../lib/api-client.js", () => ({
  api: {
    deviceAuth: {
      listSessions: {
        query: async () => {
          if (mockApiError) throw mockApiError;
          return mockSessionsList;
        },
      },
      revokeSession: {
        mutate: async () => {
          if (mockApiError) throw mockApiError;
        },
      },
      revokeAllSessions: {
        mutate: async () => {
          if (mockApiError) throw mockApiError;
          return { revokedCount: 1 };
        },
      },
    },
  },
  ApiError: class ApiError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.status = status;
    }
  },
  verifySession: async () => mockVerifySessionResult,
  // Note: This is the tRPC API (apps/web), not the NestJS API (api.tambo.co)
  getConsoleBaseUrl: () => "https://console.tambo.co",
  isAuthError: (error: unknown) => {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return true;
    return false;
  },
}));

// Mock device-auth module
let mockDeviceAuthSuccess = true;
jest.unstable_mockModule("../lib/device-auth.js", () => ({
  runDeviceAuthFlow: async () => {
    if (!mockDeviceAuthSuccess) {
      throw new Error("Device auth failed");
    }
    return {
      sessionToken: "mock-token",
      user: { id: "user-1", email: "test@example.com" },
    };
  },
}));

// Mock inquirer prompts
let mockConfirmResult = true;
let mockSelectResult = "__cancel__";
jest.unstable_mockModule("@inquirer/prompts", () => ({
  confirm: async () => mockConfirmResult,
  select: async () => mockSelectResult,
}));

// Mock ora spinner
jest.unstable_mockModule("ora", () => ({
  default: () => ({
    start: function () {
      return this;
    },
    succeed: function () {
      return this;
    },
    fail: function () {
      return this;
    },
    stop: function () {
      return this;
    },
    text: "",
  }),
}));

// Mock chalk (pass through)
jest.unstable_mockModule("chalk", () => ({
  default: new Proxy(
    {},
    {
      get: () => (text: string) => text,
    },
  ),
}));

// Mock cli-table3
jest.unstable_mockModule("cli-table3", () => ({
  default: class MockTable {
    rows: string[][] = [];
    push(...rows: string[][]) {
      this.rows.push(...rows);
    }
    toString() {
      return this.rows.map((r) => r.join(" | ")).join("\n");
    }
  },
}));

// Import after mocking
const {
  handleAuthStatus,
  handleAuthLogin,
  handleAuthLogout,
  handleAuthSessions,
  handleAuthRevokeSession,
} = await import("./auth.js");

describe("auth commands", () => {
  let consoleLogs: string[] = [];
  const originalLog = console.log;

  beforeEach(() => {
    // Reset all mocks
    mockHasStoredToken = false;
    mockIsTokenValid = false;
    mockTokenData = null;
    mockCurrentUser = null;
    mockClearTokenCalled = false;
    mockVerifySessionResult = true;
    mockSessionsList = [];
    mockApiError = null;
    mockDeviceAuthSuccess = true;
    mockConfirmResult = true;
    mockSelectResult = "__cancel__";

    // Capture console.log
    consoleLogs = [];
    console.log = (...args: unknown[]) => {
      consoleLogs.push(args.map(String).join(" "));
    };
  });

  afterEach(() => {
    console.log = originalLog;
  });

  describe("handleAuthStatus", () => {
    it("returns 1 when not authenticated (no token)", async () => {
      mockHasStoredToken = false;

      const result = await handleAuthStatus({});

      expect(result).toBe(1);
      expect(consoleLogs.some((l) => l.includes("Not authenticated"))).toBe(
        true,
      );
    });

    it("returns 1 in quiet mode when not authenticated", async () => {
      mockHasStoredToken = false;

      const result = await handleAuthStatus({ quiet: true });

      expect(result).toBe(1);
      expect(consoleLogs.length).toBe(0);
    });

    it("returns 1 when token is expired", async () => {
      mockHasStoredToken = true;
      mockIsTokenValid = false;

      const result = await handleAuthStatus({});

      expect(result).toBe(1);
      expect(consoleLogs.some((l) => l.includes("Session expired"))).toBe(true);
    });

    it("returns 1 when session verification fails", async () => {
      mockHasStoredToken = true;
      mockIsTokenValid = true;
      mockVerifySessionResult = false;

      const result = await handleAuthStatus({});

      expect(result).toBe(1);
      expect(
        consoleLogs.some((l) => l.includes("Session revoked or expired")),
      ).toBe(true);
    });

    it("returns 0 when authenticated and verified", async () => {
      mockHasStoredToken = true;
      mockIsTokenValid = true;
      mockVerifySessionResult = true;
      mockCurrentUser = { id: "user-1", email: "test@example.com" };
      mockTokenData = {
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = await handleAuthStatus({});

      expect(result).toBe(0);
      expect(consoleLogs.some((l) => l.includes("Authenticated"))).toBe(true);
      expect(consoleLogs.some((l) => l.includes("test@example.com"))).toBe(
        true,
      );
    });

    it("returns 0 in quiet mode when authenticated", async () => {
      mockHasStoredToken = true;
      mockIsTokenValid = true;
      mockVerifySessionResult = true;

      const result = await handleAuthStatus({ quiet: true });

      expect(result).toBe(0);
    });
  });

  describe("handleAuthLogin", () => {
    it("prompts for re-auth when already authenticated", async () => {
      mockHasStoredToken = true;
      mockIsTokenValid = true;
      mockCurrentUser = { id: "user-1", email: "test@example.com" };
      mockConfirmResult = false;

      const result = await handleAuthLogin();

      expect(result).toBe(0);
      expect(consoleLogs.some((l) => l.includes("Already authenticated"))).toBe(
        true,
      );
      expect(consoleLogs.some((l) => l.includes("Keeping existing"))).toBe(
        true,
      );
    });

    it("runs device auth flow when not authenticated", async () => {
      mockHasStoredToken = false;
      mockDeviceAuthSuccess = true;

      const result = await handleAuthLogin();

      expect(result).toBe(0);
      expect(
        consoleLogs.some((l) => l.includes("Successfully authenticated")),
      ).toBe(true);
    });

    it("returns 1 when device auth fails", async () => {
      mockHasStoredToken = false;
      mockDeviceAuthSuccess = false;

      const result = await handleAuthLogin();

      expect(result).toBe(1);
      expect(consoleLogs.some((l) => l.includes("Authentication failed"))).toBe(
        true,
      );
    });

    it("re-authenticates when user confirms", async () => {
      mockHasStoredToken = true;
      mockIsTokenValid = true;
      mockConfirmResult = true;
      mockDeviceAuthSuccess = true;

      const result = await handleAuthLogin();

      expect(result).toBe(0);
      expect(
        consoleLogs.some((l) => l.includes("Successfully authenticated")),
      ).toBe(true);
    });
  });

  describe("handleAuthLogout", () => {
    it("returns 0 when not authenticated", async () => {
      mockHasStoredToken = false;

      const result = await handleAuthLogout({});

      expect(result).toBe(0);
      expect(
        consoleLogs.some((l) => l.includes("Not currently authenticated")),
      ).toBe(true);
    });

    it("prompts for confirmation and logs out", async () => {
      mockHasStoredToken = true;
      mockCurrentUser = { id: "user-1", email: "test@example.com" };
      mockConfirmResult = true;

      const result = await handleAuthLogout({});

      expect(result).toBe(0);
      expect(mockClearTokenCalled).toBe(true);
      expect(
        consoleLogs.some((l) => l.includes("Successfully logged out")),
      ).toBe(true);
    });

    it("cancels logout when user declines", async () => {
      mockHasStoredToken = true;
      mockConfirmResult = false;

      const result = await handleAuthLogout({});

      expect(result).toBe(0);
      expect(mockClearTokenCalled).toBe(false);
      expect(consoleLogs.some((l) => l.includes("Cancelled"))).toBe(true);
    });

    it("skips confirmation with force flag", async () => {
      mockHasStoredToken = true;

      const result = await handleAuthLogout({ force: true });

      expect(result).toBe(0);
      expect(mockClearTokenCalled).toBe(true);
      expect(
        consoleLogs.some((l) => l.includes("Successfully logged out")),
      ).toBe(true);
    });
  });

  describe("handleAuthSessions", () => {
    it("returns 1 when not authenticated", async () => {
      mockHasStoredToken = false;

      const result = await handleAuthSessions();

      expect(result).toBe(1);
      expect(consoleLogs.some((l) => l.includes("Not authenticated"))).toBe(
        true,
      );
    });

    it("lists sessions when authenticated", async () => {
      mockHasStoredToken = true;
      mockIsTokenValid = true;
      mockSessionsList = [
        {
          id: "session-1-long-id-for-truncation",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
        },
      ];

      const result = await handleAuthSessions();

      expect(result).toBe(0);
      expect(consoleLogs.some((l) => l.includes("1 session"))).toBe(true);
    });

    it("shows message when no sessions found", async () => {
      mockHasStoredToken = true;
      mockIsTokenValid = true;
      mockSessionsList = [];

      const result = await handleAuthSessions();

      expect(result).toBe(0);
      expect(
        consoleLogs.some((l) => l.includes("No active CLI sessions")),
      ).toBe(true);
    });
  });

  describe("handleAuthRevokeSession", () => {
    it("returns 1 when not authenticated", async () => {
      mockHasStoredToken = false;

      const result = await handleAuthRevokeSession({});

      expect(result).toBe(1);
      expect(consoleLogs.some((l) => l.includes("Not authenticated"))).toBe(
        true,
      );
    });

    it("cancels when user selects cancel in picker", async () => {
      mockHasStoredToken = true;
      mockIsTokenValid = true;
      mockSessionsList = [
        {
          id: "session-1-long-id-for-truncation",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
        },
      ];
      mockSelectResult = "__cancel__";

      const result = await handleAuthRevokeSession({});

      expect(result).toBe(0);
      expect(consoleLogs.some((l) => l.includes("Cancelled"))).toBe(true);
    });

    it("revokes selected session", async () => {
      mockHasStoredToken = true;
      mockIsTokenValid = true;
      mockSessionsList = [
        {
          id: "session-to-revoke-long-id",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
        },
      ];
      mockSelectResult = "session-to-revoke-long-id";

      const result = await handleAuthRevokeSession({});

      // Just verify successful return code
      expect(result).toBe(0);
    });

    it("handles revoke all with confirmation", async () => {
      mockHasStoredToken = true;
      mockIsTokenValid = true;
      mockConfirmResult = true;

      const result = await handleAuthRevokeSession({ all: true });

      expect(result).toBe(0);
    });

    it("cancels revoke all when user declines", async () => {
      mockHasStoredToken = true;
      mockIsTokenValid = true;
      mockConfirmResult = false;

      const result = await handleAuthRevokeSession({ all: true });

      expect(result).toBe(0);
      expect(consoleLogs.some((l) => l.includes("Cancelled"))).toBe(true);
    });

    it("handles API error when revoking session", async () => {
      mockHasStoredToken = true;
      mockIsTokenValid = true;
      mockSessionsList = [
        {
          id: "session-1-long-id-for-truncation",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
        },
      ];
      mockSelectResult = "session-1-long-id-for-truncation";
      mockApiError = new Error("Server error");

      const result = await handleAuthRevokeSession({});

      expect(result).toBe(1);
    });
  });

  describe("handleAuthSessions error handling", () => {
    it("handles auth error and clears token", async () => {
      mockHasStoredToken = true;
      mockIsTokenValid = true;
      mockApiError = new Error("UNAUTHORIZED");

      const result = await handleAuthSessions();

      expect(result).toBe(1);
      expect(mockClearTokenCalled).toBe(true);
    });

    it("handles generic API error", async () => {
      mockHasStoredToken = true;
      mockIsTokenValid = true;
      // Create an ApiError-like object
      const apiError = new Error("Server error") as Error & { status?: number };
      apiError.status = 500;
      mockApiError = apiError;

      const result = await handleAuthSessions();

      expect(result).toBe(1);
    });
  });
});
