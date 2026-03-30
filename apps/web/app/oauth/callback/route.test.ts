import { GET } from "./route";
import { NextRequest } from "next/server";

const authMock = jest.fn();
const findFirstMock = jest.fn();
const getDbMock = jest.fn();
const createFetchWithTimeoutMock = jest.fn();
const OAuthLocalProviderMock = jest.fn();

jest.mock("next/server", () => ({
  NextRequest: class MockNextRequest {
    url: string;

    constructor(url: string) {
      this.url = url;
    }
  },
  NextResponse: {
    redirect: (url: string | URL) => ({
      status: 307,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === "location" ? url.toString() : null,
      },
    }),
  },
}));

jest.mock("@modelcontextprotocol/sdk/client/auth.js", () => ({
  auth: (...args: unknown[]) => authMock(...args),
}));

jest.mock("@/lib/base-url", () => ({
  getBaseUrl: () => "https://console.tambo.co",
}));

jest.mock("@/lib/fetch-with-timeout", () => ({
  createFetchWithTimeout: (...args: unknown[]) =>
    createFetchWithTimeoutMock(...args),
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(() => "where-clause"),
}));

jest.mock("@tambo-ai-cloud/db", () => ({
  getDb: (...args: unknown[]) => getDbMock(...args),
  OAuthLocalProvider: function MockOAuthLocalProvider(...args: unknown[]) {
    return OAuthLocalProviderMock(...args);
  },
  schema: {
    mcpOauthClients: {
      sessionId: "session_id",
    },
  },
}));

describe("/oauth/callback route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDbMock.mockReturnValue({
      query: {
        mcpOauthClients: {
          findFirst: findFirstMock,
        },
      },
    });
    createFetchWithTimeoutMock.mockReturnValue(jest.fn());
    OAuthLocalProviderMock.mockReturnValue({});
  });

  it("logs the session context when token exchange fails", async () => {
    const error = new Error("token exchange failed");
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    findFirstMock.mockResolvedValue({
      toolProviderUserContextId: "tpuc_123",
      sessionInfo: {
        clientInformation: { client_id: "client_123" },
        serverUrl: "https://mcp.example.com",
      },
      toolProviderUserContext: {
        toolProvider: {
          projectId: "proj_123",
        },
      },
    });
    authMock.mockRejectedValue(error);

    const response = await GET(
      new NextRequest(
        "https://console.tambo.co/oauth/callback?code=auth-code&state=session_123",
      ),
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith("OAuth callback failed", {
      sessionId: "session_123",
      error,
    });
    expect(response.headers.get("location")).toBe(
      "https://console.tambo.co/oauth/error?error=token%20exchange%20failed",
    );

    consoleErrorSpy.mockRestore();
  });
});
