import { OAuthLocalProvider } from "../../../packages/db/src/oauth/OAuthLocalProvider";

describe("OAuthLocalProvider", () => {
  it("adds only the explicit auth code response type to client metadata", () => {
    const provider = new OAuthLocalProvider({} as never, "ctx_123", {
      baseUrl: "https://tambo.test",
    });

    expect(provider.clientMetadata).toEqual({
      redirect_uris: [
        expect.stringMatching(
          /^https:\/\/tambo\.test\/oauth\/callback\?sessionId=/,
        ),
      ],
      client_name: "Tambo",
      response_types: ["code"],
    });
    expect(provider.clientMetadata).not.toHaveProperty("grant_types");
    expect(provider.clientMetadata).not.toHaveProperty(
      "token_endpoint_auth_method",
    );
  });

  it("creates an OAuth session row when saving state for re-auth", async () => {
    const insertedRows: unknown[] = [];
    const mockDb = {
      query: {
        mcpOauthClients: {
          findFirst: jest.fn().mockResolvedValue(undefined),
        },
      },
      insert: jest.fn(() => ({
        values: jest.fn(async (value: unknown) => {
          insertedRows.push(value);
        }),
      })),
    };

    const provider = new OAuthLocalProvider(mockDb as never, "ctx_123", {
      baseUrl: "https://tambo.test",
      serverUrl: "https://mcp.example.com/mcp",
      clientInformation: {
        client_id: "client_123",
      },
    });

    const state = await provider.state();

    expect(state).toEqual(expect.any(String));
    expect(mockDb.query.mcpOauthClients.findFirst).toHaveBeenCalledTimes(1);
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    expect(insertedRows).toEqual([
      {
        toolProviderUserContextId: "ctx_123",
        sessionInfo: {
          serverUrl: "https://mcp.example.com/mcp",
          clientInformation: {
            client_id: "client_123",
          },
          state,
        },
        sessionId: expect.any(String),
      },
    ]);
  });
});
