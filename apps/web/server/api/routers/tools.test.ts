import { createFetchWithTimeout } from "@/lib/fetch-with-timeout";
import { createCallerFactory } from "@/server/api/trpc";
import type { Context } from "@/server/api/trpc";
import {
  auth,
  discoverAuthorizationServerMetadata,
  discoverOAuthProtectedResourceMetadata,
} from "@modelcontextprotocol/sdk/client/auth.js";
import { ServerError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import {
  MCP_OAUTH_AUTHORIZATION_STATUS_AUTHORIZED,
  MCP_OAUTH_AUTHORIZATION_STATUS_MANUAL_CLIENT_REGISTRATION_REQUIRED,
  ToolProviderType,
} from "@tambo-ai-cloud/core";
import { operations } from "@tambo-ai-cloud/db";
import { toolsRouter } from "./tools";

jest.mock("@/lib/base-url", () => ({
  getBaseUrl: () => "https://console.tambo.co",
}));

jest.mock("@/lib/fetch-with-timeout", () => ({
  createFetchWithTimeout: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@sentry/nextjs", () => ({
  startSpan: async (_options: unknown, callback: () => Promise<unknown>) =>
    await callback(),
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

jest.mock("@modelcontextprotocol/sdk/client/auth.js", () => ({
  auth: jest.fn(),
  discoverAuthorizationServerMetadata: jest.fn(),
  discoverOAuthProtectedResourceMetadata: jest.fn(),
}));

jest.mock("@tambo-ai-cloud/db", () => ({
  OAuthLocalProvider: class MockOAuthLocalProvider {
    redirectStartAuthUrl = undefined;

    state() {
      return "session_123";
    }
  },
  operations: {
    ensureProjectAccess: jest.fn(),
  },
  schema: {
    mcpOauthClients: {
      sessionId: "session_id",
    },
    toolProviderUserContexts: {
      id: "tool_provider_user_context_id",
      toolProviderId: "tool_provider_id",
    },
    toolProviders: {
      id: "tool_provider_id",
      type: "tool_provider_type",
      url: "tool_provider_url",
    },
  },
}));

const ensureProjectAccessMock = jest.mocked(operations.ensureProjectAccess);
const authMock = jest.mocked(auth);
const createFetchWithTimeoutMock = jest.mocked(createFetchWithTimeout);
const discoverAuthorizationServerMetadataMock = jest.mocked(
  discoverAuthorizationServerMetadata,
);
const discoverOAuthProtectedResourceMetadataMock = jest.mocked(
  discoverOAuthProtectedResourceMetadata,
);

const createCaller = createCallerFactory(toolsRouter);
let warnSpy: jest.SpiedFunction<typeof console.warn>;

function createAuthorizationServerMetadata(
  overrides: Partial<
    NonNullable<Awaited<ReturnType<typeof discoverAuthorizationServerMetadata>>>
  > = {},
): NonNullable<
  Awaited<ReturnType<typeof discoverAuthorizationServerMetadata>>
> {
  return {
    issuer: "https://auth.example.com",
    authorization_endpoint: "https://auth.example.com/authorize",
    token_endpoint: "https://auth.example.com/token",
    jwks_uri: "https://auth.example.com/jwks",
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    ...overrides,
  };
}

function createProtectedResourceMetadata(
  overrides: Partial<
    NonNullable<
      Awaited<ReturnType<typeof discoverOAuthProtectedResourceMetadata>>
    >
  > = {},
): NonNullable<
  Awaited<ReturnType<typeof discoverOAuthProtectedResourceMetadata>>
> {
  return {
    resource: "https://mcp.example.com",
    ...overrides,
  };
}

function createDbMock({
  toolProviderUserContext,
}: {
  toolProviderUserContext: {
    id: string;
    mcpOauthClientInfo: Record<string, unknown> | null;
    mcpOauthTokens: Record<string, unknown> | null;
  };
}) {
  const toolProvidersFindFirst = jest.fn().mockResolvedValue({
    id: "tp_123",
    type: ToolProviderType.MCP,
    url: "https://mcp.example.com",
    projectId: "proj_123",
  });
  const toolProviderUserContextsFindFirst = jest
    .fn()
    .mockResolvedValue(toolProviderUserContext);
  const updateWhere = jest.fn().mockResolvedValue(undefined);
  const updateSet = jest.fn(() => ({ where: updateWhere }));
  const update = jest.fn(() => ({ set: updateSet }));
  const deleteWhere = jest.fn().mockResolvedValue(undefined);
  const deleteFn = jest.fn(() => ({ where: deleteWhere }));
  const query = {
    toolProviders: {
      findFirst: toolProvidersFindFirst,
    },
    toolProviderUserContexts: {
      findFirst: toolProviderUserContextsFindFirst,
    },
  };
  const txRef: { current: unknown } = { current: undefined };
  const runTransaction = async (
    callback: (innerTx: unknown) => unknown,
  ): Promise<unknown> => callback(txRef.current);

  const tx = {
    execute: jest.fn().mockResolvedValue(undefined),
    query,
    insert: jest.fn(),
    update,
    delete: deleteFn,
    transaction: jest.fn(runTransaction),
  };
  txRef.current = tx;

  const db = {
    query,
    transaction: jest.fn(runTransaction),
    update,
    delete: deleteFn,
  };

  return {
    db,
    spies: {
      deleteFn,
      deleteWhere,
      toolProviderUserContextsFindFirst,
      toolProvidersFindFirst,
      update,
      updateSet,
      updateWhere,
    },
  };
}

function createContext(db: Context["db"]): Context {
  return {
    db,
    headers: new Headers(),
    session: null,
    user: {
      id: "user_123",
      email: "test@example.com",
      image: null,
      name: "Test User",
    },
  };
}

describe("toolsRouter.authorizeMcpServer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    ensureProjectAccessMock.mockResolvedValue(undefined);
    createFetchWithTimeoutMock.mockReturnValue(jest.fn());
    discoverOAuthProtectedResourceMetadataMock.mockRejectedValue(
      new Error("resource metadata unavailable"),
    );
    discoverAuthorizationServerMetadataMock.mockRejectedValue(
      new Error("authorization metadata unavailable"),
    );
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("clears persisted OAuth state when reused auth state fails", async () => {
    const { db, spies } = createDbMock({
      toolProviderUserContext: {
        id: "ctx_123",
        mcpOauthClientInfo: {
          client_id: "opaque-client-id",
        },
        mcpOauthTokens: {
          access_token: "stale-token",
        },
      },
    });

    authMock.mockRejectedValue(new Error("stale token"));
    const caller = createCaller(createContext(db as unknown as Context["db"]));

    await expect(
      caller.authorizeMcpServer({
        toolProviderId: "tp_123",
        contextKey: null,
      }),
    ).rejects.toThrow("MCP authorization failed: stale token");

    expect(spies.update).toHaveBeenCalledTimes(1);
    expect(spies.updateSet).toHaveBeenCalledWith({
      mcpOauthClientInfo: null,
      mcpOauthTokens: null,
    });
    expect(spies.updateWhere).toHaveBeenCalledTimes(1);
    expect(spies.deleteFn).not.toHaveBeenCalled();
  });

  it("cleans up only the ephemeral OAuth session for fresh auth failures", async () => {
    const { db, spies } = createDbMock({
      toolProviderUserContext: {
        id: "ctx_123",
        mcpOauthClientInfo: null,
        mcpOauthTokens: null,
      },
    });

    authMock.mockRejectedValue(new ServerError("temporary auth failure"));
    const caller = createCaller(createContext(db as unknown as Context["db"]));

    await expect(
      caller.authorizeMcpServer({
        toolProviderId: "tp_123",
        contextKey: null,
      }),
    ).rejects.toThrow("MCP authorization failed: temporary auth failure");

    expect(spies.deleteFn).toHaveBeenCalledTimes(1);
    expect(spies.deleteWhere).toHaveBeenCalledTimes(1);
    expect(spies.update).not.toHaveBeenCalled();
  });

  it("preserves the original auth failure when OAuth session cleanup fails", async () => {
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { db, spies } = createDbMock({
      toolProviderUserContext: {
        id: "ctx_123",
        mcpOauthClientInfo: null,
        mcpOauthTokens: null,
      },
    });
    const authError = new ServerError("temporary auth failure");
    const cleanupError = new Error("cleanup failed");

    spies.deleteWhere.mockRejectedValueOnce(cleanupError);
    authMock.mockRejectedValue(authError);
    const caller = createCaller(createContext(db as unknown as Context["db"]));

    await expect(
      caller.authorizeMcpServer({
        toolProviderId: "tp_123",
        contextKey: null,
      }),
    ).rejects.toThrow("MCP authorization failed: temporary auth failure");

    expect(spies.deleteFn).toHaveBeenCalledTimes(1);
    expect(spies.deleteWhere).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith("Failed to clean up OAuth session", {
      sessionId: "session_123",
      cleanupError,
      originalError: authError,
    });

    errorSpy.mockRestore();
  });

  it("keeps generic registration endpoint failures on the standard auth error path", async () => {
    const { db, spies } = createDbMock({
      toolProviderUserContext: {
        id: "ctx_123",
        mcpOauthClientInfo: null,
        mcpOauthTokens: null,
      },
    });

    discoverOAuthProtectedResourceMetadataMock.mockResolvedValue(
      createProtectedResourceMetadata({
        authorization_servers: ["https://auth.example.com"],
      }),
    );
    discoverAuthorizationServerMetadataMock.mockResolvedValue(
      createAuthorizationServerMetadata({
        registration_endpoint: "https://auth.example.com/register",
      }),
    );
    authMock.mockRejectedValue(
      new Error("Failed to connect to registration endpoint"),
    );
    const caller = createCaller(createContext(db as unknown as Context["db"]));

    await expect(
      caller.authorizeMcpServer({
        toolProviderId: "tp_123",
        contextKey: null,
      }),
    ).rejects.toThrow(
      "MCP authorization failed: Failed to connect to registration endpoint",
    );

    expect(warnSpy).not.toHaveBeenCalled();
    expect(spies.deleteFn).toHaveBeenCalledTimes(1);
    expect(spies.update).not.toHaveBeenCalled();
  });

  it("logs resource metadata discovery failures before requiring manual registration", async () => {
    const { db } = createDbMock({
      toolProviderUserContext: {
        id: "ctx_123",
        mcpOauthClientInfo: null,
        mcpOauthTokens: null,
      },
    });

    discoverAuthorizationServerMetadataMock.mockResolvedValue(
      createAuthorizationServerMetadata({
        client_id_metadata_document_supported: false,
        registration_endpoint: undefined,
      }),
    );
    const caller = createCaller(createContext(db as unknown as Context["db"]));

    await expect(
      caller.authorizeMcpServer({
        toolProviderId: "tp_123",
        contextKey: null,
      }),
    ).resolves.toMatchObject({
      status:
        MCP_OAUTH_AUTHORIZATION_STATUS_MANUAL_CLIENT_REGISTRATION_REQUIRED,
    });

    expect(authMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      "Failed to discover OAuth resource metadata",
      {
        serverUrl: "https://mcp.example.com",
        error: "resource metadata unavailable",
      },
    );
  });

  it("logs authorization server metadata discovery failures before falling back to DCR", async () => {
    const { db } = createDbMock({
      toolProviderUserContext: {
        id: "ctx_123",
        mcpOauthClientInfo: null,
        mcpOauthTokens: null,
      },
    });

    discoverOAuthProtectedResourceMetadataMock.mockResolvedValue(
      createProtectedResourceMetadata({
        authorization_servers: ["https://auth.example.com"],
      }),
    );
    authMock.mockResolvedValue("AUTHORIZED");
    const caller = createCaller(createContext(db as unknown as Context["db"]));

    await expect(
      caller.authorizeMcpServer({
        toolProviderId: "tp_123",
        contextKey: null,
      }),
    ).resolves.toMatchObject({
      status: MCP_OAUTH_AUTHORIZATION_STATUS_AUTHORIZED,
    });

    expect(authMock).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      "Failed to discover OAuth authorization server metadata",
      {
        authorizationServer: "https://auth.example.com/",
        error: "authorization metadata unavailable",
      },
    );
  });
});
