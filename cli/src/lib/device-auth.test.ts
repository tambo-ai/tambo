import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

// ── Mock state ──────────────────────────────────────────────────────────────

let mockIsInteractive = true;
let mockOpenShouldFail = false;
let mockClipboardContent: string | null = null;
let mockClipboardShouldFail = false;
let mockPollStatus: "pending" | "complete" | "expired" = "complete";
let mockPollSessionToken = "mock-session-token";
let mockPollExpiresAt = "2099-01-01T00:00:00Z";
let mockInitiateShouldFail = false;

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.unstable_mockModule("../utils/interactive.js", () => ({
  isInteractive: () => mockIsInteractive,
}));

jest.unstable_mockModule("open", () => ({
  default: async () => {
    if (mockOpenShouldFail) throw new Error("No display");
  },
}));

jest.unstable_mockModule("clipboardy", () => ({
  default: {
    write: async (text: string) => {
      if (mockClipboardShouldFail) throw new Error("No clipboard");
      mockClipboardContent = text;
    },
  },
}));

jest.unstable_mockModule("ora", () => ({
  default: () => ({
    start: function () {
      return this;
    },
    stop: function () {
      return this;
    },
    succeed: function () {
      return this;
    },
    fail: function () {
      return this;
    },
    set text(_val: string) {
      // no-op
    },
  }),
}));

jest.unstable_mockModule("./api-client.js", () => ({
  api: {
    deviceAuth: {
      initiate: {
        mutate: async () => {
          if (mockInitiateShouldFail) {
            const err = new Error("Server error");
            (err as Record<string, unknown>).statusCode = 500;
            throw err;
          }
          return {
            deviceCode: "mock-device-code",
            userCode: "ABCD-1234",
            verificationUri: "https://console.tambo.co/device",
            verificationUriComplete:
              "https://console.tambo.co/device?user_code=ABCD1234",
            interval: 1,
          };
        },
      },
      poll: {
        query: async () => {
          if (mockPollStatus === "complete") {
            return {
              status: "complete",
              sessionToken: mockPollSessionToken,
              expiresAt: mockPollExpiresAt,
            };
          }
          if (mockPollStatus === "expired") {
            return { status: "expired" };
          }
          return { status: "pending" };
        },
      },
    },
    user: {
      getUser: {
        query: async () => ({
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
        }),
      },
    },
  },
  ApiError: class ApiError extends Error {
    statusCode?: number;
    code?: string;
  },
  verifySession: async () => true,
}));

jest.unstable_mockModule("./token-storage.js", () => ({
  saveToken: async () => {},
  setInMemoryToken: () => {},
  clearToken: () => {},
  getCurrentUser: () => null,
  isTokenValid: () => false,
}));

// ── Import after mocks ──────────────────────────────────────────────────────

const { runDeviceAuthFlow } = await import("./device-auth.js");

// ── Capture console output ──────────────────────────────────────────────────

let logs: string[] = [];
let errorLogs: string[] = [];
let originalLog: typeof console.log;
let originalError: typeof console.error;

beforeEach(() => {
  // Reset mock state
  mockIsInteractive = true;
  mockOpenShouldFail = false;
  mockClipboardContent = null;
  mockClipboardShouldFail = false;
  mockPollStatus = "complete";
  mockPollSessionToken = "mock-session-token";
  mockPollExpiresAt = "2099-01-01T00:00:00Z";
  mockInitiateShouldFail = false;

  // Capture console
  logs = [];
  errorLogs = [];
  originalLog = console.log;
  originalError = console.error;
  console.log = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  };
  console.error = (...args: unknown[]) => {
    errorLogs.push(args.map(String).join(" "));
  };
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe("runDeviceAuthFlow", () => {
  describe("interactive mode", () => {
    beforeEach(() => {
      mockIsInteractive = true;
    });

    it("should open browser and return auth result on success", async () => {
      const result = await runDeviceAuthFlow();

      expect(result.sessionToken).toBe("mock-session-token");
      expect(result.user.email).toBe("test@example.com");

      const output = logs.join("\n");
      expect(output).toContain("Browser opened for authentication");
    });

    it("should copy user code to clipboard", async () => {
      await runDeviceAuthFlow();

      expect(mockClipboardContent).toBe("ABCD-1234");
      const output = logs.join("\n");
      expect(output).toContain("User code copied to clipboard");
    });

    it("should not print raw URL to stdout", async () => {
      await runDeviceAuthFlow();

      const output = logs.join("\n");
      expect(output).not.toContain(
        "console.tambo.co/device?user_code=ABCD1234",
      );
    });

    it("should not print stderr warning", async () => {
      await runDeviceAuthFlow();

      expect(errorLogs.join("\n")).not.toContain("one-time code");
    });

    it("should show yellow warning when browser fails to open", async () => {
      mockOpenShouldFail = true;

      await runDeviceAuthFlow();

      const output = logs.join("\n");
      expect(output).toContain("Could not open browser automatically");
    });

    it("should silently handle clipboard failure", async () => {
      mockClipboardShouldFail = true;

      const result = await runDeviceAuthFlow();

      expect(result.sessionToken).toBe("mock-session-token");
      const output = logs.join("\n");
      expect(output).not.toContain("copied to clipboard");
    });
  });

  describe("non-interactive mode", () => {
    beforeEach(() => {
      mockIsInteractive = false;
    });

    it("should print raw URL to stdout for machine parsing", async () => {
      await runDeviceAuthFlow();

      const output = logs.join("\n");
      expect(output).toContain(
        "https://console.tambo.co/device?user_code=ABCD1234",
      );
    });

    it("should print stderr warning before raw URL", async () => {
      await runDeviceAuthFlow();

      expect(errorLogs.join("\n")).toContain(
        "auth URL below contains a one-time code",
      );
    });

    it("should still open browser", async () => {
      await runDeviceAuthFlow();

      const output = logs.join("\n");
      expect(output).toContain("Browser opened for authentication");
    });

    it("should still attempt clipboard copy", async () => {
      await runDeviceAuthFlow();

      expect(mockClipboardContent).toBe("ABCD-1234");
    });

    it("should show gray message when browser fails to open", async () => {
      mockOpenShouldFail = true;

      await runDeviceAuthFlow();

      const output = logs.join("\n");
      expect(output).toContain(
        "Could not open browser. Use the URL above to authenticate.",
      );
      // Should NOT show the yellow interactive warning
      expect(output).not.toContain("Could not open browser automatically");
    });

    it("should display user code and verification URL", async () => {
      await runDeviceAuthFlow();

      const output = logs.join("\n");
      expect(output).toContain("ABCD-1234");
      expect(output).toContain("console.tambo.co/device");
    });
  });

  describe("error handling", () => {
    it("should throw DeviceAuthError when code expires", async () => {
      mockPollStatus = "expired";

      await expect(runDeviceAuthFlow()).rejects.toThrow("Device code expired");
    });

    it("should throw DeviceAuthError when initiation fails", async () => {
      mockInitiateShouldFail = true;

      await expect(runDeviceAuthFlow()).rejects.toThrow();
    });

    it("should throw when session token is missing from poll response", async () => {
      mockPollSessionToken = "";

      await expect(runDeviceAuthFlow()).rejects.toThrow(
        "no session token received",
      );
    });
  });
});
