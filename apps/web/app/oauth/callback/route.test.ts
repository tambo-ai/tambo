const mockAuth = jest.fn();
const mockGetDb = jest.fn();
const mockCreateFetchWithTimeout = jest.fn();

jest.mock("@/lib/base-url", () => ({
  getBaseUrl: () => "https://tambo.test",
}));

jest.mock("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://localhost/test",
  },
}));

jest.mock("@/lib/fetch-with-timeout", () => ({
  createFetchWithTimeout: (...args: unknown[]) =>
    mockCreateFetchWithTimeout(...args),
}));

jest.mock("@modelcontextprotocol/sdk/client/auth.js", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

jest.mock("next/server", () => ({
  NextRequest: class MockNextRequest {
    constructor(public url: string) {}
  },
  NextResponse: {
    redirect: (url: string | URL) =>
      ({
        status: 302,
        headers: {
          get: (name: string) =>
            name.toLowerCase() === "location" ? url.toString() : null,
        },
      }) as const,
  },
}));

jest.mock("@tambo-ai-cloud/db", () => ({
  getDb: (...args: unknown[]) => mockGetDb(...args),
  OAuthLocalProvider: class MockOAuthLocalProvider {
    constructor(
      public db: unknown,
      public toolProviderUserContextId: string,
      public options: unknown,
    ) {}
  },
  schema: {
    mcpOauthClients: {
      sessionId: "session_id",
    },
  },
}));

describe("GET /oauth/callback", () => {
  let GET: typeof import("./route").GET;
  let NextRequest: typeof import("next/server").NextRequest;

  beforeAll(async () => {
    ({ GET } = await import("./route"));
    ({ NextRequest } = await import("next/server"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "trace").mockImplementation(() => {});
    mockCreateFetchWithTimeout.mockReturnValue("fetch-with-timeout");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function makeOauthClient(state?: string) {
    return {
      toolProviderUserContextId: "ctx_123",
      sessionInfo: {
        clientInformation: {
          client_id: "client_123",
        },
        serverUrl: "https://mcp.example.com/mcp",
        state,
      },
      toolProviderUserContext: {
        toolProvider: {
          projectId: "proj_123",
        },
      },
    };
  }

  it("exchanges the code when the callback state matches", async () => {
    mockGetDb.mockReturnValue({
      query: {
        mcpOauthClients: {
          findFirst: jest.fn().mockResolvedValue(makeOauthClient("expected")),
        },
      },
    });
    mockAuth.mockResolvedValue("AUTHORIZED");

    const request = new NextRequest(
      "https://tambo.test/oauth/callback?sessionId=session-1&code=auth-code&state=expected",
    );

    const response = await GET(request);

    expect(mockAuth).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        serverUrl: "https://mcp.example.com/mcp",
        authorizationCode: "auth-code",
        fetchFn: "fetch-with-timeout",
      }),
    );
    expect(response.headers.get("location")).toBe(
      "https://tambo.test/proj_123/settings",
    );
  });

  it("rejects the callback when the returned state does not match", async () => {
    mockGetDb.mockReturnValue({
      query: {
        mcpOauthClients: {
          findFirst: jest.fn().mockResolvedValue(makeOauthClient("expected")),
        },
      },
    });

    const request = new NextRequest(
      "https://tambo.test/oauth/callback?sessionId=session-1&code=auth-code&state=wrong",
    );

    const response = await GET(request);

    expect(mockAuth).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://tambo.test/auth/error?error=Invalid%20OAuth%20state",
    );
  });
});
