import { createFetchWithTimeout } from "@/lib/fetch-with-timeout";
import { createCallerFactory } from "@/server/api/trpc";
import type { Context } from "@/server/api/trpc";
import {
  auth,
  discoverAuthorizationServerMetadata,
  discoverOAuthProtectedResourceMetadata,
} from "@modelcontextprotocol/sdk/client/auth.js";
import { ServerError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { ToolProviderType } from "@tambo-ai-cloud/core";
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
    ensureProjectAccessMock.mockResolvedValue(undefined);
    createFetchWithTimeoutMock.mockReturnValue(jest.fn());
    discoverOAuthProtectedResourceMetadataMock.mockRejectedValue(
      new Error("resource metadata unavailable"),
    );
    discoverAuthorizationServerMetadataMock.mockRejectedValue(
      new Error("authorization metadata unavailable"),
    );
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
});
