// Mock all external dependencies BEFORE any imports that might use them
// This is necessary because auth.ts has transitive dependencies on modules
// that use ESM features not supported by Jest

jest.mock("@/lib/env", () => ({
  env: {
    GOOGLE_CLIENT_ID: "test-google-client-id",
    GOOGLE_CLIENT_SECRET: "test-google-client-secret",
    GITHUB_CLIENT_ID: "test-github-client-id",
    GITHUB_CLIENT_SECRET: "test-github-client-secret",
    NEXTAUTH_SECRET: "test-secret",
  },
}));

jest.mock("@/lib/nextauth-supabase-adapter", () => ({
  SupabaseAdapter: jest.fn(),
}));

jest.mock("@tambo-ai-cloud/core", () => ({
  isEmailAllowed: jest.fn(),
  refreshOidcToken: jest.fn(),
  SessionSource: { Browser: "browser" },
}));

jest.mock("@tambo-ai-cloud/db", () => ({
  getDb: jest.fn(),
  schema: { sessions: {} },
}));

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}));

jest.mock("resend", () => ({
  Resend: jest.fn(),
}));

jest.mock("next-auth/providers/email", () => jest.fn());
jest.mock("next-auth/providers/github", () => jest.fn());
jest.mock("next-auth/providers/google", () => jest.fn());

// Mock jose since it requires browser APIs (TextEncoder)
const mockDecodeJwt = jest.fn();
jest.mock("jose", () => ({
  decodeJwt: mockDecodeJwt,
}));

import { JWT } from "next-auth/jwt";
import { refreshOidcToken } from "@tambo-ai-cloud/core";
import { refreshTokenIfNecessary } from "./auth";

const mockRefreshOidcToken = refreshOidcToken as jest.MockedFunction<
  typeof refreshOidcToken
>;

describe("refreshTokenIfNecessary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns token unchanged if no idToken", async () => {
    const token: JWT = {
      provider: "google",
      id: "user-123",
      refreshToken: "test-refresh-token",
    };

    const result = await refreshTokenIfNecessary(token);

    expect(result).toBe(token);
    expect(mockRefreshOidcToken).not.toHaveBeenCalled();
  });

  it("returns token unchanged if idToken has no exp claim", async () => {
    mockDecodeJwt.mockReturnValue({
      sub: "user-123",
      iat: Math.floor(Date.now() / 1000),
      // no exp claim
    });

    const token: JWT = {
      provider: "google",
      id: "user-123",
      idToken: "mock-id-token",
      refreshToken: "test-refresh-token",
    };

    const result = await refreshTokenIfNecessary(token);

    expect(result).toBe(token);
    expect(mockRefreshOidcToken).not.toHaveBeenCalled();
  });

  it("returns token unchanged if not expiring soon", async () => {
    const now = Date.now();
    jest.setSystemTime(now);

    // Token expires in 30 minutes (well beyond refresh threshold)
    const iat = Math.floor(now / 1000) - 1800; // issued 30 min ago
    const exp = Math.floor(now / 1000) + 1800; // expires in 30 min
    mockDecodeJwt.mockReturnValue({ sub: "user-123", exp, iat });

    const token: JWT = {
      provider: "google",
      id: "user-123",
      idToken: "mock-id-token",
      refreshToken: "test-refresh-token",
    };

    const result = await refreshTokenIfNecessary(token);

    expect(result).toBe(token);
    expect(mockRefreshOidcToken).not.toHaveBeenCalled();
  });

  it("returns token unchanged if no refreshToken available (key fix)", async () => {
    const now = Date.now();
    jest.setSystemTime(now);

    // Token expires in 20 seconds (should trigger refresh)
    const iat = Math.floor(now / 1000) - 3580; // issued ~1 hour ago
    const exp = Math.floor(now / 1000) + 20; // expires in 20 seconds
    mockDecodeJwt.mockReturnValue({ sub: "user-123", exp, iat });

    const token: JWT = {
      provider: "google",
      id: "user-123",
      idToken: "mock-id-token",
      // No refreshToken - this is the scenario that was broken before the fix
    };

    const result = await refreshTokenIfNecessary(token);

    expect(result).toBe(token);
    expect(mockRefreshOidcToken).not.toHaveBeenCalled();
  });

  it("refreshes token when expiring soon and refreshToken is available", async () => {
    const now = Date.now();
    jest.setSystemTime(now);

    // Token expires in 20 seconds (should trigger refresh)
    const iat = Math.floor(now / 1000) - 3580; // issued ~1 hour ago
    const exp = Math.floor(now / 1000) + 20; // expires in 20 seconds
    const decodedToken = { sub: "user-123", exp, iat };
    mockDecodeJwt.mockReturnValue(decodedToken);

    const token: JWT = {
      provider: "google",
      id: "user-123",
      idToken: "mock-id-token",
      refreshToken: "test-refresh-token",
    };

    const newExp = Math.floor(now / 1000) + 3600;

    mockRefreshOidcToken.mockResolvedValue({
      accessToken: "new-access-token",
      idToken: "new-id-token",
      expiresAt: newExp,
      scope: "openid email profile",
      tokenType: "Bearer",
    });

    const result = await refreshTokenIfNecessary(token);

    expect(mockRefreshOidcToken).toHaveBeenCalledWith(
      decodedToken,
      "test-refresh-token",
      "test-google-client-id",
      "test-google-client-secret",
    );
    expect(result.idToken).toBe("new-id-token");
    expect(result.accessToken).toBe("new-access-token");
  });

  it("refreshes token when less than 30 seconds remain", async () => {
    const now = Date.now();
    jest.setSystemTime(now);

    // Token expires in 25 seconds
    const iat = Math.floor(now / 1000) - 3575;
    const exp = Math.floor(now / 1000) + 25;
    mockDecodeJwt.mockReturnValue({ sub: "user-123", exp, iat });

    const token: JWT = {
      provider: "google",
      id: "user-123",
      idToken: "mock-id-token",
      refreshToken: "test-refresh-token",
    };

    mockRefreshOidcToken.mockResolvedValue({
      accessToken: "new-access-token",
      idToken: "new-id-token",
      expiresAt: Math.floor(now / 1000) + 3600,
      scope: "openid email profile",
      tokenType: "Bearer",
    });

    const result = await refreshTokenIfNecessary(token);

    expect(mockRefreshOidcToken).toHaveBeenCalled();
    expect(result.idToken).toBe("new-id-token");
  });
});
