import { OAuthLocalProvider } from "../../../packages/db/src/oauth/OAuthLocalProvider";
import * as schema from "../../../packages/db/src/schema";
import type { HydraDb } from "../../../packages/db/src/types";

function createDbMock({
  toolProviderUserContext,
  mcpOauthClient,
  toolProviderUserContextUpdateRowCount = 1,
}: {
  mcpOauthClient?: {
    codeVerifier?: string | null;
    sessionInfo: { clientInformation: { client_id: string } };
  };
  toolProviderUserContext?: {
    mcpOauthClientInfo: { client_id: string } | null;
  } | null;
  toolProviderUserContextUpdateRowCount?: number;
}) {
  const onConflictDoUpdate = jest.fn().mockResolvedValue(undefined);
  const values = jest.fn(() => ({
    onConflictDoUpdate,
  }));
  const insert = jest.fn(() => ({
    values,
  }));
  const updateWhere = jest
    .fn()
    .mockResolvedValue({ rowCount: toolProviderUserContextUpdateRowCount });
  const updateSet = jest.fn(() => ({
    where: updateWhere,
  }));
  const update = jest.fn(() => ({
    set: updateSet,
  }));
  const mcpOauthClientsFindFirst = jest.fn().mockResolvedValue(mcpOauthClient);
  const toolProviderUserContextsFindFirst = jest
    .fn()
    .mockResolvedValue(toolProviderUserContext ?? null);

  return {
    db: {
      insert,
      update,
      query: {
        mcpOauthClients: {
          findFirst: mcpOauthClientsFindFirst,
        },
        toolProviderUserContexts: {
          findFirst: toolProviderUserContextsFindFirst,
        },
      },
    } as unknown as HydraDb,
    spies: {
      insert,
      mcpOauthClientsFindFirst,
      onConflictDoUpdate,
      toolProviderUserContextsFindFirst,
      update,
      updateSet,
      updateWhere,
      values,
    },
  };
}

describe("OAuthLocalProvider", () => {
  it("upserts client information by session ID", async () => {
    const { db, spies } = createDbMock({});
    const provider = new OAuthLocalProvider(db, "ctx_123", {
      serverUrl: "https://mcp.example.com",
      sessionId: "11111111-1111-1111-1111-111111111111",
    });

    await provider.saveClientInformation({
      client_id: "client_123",
    });

    expect(spies.insert).toHaveBeenCalledWith(schema.mcpOauthClients);
    expect(spies.values).toHaveBeenCalledWith({
      toolProviderUserContextId: "ctx_123",
      sessionInfo: {
        serverUrl: "https://mcp.example.com",
        clientInformation: {
          client_id: "client_123",
        },
      },
      sessionId: "11111111-1111-1111-1111-111111111111",
    });
    expect(spies.onConflictDoUpdate).toHaveBeenCalledWith({
      target: schema.mcpOauthClients.sessionId,
      set: {
        sessionInfo: {
          serverUrl: "https://mcp.example.com",
          clientInformation: {
            client_id: "client_123",
          },
        },
      },
    });
    expect(spies.mcpOauthClientsFindFirst).not.toHaveBeenCalled();
  });

  it("upserts the code verifier without pre-reading the OAuth session row", async () => {
    const { db, spies } = createDbMock({});
    const provider = new OAuthLocalProvider(db, "ctx_123", {
      clientInformation: {
        client_id: "client_123",
      },
      serverUrl: "https://mcp.example.com",
      sessionId: "11111111-1111-1111-1111-111111111111",
    });

    await provider.saveCodeVerifier("verifier_123");

    expect(spies.insert).toHaveBeenCalledWith(schema.mcpOauthClients);
    expect(spies.values).toHaveBeenCalledWith({
      toolProviderUserContextId: "ctx_123",
      sessionInfo: {
        serverUrl: "https://mcp.example.com",
        clientInformation: {
          client_id: "client_123",
        },
      },
      sessionId: "11111111-1111-1111-1111-111111111111",
      codeVerifier: "verifier_123",
    });
    expect(spies.onConflictDoUpdate).toHaveBeenCalledWith({
      target: schema.mcpOauthClients.sessionId,
      set: {
        codeVerifier: "verifier_123",
      },
    });
    expect(spies.mcpOauthClientsFindFirst).not.toHaveBeenCalled();
    expect(spies.toolProviderUserContextsFindFirst).not.toHaveBeenCalled();
  });

  it("throws when saving a code verifier without OAuth client information", async () => {
    const { db, spies } = createDbMock({});
    const provider = new OAuthLocalProvider(db, "ctx_123", {
      serverUrl: "https://mcp.example.com",
      sessionId: "11111111-1111-1111-1111-111111111111",
    });

    await expect(provider.saveCodeVerifier("verifier_123")).rejects.toThrow(
      "Cannot save code verifier without OAuth client information",
    );

    expect(spies.insert).not.toHaveBeenCalled();
    expect(spies.toolProviderUserContextsFindFirst).toHaveBeenCalledTimes(1);
    expect(spies.mcpOauthClientsFindFirst).toHaveBeenCalledTimes(1);
  });

  it("reuses the cached OAuth session across client information and code verifier reads", async () => {
    const { db, spies } = createDbMock({
      mcpOauthClient: {
        codeVerifier: "verifier_123",
        sessionInfo: {
          clientInformation: {
            client_id: "client_123",
          },
        },
      },
    });
    const provider = new OAuthLocalProvider(db, "ctx_123", {
      serverUrl: "https://mcp.example.com",
      sessionId: "11111111-1111-1111-1111-111111111111",
      usePersistedContextState: false,
    });

    await expect(provider.clientInformation()).resolves.toEqual({
      client_id: "client_123",
    });
    await expect(provider.codeVerifier()).resolves.toBe("verifier_123");

    expect(spies.mcpOauthClientsFindFirst).toHaveBeenCalledTimes(1);
    expect(spies.toolProviderUserContextsFindFirst).not.toHaveBeenCalled();
  });

  it("persists tokens to the tool provider user context", async () => {
    const { db, spies } = createDbMock({});
    const provider = new OAuthLocalProvider(db, "ctx_123", {
      clientInformation: {
        client_id: "client_123",
      },
    });
    const tokens = {
      access_token: "access_token_123",
    };

    await provider.saveTokens(tokens);

    expect(spies.update).toHaveBeenCalledWith(schema.toolProviderUserContexts);
    expect(spies.updateSet).toHaveBeenCalledWith({
      mcpOauthTokens: tokens,
      mcpOauthClientInfo: {
        client_id: "client_123",
      },
    });
    expect(spies.updateWhere).toHaveBeenCalledTimes(1);
    await expect(provider.tokens()).resolves.toEqual(tokens);
  });

  it("throws when persisting tokens for a deleted tool provider user context", async () => {
    const { db, spies } = createDbMock({
      toolProviderUserContextUpdateRowCount: 0,
    });
    const provider = new OAuthLocalProvider(db, "ctx_123", {
      clientInformation: {
        client_id: "client_123",
      },
    });

    await expect(
      provider.saveTokens({
        access_token: "access_token_123",
      }),
    ).rejects.toThrow(
      "Failed to persist OAuth tokens: tool provider context ctx_123 was not found",
    );

    expect(spies.update).toHaveBeenCalledWith(schema.toolProviderUserContexts);
    await expect(provider.tokens()).resolves.toBeUndefined();
  });
});
