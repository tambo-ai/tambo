/**
 * Tests for auth command behavior and JSON output.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import {
  captureStdout,
  getSubcommand,
  mockProcessExit,
  ProcessExitError,
  setIsTTY,
  withArgs,
} from "../__fixtures__/test-utils.js";

const mockApi = {
  deviceAuth: {
    initiate: {
      mutate: jest.fn<
        () => Promise<{
          verificationUriComplete: string;
          userCode: string;
          expiresIn: number;
        }>
      >(),
    },
    listSessions: {
      query:
        jest.fn<
          () => Promise<
            Array<{ id: string; createdAt: Date; expiresAt: Date | null }>
          >
        >(),
    },
    revokeAllSessions: {
      mutate: jest.fn<() => Promise<{ revokedCount: number }>>(),
    },
  },
};
const mockGetConsoleBaseUrl = jest.fn<() => string>(
  () => "https://console.tambo.co",
);
const mockIsAuthError = jest.fn<(error: unknown) => boolean>();
const mockVerifySession = jest.fn<() => Promise<boolean>>();

const mockRunDeviceAuthFlow =
  jest.fn<
    () => Promise<{ user: { id: string; email?: string; name?: string } }>
  >();

const mockClearToken = jest.fn<() => void>();
const mockGetCurrentUser =
  jest.fn<() => { id: string; email?: string; name?: string } | null>();
const mockGetTokenStoragePath = jest.fn<() => string>(() => "/mock/token.json");
const mockHasStoredToken = jest.fn<() => boolean>();
const mockIsTokenValid = jest.fn<() => boolean>();
const mockLoadToken = jest.fn<() => { expiresAt?: string } | null>();

const mockOraStart = jest.fn(() => ({
  stop: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn(),
}));

jest.unstable_mockModule("../lib/api-client.js", () => ({
  api: mockApi,
  getConsoleBaseUrl: mockGetConsoleBaseUrl,
  isAuthError: mockIsAuthError,
  verifySession: mockVerifySession,
}));

jest.unstable_mockModule("../lib/device-auth.js", () => ({
  runDeviceAuthFlow: mockRunDeviceAuthFlow,
}));

jest.unstable_mockModule("../lib/token-storage.js", () => ({
  clearToken: mockClearToken,
  getCurrentUser: mockGetCurrentUser,
  getTokenStoragePath: mockGetTokenStoragePath,
  hasStoredToken: mockHasStoredToken,
  isTokenValid: mockIsTokenValid,
  loadToken: mockLoadToken,
}));

jest.unstable_mockModule("ora", () => ({
  default: jest.fn(() => ({ start: mockOraStart })),
}));

const { auth } = await import("./auth.js");

describe("auth command", () => {
  let exitSpy: jest.SpiedFunction<typeof process.exit>;
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    exitSpy = mockProcessExit();
    mockIsAuthError.mockReturnValue(false);
    mockHasStoredToken.mockReturnValue(false);
    mockIsTokenValid.mockReturnValue(false);
    mockGetCurrentUser.mockReturnValue(null);
    mockLoadToken.mockReturnValue(null);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    setIsTTY(originalIsTTY);
    jest.clearAllMocks();
  });

  it("returns not authenticated status", async () => {
    const output = await captureStdout(async () => {
      await getSubcommand(auth, "status")?.run?.({
        args: withArgs({ json: true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.authenticated).toBe(false);
    expect(result.tokenPath).toBe("/mock/token.json");
    expect(result.apiEndpoint).toBe("https://console.tambo.co");
  });

  it("runs in TTY mode", async () => {
    setIsTTY(true);

    const output = await captureStdout(async () => {
      await getSubcommand(auth, "status")?.run?.({
        args: withArgs({ json: true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.authenticated).toBe(false);
  });

  it("runs in non-TTY mode", async () => {
    setIsTTY(false);

    const output = await captureStdout(async () => {
      await getSubcommand(auth, "status")?.run?.({
        args: withArgs({ json: true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.authenticated).toBe(false);
  });

  it("returns session invalid when verifySession fails", async () => {
    mockHasStoredToken.mockReturnValue(true);
    mockIsTokenValid.mockReturnValue(true);
    mockVerifySession.mockResolvedValue(false);

    const output = await captureStdout(async () => {
      await getSubcommand(auth, "status")?.run?.({
        args: withArgs({ json: true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.authenticated).toBe(false);
    expect(result.suggestedCommands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ command: "tambov1 auth login" }),
      ]),
    );
  });

  it("returns authenticated status with user info", async () => {
    mockHasStoredToken.mockReturnValue(true);
    mockIsTokenValid.mockReturnValue(true);
    mockVerifySession.mockResolvedValue(true);
    mockLoadToken.mockReturnValue({ expiresAt: "2025-01-01T00:00:00Z" });
    mockGetCurrentUser.mockReturnValue({
      id: "user-1",
      email: "user@test.com",
    });

    const output = await captureStdout(async () => {
      await getSubcommand(auth, "status")?.run?.({
        args: withArgs({ json: true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.authenticated).toBe(true);
    expect(result.user.email).toBe("user@test.com");
  });

  it("returns already authenticated for login", async () => {
    mockHasStoredToken.mockReturnValue(true);
    mockIsTokenValid.mockReturnValue(true);
    mockGetCurrentUser.mockReturnValue({
      id: "user-1",
      email: "user@test.com",
    });

    const output = await captureStdout(async () => {
      await getSubcommand(auth, "login")?.run?.({
        args: withArgs({ json: true, "no-wait": false }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.authenticated).toBe(true);
  });

  it("returns device auth initiation for --no-wait", async () => {
    mockApi.deviceAuth.initiate.mutate.mockResolvedValue({
      verificationUriComplete: "https://example.com",
      userCode: "ABCD",
      expiresIn: 600,
    });

    const output = await captureStdout(async () => {
      await getSubcommand(auth, "login")?.run?.({
        args: withArgs({ json: true, "no-wait": true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.pendingVerification).toBe(true);
    expect(result.verificationUrl).toBe("https://example.com");
  });

  it("completes login via device auth", async () => {
    mockRunDeviceAuthFlow.mockResolvedValue({
      user: { id: "user-1", email: "user@test.com", name: "User" },
    });

    const output = await captureStdout(async () => {
      await getSubcommand(auth, "login")?.run?.({
        args: withArgs({ json: true, "no-wait": false }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.authenticated).toBe(true);
    expect(result.user.email).toBe("user@test.com");
  });

  it("handles login failure", async () => {
    mockRunDeviceAuthFlow.mockRejectedValue(new Error("boom"));

    await expect(
      Promise.resolve(
        getSubcommand(auth, "login")?.run?.({
          args: withArgs({ json: true, "no-wait": false }),
        }),
      ),
    ).rejects.toBeInstanceOf(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("logs out and clears token", async () => {
    mockHasStoredToken.mockReturnValue(true);
    mockGetCurrentUser.mockReturnValue({
      id: "user-1",
      email: "user@test.com",
    });

    const output = await captureStdout(async () => {
      await getSubcommand(auth, "logout")?.run?.({
        args: withArgs({ json: true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(mockClearToken).toHaveBeenCalled();
  });

  it("lists sessions in json mode", async () => {
    mockHasStoredToken.mockReturnValue(true);
    mockIsTokenValid.mockReturnValue(true);
    mockApi.deviceAuth.listSessions.query.mockResolvedValue([
      { id: "s1", createdAt: new Date("2024-01-01"), expiresAt: null },
    ]);

    const output = await captureStdout(async () => {
      await getSubcommand(auth, "sessions")?.run?.({
        args: withArgs({ json: true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.success).toBe(true);
    expect(result.sessions[0].id).toBe("s1");
  });

  it("handles session auth error", async () => {
    mockHasStoredToken.mockReturnValue(true);
    mockIsTokenValid.mockReturnValue(true);
    mockIsAuthError.mockReturnValue(true);
    mockApi.deviceAuth.listSessions.query.mockRejectedValue(
      new Error("expired"),
    );

    const output = await captureStdout(async () => {
      await getSubcommand(auth, "sessions")?.run?.({
        args: withArgs({ json: true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.errors).toContain("Session expired");
    expect(mockClearToken).toHaveBeenCalled();
  });

  it("revokes sessions when --all is provided", async () => {
    mockHasStoredToken.mockReturnValue(true);
    mockIsTokenValid.mockReturnValue(true);
    mockApi.deviceAuth.revokeAllSessions.mutate.mockResolvedValue({
      revokedCount: 2,
    });

    const output = await captureStdout(async () => {
      await getSubcommand(auth, "revoke-session")?.run?.({
        args: withArgs({ json: true, all: true }),
      });
    });
    const result = JSON.parse(output);

    expect(result.revokedCount).toBe(2);
    expect(mockClearToken).toHaveBeenCalled();
  });

  it("requires --all for revoke-session in json mode", async () => {
    mockHasStoredToken.mockReturnValue(true);
    mockIsTokenValid.mockReturnValue(true);

    const output = await captureStdout(async () => {
      await getSubcommand(auth, "revoke-session")?.run?.({
        args: withArgs({ json: true, all: false }),
      });
    });
    const result = JSON.parse(output);

    expect(result.errors).toContain(
      "Use --all flag to revoke sessions in non-interactive mode",
    );
  });

  // Non-JSON output tests - lightweight, just verify commands run without crashing
  describe("non-JSON output", () => {
    it("runs status when not authenticated", async () => {
      await captureStdout(async () => {
        await getSubcommand(auth, "status")?.run?.({
          args: withArgs({ json: false }),
        });
      });
    });

    it("runs status when session expired", async () => {
      mockHasStoredToken.mockReturnValue(true);
      mockIsTokenValid.mockReturnValue(false);

      await captureStdout(async () => {
        await getSubcommand(auth, "status")?.run?.({
          args: withArgs({ json: false }),
        });
      });
    });

    it("runs status when verifySession fails", async () => {
      mockHasStoredToken.mockReturnValue(true);
      mockIsTokenValid.mockReturnValue(true);
      mockVerifySession.mockResolvedValue(false);

      await captureStdout(async () => {
        await getSubcommand(auth, "status")?.run?.({
          args: withArgs({ json: false }),
        });
      });
    });

    it("runs status when authenticated with user info", async () => {
      mockHasStoredToken.mockReturnValue(true);
      mockIsTokenValid.mockReturnValue(true);
      mockVerifySession.mockResolvedValue(true);
      mockLoadToken.mockReturnValue({
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      mockGetCurrentUser.mockReturnValue({
        id: "user-1",
        email: "user@test.com",
        name: "Test User",
      });

      await captureStdout(async () => {
        await getSubcommand(auth, "status")?.run?.({
          args: withArgs({ json: false }),
        });
      });
    });

    it("runs login when already authenticated", async () => {
      mockHasStoredToken.mockReturnValue(true);
      mockIsTokenValid.mockReturnValue(true);
      mockGetCurrentUser.mockReturnValue({
        id: "user-1",
        email: "user@test.com",
      });

      await captureStdout(async () => {
        await getSubcommand(auth, "login")?.run?.({
          args: withArgs({ json: false, "no-wait": false }),
        });
      });
    });

    it("runs login with --no-wait", async () => {
      mockApi.deviceAuth.initiate.mutate.mockResolvedValue({
        verificationUriComplete: "https://example.com/verify",
        userCode: "ABCD-1234",
        expiresIn: 600,
      });

      await captureStdout(async () => {
        await getSubcommand(auth, "login")?.run?.({
          args: withArgs({ json: false, "no-wait": true }),
        });
      });
    });

    it("exits on --no-wait initiation error", async () => {
      mockApi.deviceAuth.initiate.mutate.mockRejectedValue(
        new Error("Network failure"),
      );

      await expect(
        Promise.resolve(
          getSubcommand(auth, "login")?.run?.({
            args: withArgs({ json: false, "no-wait": true }),
          }),
        ),
      ).rejects.toBeInstanceOf(ProcessExitError);
    });

    it("runs successful login", async () => {
      mockRunDeviceAuthFlow.mockResolvedValue({
        user: { id: "user-1", email: "user@test.com", name: "User" },
      });

      await captureStdout(async () => {
        await getSubcommand(auth, "login")?.run?.({
          args: withArgs({ json: false, "no-wait": false }),
        });
      });
    });

    it("exits on login failure", async () => {
      mockRunDeviceAuthFlow.mockRejectedValue(new Error("Auth failed"));

      await expect(
        Promise.resolve(
          getSubcommand(auth, "login")?.run?.({
            args: withArgs({ json: false, "no-wait": false }),
          }),
        ),
      ).rejects.toBeInstanceOf(ProcessExitError);
    });

    it("runs logout when authenticated", async () => {
      mockHasStoredToken.mockReturnValue(true);
      mockGetCurrentUser.mockReturnValue({
        id: "user-1",
        email: "user@test.com",
      });

      await captureStdout(async () => {
        await getSubcommand(auth, "logout")?.run?.({
          args: withArgs({ json: false }),
        });
      });
    });

    it("runs logout when not authenticated", async () => {
      await captureStdout(async () => {
        await getSubcommand(auth, "logout")?.run?.({
          args: withArgs({ json: false }),
        });
      });
    });

    it("runs sessions when not authenticated", async () => {
      await captureStdout(async () => {
        await getSubcommand(auth, "sessions")?.run?.({
          args: withArgs({ json: false }),
        });
      });
    });

    it("runs sessions with results", async () => {
      mockHasStoredToken.mockReturnValue(true);
      mockIsTokenValid.mockReturnValue(true);
      mockApi.deviceAuth.listSessions.query.mockResolvedValue([
        {
          id: "session-123456789abcdef",
          createdAt: new Date("2024-01-01"),
          expiresAt: new Date("2025-01-01"),
        },
      ]);

      await captureStdout(async () => {
        await getSubcommand(auth, "sessions")?.run?.({
          args: withArgs({ json: false }),
        });
      });
    });

    it("runs sessions with empty results", async () => {
      mockHasStoredToken.mockReturnValue(true);
      mockIsTokenValid.mockReturnValue(true);
      mockApi.deviceAuth.listSessions.query.mockResolvedValue([]);

      await captureStdout(async () => {
        await getSubcommand(auth, "sessions")?.run?.({
          args: withArgs({ json: false }),
        });
      });
    });

    it("handles sessions auth error", async () => {
      mockHasStoredToken.mockReturnValue(true);
      mockIsTokenValid.mockReturnValue(true);
      mockIsAuthError.mockReturnValue(true);
      mockApi.deviceAuth.listSessions.query.mockRejectedValue(
        new Error("expired"),
      );

      await captureStdout(async () => {
        await getSubcommand(auth, "sessions")?.run?.({
          args: withArgs({ json: false }),
        });
      });
    });

    it("handles sessions non-auth error", async () => {
      mockHasStoredToken.mockReturnValue(true);
      mockIsTokenValid.mockReturnValue(true);
      mockIsAuthError.mockReturnValue(false);
      mockApi.deviceAuth.listSessions.query.mockRejectedValue(
        new Error("Network error"),
      );

      await captureStdout(async () => {
        await getSubcommand(auth, "sessions")?.run?.({
          args: withArgs({ json: false }),
        });
      });
    });

    it("runs revoke-session when not authenticated", async () => {
      await captureStdout(async () => {
        await getSubcommand(auth, "revoke-session")?.run?.({
          args: withArgs({ json: false, all: false }),
        });
      });
    });

    it("runs revoke-session without --all", async () => {
      mockHasStoredToken.mockReturnValue(true);
      mockIsTokenValid.mockReturnValue(true);

      await captureStdout(async () => {
        await getSubcommand(auth, "revoke-session")?.run?.({
          args: withArgs({ json: false, all: false }),
        });
      });
    });

    it("runs revoke-session success", async () => {
      mockHasStoredToken.mockReturnValue(true);
      mockIsTokenValid.mockReturnValue(true);
      mockApi.deviceAuth.revokeAllSessions.mutate.mockResolvedValue({
        revokedCount: 2,
      });

      await captureStdout(async () => {
        await getSubcommand(auth, "revoke-session")?.run?.({
          args: withArgs({ json: false, all: true }),
        });
      });
    });

    it("runs revoke-session with zero revoked", async () => {
      mockHasStoredToken.mockReturnValue(true);
      mockIsTokenValid.mockReturnValue(true);
      mockApi.deviceAuth.revokeAllSessions.mutate.mockResolvedValue({
        revokedCount: 0,
      });

      await captureStdout(async () => {
        await getSubcommand(auth, "revoke-session")?.run?.({
          args: withArgs({ json: false, all: true }),
        });
      });
    });

    it("exits on revoke-session error", async () => {
      mockHasStoredToken.mockReturnValue(true);
      mockIsTokenValid.mockReturnValue(true);
      mockApi.deviceAuth.revokeAllSessions.mutate.mockRejectedValue(
        new Error("Server error"),
      );

      await expect(
        Promise.resolve(
          getSubcommand(auth, "revoke-session")?.run?.({
            args: withArgs({ json: false, all: true }),
          }),
        ),
      ).rejects.toBeInstanceOf(ProcessExitError);
    });
  });
});
