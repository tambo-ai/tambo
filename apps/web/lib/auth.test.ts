import type { Account, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

// --- Mocks ---

// Mock jose before anything imports it (jsdom lacks TextEncoder)
jest.mock("jose", () => ({
  decodeJwt: (token: string) => {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  },
}));

// next-auth/providers/email imports nodemailer which isn't installed in test
jest.mock("next-auth/providers/email", () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({ id: "email", name: "Email", type: "email" })),
  };
});

// Mock env so auth.ts can be imported without real env vars
jest.mock("@/lib/env", () => ({
  env: {
    GITHUB_CLIENT_ID: "gh-id",
    GITHUB_CLIENT_SECRET: "gh-secret",
    GOOGLE_CLIENT_ID: "google-id",
    GOOGLE_CLIENT_SECRET: "google-secret",
    NEXTAUTH_SECRET: "test-secret",
    DATABASE_URL: "postgres://localhost/test",
  },
}));

// Mock external dependencies that auth.ts imports
jest.mock("@/lib/nextauth-supabase-adapter", () => ({
  SupabaseAdapter: () => ({}),
}));

jest.mock("@tambo-ai-cloud/db", () => ({
  getDb: () => ({ insert: () => ({ values: jest.fn() }) }),
  schema: { sessions: {} },
}));

const mockRefreshOidcToken = jest.fn();
jest.mock("@tambo-ai-cloud/core", () => ({
  isEmailAllowed: () => true,
  refreshOidcToken: (...args: unknown[]) => mockRefreshOidcToken(...args),
  SessionSource: { Browser: "browser" },
}));

jest.mock("resend", () => ({
  Resend: jest.fn(),
}));

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}));

jest.mock("@/lib/auth-providers", () => ({
  getAvailableProviderConfigs: () => [],
}));

// --- Helpers ---

function makeJwt(overrides: Partial<JWT> = {}): JWT {
  return {
    id: "user-1",
    provider: "google",
    accessToken: "old-access",
    idToken: undefined,
    userToken: "old-user-token",
    ...overrides,
  };
}

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    provider: "google",
    type: "oauth",
    providerAccountId: "123",
    access_token: "acct-access",
    id_token: LONG_LIVED_ID_TOKEN,
    refresh_token: "acct-refresh",
    ...overrides,
  };
}

// Helper to create a valid JWT string with exp/iat claims
function makeIdTokenString(
  exp: number,
  iat: number,
  iss = "https://accounts.google.com",
): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString(
    "base64url",
  );
  const payload = Buffer.from(JSON.stringify({ exp, iat, iss })).toString(
    "base64url",
  );
  return `${header}.${payload}.fake-signature`;
}

// A non-expiring ID token (expires far in the future) for tests that don't
// care about refresh behavior but set idToken via account
const FAR_FUTURE = Math.floor(Date.now() / 1000) + 86400;
const LONG_LIVED_ID_TOKEN = makeIdTokenString(FAR_FUTURE, FAR_FUTURE - 86400);

// --- Tests ---

describe("auth callbacks", () => {
  let authOptions: typeof import("@/lib/auth").authOptions;

  beforeAll(async () => {
    const mod = await import("@/lib/auth");
    authOptions = mod.authOptions;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("jwt callback", () => {
    const callJwt = (params: {
      token: JWT;
      account?: Account | null;
      user?: { id: string } | null;
    }) =>
      authOptions.callbacks!.jwt!({
        token: params.token,
        account: params.account ?? null,
        user: params.user as any,
        trigger: "signIn",
        session: undefined,
        profile: undefined,
        isNewUser: false,
      } as any);

    it("persists refresh_token from account onto the JWT on initial sign-in", async () => {
      const token = makeJwt();
      const account = makeAccount({ refresh_token: "my-refresh-token" });

      const result = await callJwt({ token, account });

      expect(result.refreshToken).toBe("my-refresh-token");
    });

    it("persists accessToken, provider, idToken, and userToken from account", async () => {
      const token = makeJwt();
      const newIdToken = LONG_LIVED_ID_TOKEN;
      const account = makeAccount({
        access_token: "new-access",
        id_token: newIdToken,
        provider: "google",
      });

      const result = await callJwt({ token, account });

      expect(result.accessToken).toBe("new-access");
      expect(result.idToken).toBe(newIdToken);
      expect(result.provider).toBe("google");
      expect(result.userToken).toBe(newIdToken);
    });

    it("falls back to access_token for userToken when id_token is missing (GitHub)", async () => {
      const token = makeJwt();
      const account = makeAccount({
        id_token: undefined,
        access_token: "gh-access",
        provider: "github",
      });

      const result = await callJwt({ token, account });

      expect(result.userToken).toBe("gh-access");
    });

    it("does not overwrite existing refreshToken when account has none", async () => {
      const token = makeJwt({ refreshToken: "existing-refresh" });
      const account = makeAccount({ refresh_token: undefined });

      const result = await callJwt({ token, account });

      expect(result.refreshToken).toBe("existing-refresh");
    });

    it("sets user id on the token when user is provided", async () => {
      const token = makeJwt({ id: "" });

      const result = await callJwt({
        token,
        account: null,
        user: { id: "user-42" },
      });

      expect(result.id).toBe("user-42");
    });

    it("calls refreshTokenIfNecessary with expired token and updates userToken", async () => {
      const now = Math.floor(Date.now() / 1000);
      // Token that expired 10 seconds ago
      const idTokenStr = makeIdTokenString(now - 10, now - 3610);

      mockRefreshOidcToken.mockResolvedValueOnce({
        accessToken: "refreshed-access",
        idToken: "refreshed-id-token",
        refreshToken: "rotated-refresh",
        expiresAt: now + 3600,
      });

      const token = makeJwt({
        idToken: idTokenStr,
        refreshToken: "old-refresh",
        provider: "google",
      });

      const result = await callJwt({ token, account: null });

      expect(mockRefreshOidcToken).toHaveBeenCalledWith(
        expect.objectContaining({ iss: "https://accounts.google.com" }),
        "old-refresh",
        "google-id",
        "google-secret",
      );
      expect(result.idToken).toBe("refreshed-id-token");
      expect(result.userToken).toBe("refreshed-id-token");
      expect(result.accessToken).toBe("refreshed-access");
      expect(result.refreshToken).toBe("rotated-refresh");
    });

    it("skips refresh for GitHub tokens (no idToken)", async () => {
      const token = makeJwt({
        idToken: undefined,
        provider: "github",
        userToken: "gh-access",
      });

      const result = await callJwt({ token, account: null });

      expect(mockRefreshOidcToken).not.toHaveBeenCalled();
      expect(result.userToken).toBe("gh-access");
    });

    it("skips refresh when token is not near expiry", async () => {
      const now = Math.floor(Date.now() / 1000);
      // Token that expires in 30 minutes
      const idTokenStr = makeIdTokenString(now + 1800, now - 1800);

      const token = makeJwt({
        idToken: idTokenStr,
        refreshToken: "my-refresh",
        provider: "google",
      });

      const result = await callJwt({ token, account: null });

      expect(mockRefreshOidcToken).not.toHaveBeenCalled();
      expect(result.idToken).toBe(idTokenStr);
    });
  });

  describe("session callback", () => {
    const callSession = (params: {
      token?: JWT;
      user?: { id: string; userToken?: string } | null;
    }) => {
      const session = {
        user: { id: "", name: "Test", email: "test@example.com" },
        expires: "2099-01-01",
      };
      return authOptions.callbacks!.session!({
        session,
        token: params.token ?? makeJwt(),
        user: params.user as any,
        trigger: "update",
        newSession: undefined,
      } as any);
    };

    it("exposes only id and userToken from JWT token", async () => {
      const token = makeJwt({
        id: "user-1",
        userToken: "safe-token",
        accessToken: "secret-access",
        idToken: "secret-id",
        refreshToken: "secret-refresh",
        provider: "google",
      });

      const result = (await callSession({ token })) as Session;

      expect(result.user.id).toBe("user-1");
      expect(result.user.userToken).toBe("safe-token");
      // Sensitive fields must NOT be on the session user
      expect(result.user).not.toHaveProperty("accessToken");
      expect(result.user).not.toHaveProperty("idToken");
      expect(result.user).not.toHaveProperty("refreshToken");
      expect(result.user).not.toHaveProperty("provider");
    });

    it("preserves default session fields (name, email)", async () => {
      const result = (await callSession({ token: makeJwt() })) as Session;

      expect(result.user.name).toBe("Test");
      expect(result.user.email).toBe("test@example.com");
    });

    it("uses user fields when user object is provided", async () => {
      const result = (await callSession({
        user: { id: "user-from-db", userToken: "db-token" },
      })) as Session;

      expect(result.user.id).toBe("user-from-db");
      expect(result.user.userToken).toBe("db-token");
    });
  });
});
