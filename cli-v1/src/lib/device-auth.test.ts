import {
  describe,
  expect,
  it,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

const mockOraStart = jest.fn();
const mockOraSucceed = jest.fn();
const mockOraFail = jest.fn();
const mockOraStop = jest.fn();
const mockOra = jest.fn(() => ({
  start: mockOraStart.mockReturnThis(),
  succeed: mockOraSucceed,
  fail: mockOraFail,
  stop: mockOraStop,
  text: "",
}));

jest.unstable_mockModule("ora", () => ({
  default: mockOra,
}));

const mockClipboardWrite = jest.fn<(text: string) => Promise<void>>();
jest.unstable_mockModule("clipboardy", () => ({
  default: {
    write: mockClipboardWrite,
  },
}));

const mockOpen =
  jest.fn<(url: string, opts: { wait: boolean }) => Promise<void>>();
jest.unstable_mockModule("open", () => ({
  default: mockOpen,
}));

interface InitiateResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
  interval: number;
}

interface PollResponse {
  status: string;
  sessionToken?: string | null;
  expiresAt?: string | null;
}

interface UserResponse {
  id: string;
  email: string | null;
  name: string | null;
}

const mockApiDeviceAuthInitiate = jest.fn<() => Promise<InitiateResponse>>();
const mockApiDeviceAuthPoll = jest.fn<() => Promise<PollResponse>>();
const mockApiUserGetUser = jest.fn<() => Promise<UserResponse>>();

class MockApiError extends Error {
  code?: string;
  statusCode?: number;
  constructor(message: string, code?: string, statusCode?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

const mockVerifySession = jest.fn<() => Promise<boolean>>();
jest.unstable_mockModule("./api-client.js", () => ({
  api: {
    deviceAuth: {
      initiate: { mutate: mockApiDeviceAuthInitiate },
      poll: { query: mockApiDeviceAuthPoll },
    },
    user: {
      getUser: { query: mockApiUserGetUser },
    },
  },
  ApiError: MockApiError,
  verifySession: mockVerifySession,
}));

const mockIsInteractive = jest.fn<() => boolean>();
jest.unstable_mockModule("../utils/interactive.js", () => ({
  isInteractive: mockIsInteractive,
}));

interface StoredToken {
  sessionToken: string;
  expiresAt: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
  };
  storedAt: string;
}
const mockSaveToken = jest.fn<(token: StoredToken) => Promise<void>>();
const mockSetInMemoryToken = jest.fn();
jest.unstable_mockModule("./token-storage.js", () => ({
  saveToken: mockSaveToken,
  setInMemoryToken: mockSetInMemoryToken,
  clearToken: jest.fn(),
  getCurrentUser: jest.fn(),
  isTokenValid: jest.fn(),
}));

// Suppress console output
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

const { runDeviceAuthFlow, DeviceAuthError } = await import("./device-auth.js");

describe("device-auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
    mockIsInteractive.mockReturnValue(false);
    mockSaveToken.mockResolvedValue(undefined);
    mockOpen.mockResolvedValue(undefined);
    mockClipboardWrite.mockResolvedValue(undefined);
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe("runDeviceAuthFlow", () => {
    it("throws DeviceAuthError when initiate fails with ApiError", async () => {
      mockApiDeviceAuthInitiate.mockRejectedValue(
        new MockApiError("Network error", "NETWORK_ERROR"),
      );

      await expect(runDeviceAuthFlow()).rejects.toThrow(DeviceAuthError);
    });

    it("rethrows non-ApiError during initiation", async () => {
      mockApiDeviceAuthInitiate.mockRejectedValue(new Error("Unknown error"));

      await expect(runDeviceAuthFlow()).rejects.toThrow("Unknown error");
    });

    it("returns auth result on successful completion", async () => {
      mockApiDeviceAuthInitiate.mockResolvedValue({
        deviceCode: "device123",
        userCode: "ABC123",
        verificationUri: "https://auth.example.com",
        verificationUriComplete: "https://auth.example.com?code=ABC123",
        interval: 0,
      });
      mockApiDeviceAuthPoll.mockResolvedValue({
        status: "complete",
        sessionToken: "token123",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      mockApiUserGetUser.mockResolvedValue({
        id: "user1",
        email: "test@example.com",
        name: "Test User",
      });

      const result = await runDeviceAuthFlow();

      expect(result).toEqual({
        sessionToken: "token123",
        user: {
          id: "user1",
          email: "test@example.com",
          name: "Test User",
        },
      });
    }, 10000);

    it("saves token on successful auth", async () => {
      mockApiDeviceAuthInitiate.mockResolvedValue({
        deviceCode: "device123",
        userCode: "ABC123",
        verificationUri: "https://auth.example.com",
        verificationUriComplete: "https://auth.example.com?code=ABC123",
        interval: 0,
      });
      mockApiDeviceAuthPoll.mockResolvedValue({
        status: "complete",
        sessionToken: "token123",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      mockApiUserGetUser.mockResolvedValue({
        id: "user1",
        email: "test@example.com",
        name: "Test User",
      });

      await runDeviceAuthFlow();

      expect(mockSaveToken).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionToken: "token123",
          user: expect.objectContaining({ id: "user1" }),
        }),
      );
    }, 10000);

    it("throws when poll returns complete without session token", async () => {
      mockApiDeviceAuthInitiate.mockResolvedValue({
        deviceCode: "device123",
        userCode: "ABC123",
        verificationUri: "https://auth.example.com",
        verificationUriComplete: "https://auth.example.com?code=ABC123",
        interval: 0,
      });
      mockApiDeviceAuthPoll.mockResolvedValue({
        status: "complete",
        sessionToken: null,
      });

      await expect(runDeviceAuthFlow()).rejects.toThrow(/no session token/);
    }, 10000);

    it("throws when poll returns complete without expiresAt", async () => {
      mockApiDeviceAuthInitiate.mockResolvedValue({
        deviceCode: "device123",
        userCode: "ABC123",
        verificationUri: "https://auth.example.com",
        verificationUriComplete: "https://auth.example.com?code=ABC123",
        interval: 0,
      });
      mockApiDeviceAuthPoll.mockResolvedValue({
        status: "complete",
        sessionToken: "token123",
        expiresAt: null,
      });

      await expect(runDeviceAuthFlow()).rejects.toThrow(DeviceAuthError);
    }, 10000);

    it("throws on expired code", async () => {
      mockApiDeviceAuthInitiate.mockResolvedValue({
        deviceCode: "device123",
        userCode: "ABC123",
        verificationUri: "https://auth.example.com",
        verificationUriComplete: "https://auth.example.com?code=ABC123",
        interval: 0,
      });
      mockApiDeviceAuthPoll.mockResolvedValue({
        status: "expired",
      });

      await expect(runDeviceAuthFlow()).rejects.toThrow(/expired/);
    }, 10000);

    it("throws on invalid device code (404)", async () => {
      mockApiDeviceAuthInitiate.mockResolvedValue({
        deviceCode: "device123",
        userCode: "ABC123",
        verificationUri: "https://auth.example.com",
        verificationUriComplete: "https://auth.example.com?code=ABC123",
        interval: 0,
      });
      mockApiDeviceAuthPoll.mockRejectedValue(
        new MockApiError("Not found", "INVALID_DEVICE_CODE", 404),
      );

      await expect(runDeviceAuthFlow()).rejects.toThrow(/Invalid device code/);
    }, 10000);

    it("throws on auth error (401)", async () => {
      mockApiDeviceAuthInitiate.mockResolvedValue({
        deviceCode: "device123",
        userCode: "ABC123",
        verificationUri: "https://auth.example.com",
        verificationUriComplete: "https://auth.example.com?code=ABC123",
        interval: 0,
      });
      mockApiDeviceAuthPoll.mockRejectedValue(
        new MockApiError("Unauthorized", "UNAUTHORIZED", 401),
      );

      await expect(runDeviceAuthFlow()).rejects.toThrow(
        /Authentication failed/,
      );
    }, 10000);

    it("throws on user info fetch failure", async () => {
      mockApiDeviceAuthInitiate.mockResolvedValue({
        deviceCode: "device123",
        userCode: "ABC123",
        verificationUri: "https://auth.example.com",
        verificationUriComplete: "https://auth.example.com?code=ABC123",
        interval: 0,
      });
      mockApiDeviceAuthPoll.mockResolvedValue({
        status: "complete",
        sessionToken: "token123",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      mockApiUserGetUser.mockRejectedValue(new Error("User fetch failed"));

      await expect(runDeviceAuthFlow()).rejects.toThrow(
        /Failed to fetch user info/,
      );
    }, 10000);
  });

  describe("DeviceAuthError", () => {
    it("creates error with message and code", () => {
      const error = new DeviceAuthError("Test error", "TEST_CODE");

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.name).toBe("DeviceAuthError");
    });

    it("creates error without code", () => {
      const error = new DeviceAuthError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.code).toBeUndefined();
    });
  });
});
