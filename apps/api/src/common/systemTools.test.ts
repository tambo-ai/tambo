import { jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import {
  LogLevel,
  MCPClient,
  MCPHandlers,
  MCPToolSpec,
  MCPTransport,
  OAuthClientInformation,
  ToolProviderType,
} from "@tambo-ai-cloud/core";
import { getDb, operations, schema } from "@tambo-ai-cloud/db";
import { type JSONSchema7 } from "json-schema";
import { getSystemTools, getThreadMCPClients } from "./systemTools";

// Mock the db module
jest.mock("@tambo-ai-cloud/db", () => {
  const actualDb = jest.requireActual("@tambo-ai-cloud/db");

  // Create a mock class for OAuthLocalProvider
  class MockOAuthLocalProvider {
    db: any;
    contextId: string;
    config: any;

    constructor(db: any, contextId: string, config: any) {
      this.db = db;
      this.contextId = contextId;
      this.config = config;
    }
  }

  return {
    ...(actualDb as any),
    operations: {
      getProjectMcpServers: jest.fn(),
      getMcpThreadSession: jest.fn(),
      updateMcpThreadSession: jest.fn(),
      addProjectLogEntry: jest.fn(),
    },
    getDb: jest.fn(),
    OAuthLocalProvider: MockOAuthLocalProvider,
  };
});

// Mock MCPClient
jest.mock("@tambo-ai-cloud/core", () => {
  const coreModule = jest.requireActual("@tambo-ai-cloud/core");
  return {
    ...(coreModule as any),
    MCPClient: {
      create: jest.fn(),
    },
  };
});

const mockMcpTool: MCPToolSpec = {
  name: "mockMcpTool",
  description: "A mock MCP tool",
  inputSchema: {
    type: "object",
    properties: {
      param1: {
        type: "string" as JSONSchema7["type"],
      },
    },
    required: ["param1"],
  },
};

// This is a workaround to an eslint bug where eslint crashes when trying to
// analyze `typeof ClassName.prototype.methodName` - instead we make fake
// instances and use `typeof instance.methodName`
const _mcpClientInstance = null as unknown as MCPClient;

// Factory function to create properly typed MCPHandlers mocks
function createMcpHandlerMocks(): MCPHandlers {
  return {
    elicitation: jest.fn<MCPHandlers["elicitation"]>(),
    sampling: jest.fn<MCPHandlers["sampling"]>(),
  };
}

describe("systemTools", () => {
  let mockDb: ReturnType<typeof getDb>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;
  let loggerWarnSpy: jest.SpiedFunction<typeof Logger.prototype.warn>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set env variables
    process.env.VERCEL_URL = "http://localhost:8260";

    // Create a mock db with a query property
    mockDb = {
      query: {},
    } as unknown as ReturnType<typeof getDb>;

    jest.mocked(getDb).mockReturnValue(mockDb);
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    loggerWarnSpy = jest
      .spyOn(Logger.prototype, "warn")
      .mockImplementation(() => {});

    // Default mocks
    jest.mocked(operations.getProjectMcpServers).mockResolvedValue([]);
    jest.mocked(operations.getMcpThreadSession).mockResolvedValue(undefined);
    jest.mocked(operations.updateMcpThreadSession).mockResolvedValue(undefined);
    jest.mocked(operations.addProjectLogEntry).mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    loggerWarnSpy.mockRestore();
  });

  describe("getSystemTools", () => {
    it("should return empty tools when no MCP servers exist", async () => {
      const mcpHandlers = createMcpHandlerMocks();

      const tools = await getSystemTools(
        mockDb,
        "project123",
        "thread123",
        mcpHandlers,
      );

      expect(tools).toEqual({
        mcpToolSources: {},
        mcpToolsSchema: [],
        mcpHandlers,
      });
    });

    it("should fetch and combine tools from MCP servers", async () => {
      const mockClient = {
        listTools: jest
          .fn<typeof _mcpClientInstance.listTools>()
          .mockResolvedValue([mockMcpTool]),
        sessionId: undefined,
      };

      jest
        .mocked(MCPClient.create)
        .mockResolvedValue(mockClient as unknown as MCPClient);

      jest.mocked(operations.getProjectMcpServers).mockResolvedValue([
        {
          id: "mcp1",
          serverKey: "mcp1",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: {},
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp1.example.com",
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: false,
          contexts: [],
        },
      ]);

      const mcpHandlers = createMcpHandlerMocks();

      const tools = await getSystemTools(
        mockDb,
        "project123",
        "thread123",
        mcpHandlers,
      );

      expect(tools.mcpToolsSchema).toHaveLength(1);
      expect(tools.mcpToolsSchema[0]).toEqual({
        type: "function",
        function: {
          name: "mcp1__mockMcpTool",
          description: "A mock MCP tool",
          strict: true,
          parameters: {
            type: "object",
            properties: {
              param1: {
                type: "string",
              },
            },
            required: ["param1"],
            additionalProperties: false,
          },
        },
      });
      expect(tools.mcpToolSources["mcp1__mockMcpTool"]).toEqual({
        client: mockClient,
        serverKey: "mcp1",
      });
      expect(tools.mcpHandlers).toBe(mcpHandlers);
    });

    it("should warn about duplicate tool names", async () => {
      const mockClient1 = {
        listTools: jest
          .fn<typeof _mcpClientInstance.listTools>()
          .mockResolvedValue([mockMcpTool]),
        sessionId: undefined,
      };

      const mockClient2 = {
        listTools: jest
          .fn<typeof _mcpClientInstance.listTools>()
          .mockResolvedValue([
            { ...mockMcpTool, description: "Duplicate tool" },
          ]),
        sessionId: undefined,
      };

      jest
        .mocked(MCPClient.create)
        .mockResolvedValueOnce(mockClient1 as unknown as MCPClient)
        .mockResolvedValueOnce(mockClient2 as unknown as MCPClient);

      jest.mocked(operations.getProjectMcpServers).mockResolvedValue([
        {
          id: "mcp1",
          serverKey: "",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: {},
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp1.example.com",
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: false,
          contexts: [],
        },
        {
          id: "mcp2",
          serverKey: "",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: {},
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp2.example.com",
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: false,
          contexts: [],
        },
      ]);

      const mcpHandlers = createMcpHandlerMocks();

      await getSystemTools(mockDb, "project123", "thread123", mcpHandlers);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Tool names must be unique, found duplicates for project project123: mockMcpTool",
        ),
      );
    });
  });

  describe("getThreadMCPClients", () => {
    it("should return empty array when no MCP servers exist", async () => {
      const mcpHandlers = createMcpHandlerMocks();

      const clients = await getThreadMCPClients(
        mockDb,
        "project123",
        "thread123",
        mcpHandlers,
      );

      expect(clients).toEqual([]);
    });

    it("should skip servers without URL", async () => {
      jest.mocked(operations.getProjectMcpServers).mockResolvedValue([
        {
          id: "mcp1",
          serverKey: "mcp1",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: {},
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: null,
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: false,
          contexts: [],
        },
      ]);

      const mcpHandlers = createMcpHandlerMocks();

      const clients = await getThreadMCPClients(
        mockDb,
        "project123",
        "thread123",
        mcpHandlers,
      );

      expect(clients).toEqual([]);
      expect(MCPClient.create).not.toHaveBeenCalled();
    });

    it("should skip servers requiring auth when auth info is missing", async () => {
      jest.mocked(operations.getProjectMcpServers).mockResolvedValue([
        {
          id: "mcp1",
          serverKey: "mcp1",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: {},
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp1.example.com",
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: true,
          contexts: [], // No contexts = no auth info
        },
      ]);

      const mcpHandlers = createMcpHandlerMocks();

      const clients = await getThreadMCPClients(
        mockDb,
        "project123",
        "thread123",
        mcpHandlers,
      );

      expect(clients).toEqual([]);
      expect(MCPClient.create).not.toHaveBeenCalled();
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "MCP server mcp1 in project project123 requires auth, but no auth info found",
        ),
      );
      expect(operations.addProjectLogEntry).toHaveBeenCalledWith(
        mockDb,
        "project123",
        LogLevel.WARNING,
        "MCP server mcp1 requires auth but no auth info found",
        { mcpServerId: "mcp1" },
      );
    });

    it("should successfully create MCP client without auth", async () => {
      const mockClient = {
        listTools: jest.fn<typeof _mcpClientInstance.listTools>(),
        sessionId: undefined,
      };

      jest
        .mocked(MCPClient.create)
        .mockResolvedValue(mockClient as unknown as MCPClient);

      jest.mocked(operations.getProjectMcpServers).mockResolvedValue([
        {
          id: "mcp1",
          serverKey: "mcp1",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: { "X-Custom-Header": "value" },
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp1.example.com",
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: false,
          contexts: [],
        },
      ]);

      const mcpHandlers = createMcpHandlerMocks();

      const clients = await getThreadMCPClients(
        mockDb,
        "project123",
        "thread123",
        mcpHandlers,
      );

      expect(clients).toHaveLength(1);
      expect(clients[0].client).toBe(mockClient);
      expect(MCPClient.create).toHaveBeenCalledWith(
        "http://mcp1.example.com",
        MCPTransport.HTTP,
        { "X-Custom-Header": "value" },
        undefined,
        undefined,
        mcpHandlers,
      );
    });

    it("should create MCP client with auth provider when auth is configured", async () => {
      const mockClient = {
        listTools: jest.fn<typeof _mcpClientInstance.listTools>(),
        sessionId: undefined,
      };

      jest
        .mocked(MCPClient.create)
        .mockResolvedValue(mockClient as unknown as MCPClient);

      const mockOAuthTokens = {
        access_token: "access123",
        refresh_token: "refresh123",
        expires_in: 3600,
        token_type: "Bearer",
      };

      const mockClientInfo: OAuthClientInformation = {
        client_id: "client123",
        client_secret: "secret123",
      };

      jest.mocked(operations.getProjectMcpServers).mockResolvedValue([
        {
          id: "mcp1",
          serverKey: "mcp1",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: {},
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp1.example.com",
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: true,
          contexts: [
            {
              id: "context1",
              mcpOauthTokens: mockOAuthTokens,
              mcpOauthClientInfo: mockClientInfo,
            } as unknown as schema.DBToolProviderUserContext,
          ],
        },
      ]);

      // Mock the database query for mcpOauthClients
      const findFirstMock = jest
        .fn<typeof mockDb.query.mcpOauthClients.findFirst>()
        .mockResolvedValue({
          sessionId: "session123",
          sessionInfo: {
            clientInformation: mockClientInfo,
          },
        } as schema.DBMcpOauthClient);

      mockDb.query = {
        mcpOauthClients: {
          findFirst: findFirstMock,
        },
      } as unknown as typeof mockDb.query;

      const mcpHandlers = createMcpHandlerMocks();

      const clients = await getThreadMCPClients(
        mockDb,
        "project123",
        "thread123",
        mcpHandlers,
      );

      expect(clients).toHaveLength(1);

      // Verify findFirst was actually called  with the correct where clause
      expect(findFirstMock).toHaveBeenCalledWith({
        where: expect.anything(),
      });

      // Verify MCPClient.create was called
      expect(MCPClient.create).toHaveBeenCalled();

      // Verify the auth provider was created
      const createCalls = jest.mocked(MCPClient.create).mock.calls;
      expect(createCalls).toHaveLength(1);
      const [url, transport, headers, authProvider, sessionId, handlers] =
        createCalls[0];

      expect(url).toBe("http://mcp1.example.com");
      expect(transport).toBe(MCPTransport.HTTP);
      expect(headers).toEqual({});

      // The auth provider should be an object with db, contextId, and config
      expect(authProvider).toBeDefined();
      expect(authProvider).toMatchObject({
        contextId: "context1",
        config: expect.objectContaining({
          serverUrl: "http://mcp1.example.com",
          clientInformation: mockClientInfo,
          sessionId: "session123",
        }),
      });

      expect(sessionId).toBeUndefined();
      expect(handlers).toBe(mcpHandlers);
    });

    it("should reuse existing sessionId from database", async () => {
      const mockClient = {
        listTools: jest.fn<typeof _mcpClientInstance.listTools>(),
        sessionId: "existing-session-123",
      };

      jest
        .mocked(MCPClient.create)
        .mockResolvedValue(mockClient as unknown as MCPClient);

      jest.mocked(operations.getProjectMcpServers).mockResolvedValue([
        {
          id: "mcp1",
          serverKey: "mcp1",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: {},
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp1.example.com",
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: false,
          contexts: [],
        },
      ]);

      jest.mocked(operations.getMcpThreadSession).mockResolvedValue({
        sessionId: "existing-session-123",
      });

      const mcpHandlers = createMcpHandlerMocks();

      const clients = await getThreadMCPClients(
        mockDb,
        "project123",
        "thread123",
        mcpHandlers,
      );

      expect(clients).toHaveLength(1);
      expect(MCPClient.create).toHaveBeenCalledWith(
        "http://mcp1.example.com",
        MCPTransport.HTTP,
        {},
        undefined,
        "existing-session-123",
        mcpHandlers,
      );
    });

    it("should update session when sessionId changes", async () => {
      const mockClient = {
        listTools: jest.fn<typeof _mcpClientInstance.listTools>(),
        sessionId: "new-session-456",
      };

      jest
        .mocked(MCPClient.create)
        .mockResolvedValue(mockClient as unknown as MCPClient);

      jest.mocked(operations.getProjectMcpServers).mockResolvedValue([
        {
          id: "mcp1",
          serverKey: "mcp1",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: {},
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp1.example.com",
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: false,
          contexts: [],
        },
      ]);

      jest.mocked(operations.getMcpThreadSession).mockResolvedValue({
        sessionId: "old-session-123",
      });

      const mcpHandlers = createMcpHandlerMocks();

      const clients = await getThreadMCPClients(
        mockDb,
        "project123",
        "thread123",
        mcpHandlers,
      );

      expect(clients).toHaveLength(1);
      expect(operations.updateMcpThreadSession).toHaveBeenCalledWith(
        mockDb,
        "thread123",
        "mcp1",
        "new-session-456",
      );
    });

    it("should handle MCPClient.create errors gracefully", async () => {
      const error = new Error("Connection failed");
      jest.mocked(MCPClient.create).mockRejectedValue(error);

      jest.mocked(operations.getProjectMcpServers).mockResolvedValue([
        {
          id: "mcp1",
          serverKey: "mcp1",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: {},
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp1.example.com",
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: false,
          contexts: [],
        },
      ]);

      const mcpHandlers = createMcpHandlerMocks();

      const clients = await getThreadMCPClients(
        mockDb,
        "project123",
        "thread123",
        mcpHandlers,
      );

      expect(clients).toEqual([]);
      expect(operations.addProjectLogEntry).toHaveBeenCalledWith(
        mockDb,
        "project123",
        LogLevel.ERROR,
        "Error processing MCP server mcp1: Connection failed",
        { mcpServerId: "mcp1", url: "http://mcp1.example.com" },
      );
    });

    it("should pass custom headers to MCPClient.create", async () => {
      const mockClient = {
        listTools: jest.fn<typeof _mcpClientInstance.listTools>(),
        sessionId: undefined,
      };

      jest
        .mocked(MCPClient.create)
        .mockResolvedValue(mockClient as unknown as MCPClient);

      const customHeaders = {
        "X-API-Key": "secret123",
        "X-Custom": "value",
      };

      jest.mocked(operations.getProjectMcpServers).mockResolvedValue([
        {
          id: "mcp1",
          serverKey: "mcp1",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders,
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp1.example.com",
          mcpTransport: MCPTransport.SSE,
          mcpRequiresAuth: false,
          contexts: [],
        },
      ]);

      const mcpHandlers = createMcpHandlerMocks();

      await getThreadMCPClients(mockDb, "project123", "thread123", mcpHandlers);

      expect(MCPClient.create).toHaveBeenCalledWith(
        "http://mcp1.example.com",
        MCPTransport.SSE,
        customHeaders,
        undefined,
        undefined,
        mcpHandlers,
      );
    });

    it("should continue processing other servers when one fails", async () => {
      const mockClient2 = {
        listTools: jest.fn<typeof _mcpClientInstance.listTools>(),
        sessionId: undefined,
      };

      jest
        .mocked(MCPClient.create)
        .mockRejectedValueOnce(new Error("Server 1 failed"))
        .mockResolvedValueOnce(mockClient2 as unknown as MCPClient);

      jest.mocked(operations.getProjectMcpServers).mockResolvedValue([
        {
          id: "mcp1",
          serverKey: "mcp1",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: {},
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp1.example.com",
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: false,
          contexts: [],
        },
        {
          id: "mcp2",
          serverKey: "mcp2",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: {},
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp2.example.com",
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: false,
          contexts: [],
        },
      ]);

      const mcpHandlers = createMcpHandlerMocks();

      const clients = await getThreadMCPClients(
        mockDb,
        "project123",
        "thread123",
        mcpHandlers,
      );

      expect(clients).toHaveLength(1);
      expect(clients[0].client).toBe(mockClient2);
      expect(operations.addProjectLogEntry).toHaveBeenCalledTimes(1);
    });

    it("should warn when server has multiple contexts", async () => {
      const mockClient = {
        listTools: jest.fn<typeof _mcpClientInstance.listTools>(),
        sessionId: undefined,
      };

      jest
        .mocked(MCPClient.create)
        .mockResolvedValue(mockClient as unknown as MCPClient);

      const mockOAuthTokens = {
        access_token: "access123",
        refresh_token: "refresh123",
        expires_in: 3600,
        token_type: "Bearer",
      };

      const mockClientInfo = {
        clientId: "client123",
        clientSecret: "secret123",
      };

      jest.mocked(operations.getProjectMcpServers).mockResolvedValue([
        {
          id: "mcp1",
          serverKey: "mcp1",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: {},
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp1.example.com",
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: true,
          contexts: [
            {
              id: "context1",
              mcpOauthTokens: mockOAuthTokens,
              mcpOauthClientInfo: mockClientInfo,
            } as unknown as schema.DBToolProviderUserContext,
            {
              id: "context2",
              mcpOauthTokens: mockOAuthTokens,
              mcpOauthClientInfo: mockClientInfo,
            } as unknown as schema.DBToolProviderUserContext,
          ],
        },
      ]);

      mockDb.query = {
        mcpOauthClients: {
          // @ts-expect-error - jest.fn() without type defaults to never
          findFirst: jest.fn().mockResolvedValue({
            sessionId: "session123",
            sessionInfo: {
              clientInformation: mockClientInfo,
            },
          }),
        },
      } as unknown as typeof mockDb.query;

      const mcpHandlers = createMcpHandlerMocks();

      await getThreadMCPClients(mockDb, "project123", "thread123", mcpHandlers);

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "MCP server mcp1 has multiple contexts, using the first one",
        ),
      );
    });

    it("should create sessionless MCP client when threadId is null", async () => {
      const mockClient = {
        listTools: jest
          .fn<typeof _mcpClientInstance.listTools>()
          .mockResolvedValue([mockMcpTool]),
        sessionId: undefined,
      };

      jest
        .mocked(MCPClient.create)
        .mockResolvedValue(mockClient as unknown as MCPClient);

      jest.mocked(operations.getProjectMcpServers).mockResolvedValue([
        {
          id: "mcp1",
          serverKey: "mcp1",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: {},
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp1.example.com",
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: false,
          contexts: [],
        },
      ]);

      const mcpHandlers = createMcpHandlerMocks();

      const clients = await getThreadMCPClients(
        mockDb,
        "project123",
        null,
        mcpHandlers,
      );

      expect(clients).toHaveLength(1);
      expect(clients[0].client).toBe(mockClient);
      expect(clients[0].serverId).toBe("mcp1");
      expect(clients[0].serverKey).toBe("mcp1");
      expect(clients[0].url).toBe("http://mcp1.example.com");

      // Verify MCPClient.create was called with empty handlers (sessionless)
      expect(MCPClient.create).toHaveBeenCalledWith(
        "http://mcp1.example.com",
        MCPTransport.HTTP,
        {},
        undefined,
        undefined, // sessionId should be undefined when threadId is null
        {}, // handlers should be empty object when threadId is null
      );

      // Verify getMcpThreadSession was NOT called when threadId is null
      expect(operations.getMcpThreadSession).not.toHaveBeenCalled();

      // Verify updateMcpThreadSession was NOT called when threadId is null
      expect(operations.updateMcpThreadSession).not.toHaveBeenCalled();
    });

    it("should create sessionless MCP client with auth when threadId is null", async () => {
      const mockClient = {
        listTools: jest
          .fn<typeof _mcpClientInstance.listTools>()
          .mockResolvedValue([mockMcpTool]),
        sessionId: undefined,
      };

      jest
        .mocked(MCPClient.create)
        .mockResolvedValue(mockClient as unknown as MCPClient);

      const mockOAuthTokens = {
        access_token: "access123",
        refresh_token: "refresh123",
        expires_in: 3600,
        token_type: "Bearer",
      };

      const mockClientInfo: OAuthClientInformation = {
        client_id: "client123",
        client_secret: "secret123",
      };

      jest.mocked(operations.getProjectMcpServers).mockResolvedValue([
        {
          id: "mcp1",
          serverKey: "mcp1",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: {},
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp1.example.com",
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: true,
          contexts: [
            {
              id: "context1",
              mcpOauthTokens: mockOAuthTokens,
              mcpOauthClientInfo: mockClientInfo,
            } as unknown as schema.DBToolProviderUserContext,
          ],
        },
      ]);

      // Mock the database query for mcpOauthClients
      const findFirstMock = jest
        .fn<typeof mockDb.query.mcpOauthClients.findFirst>()
        .mockResolvedValue({
          sessionId: "session123",
          sessionInfo: {
            clientInformation: mockClientInfo,
          },
        } as schema.DBMcpOauthClient);

      mockDb.query = {
        mcpOauthClients: {
          findFirst: findFirstMock,
        },
      } as unknown as typeof mockDb.query;

      const mcpHandlers = createMcpHandlerMocks();

      const clients = await getThreadMCPClients(
        mockDb,
        "project123",
        null,
        mcpHandlers,
      );

      expect(clients).toHaveLength(1);

      // Verify MCPClient.create was called with empty handlers (sessionless)
      const createCalls = jest.mocked(MCPClient.create).mock.calls;
      expect(createCalls).toHaveLength(1);
      const [url, transport, _headers, _authProvider, sessionId, handlers] =
        createCalls[0];

      expect(url).toBe("http://mcp1.example.com");
      expect(transport).toBe(MCPTransport.HTTP);
      expect(sessionId).toBeUndefined(); // Should be undefined when threadId is null
      expect(handlers).toEqual({}); // Should be empty object when threadId is null

      // Verify getMcpThreadSession was NOT called when threadId is null
      expect(operations.getMcpThreadSession).not.toHaveBeenCalled();

      // Verify updateMcpThreadSession was NOT called when threadId is null
      expect(operations.updateMcpThreadSession).not.toHaveBeenCalled();
    });
  });

  describe("getSystemTools with null threadId", () => {
    it("should return tools from sessionless MCP clients when threadId is null", async () => {
      const mockClient = {
        listTools: jest
          .fn<typeof _mcpClientInstance.listTools>()
          .mockResolvedValue([mockMcpTool]),
        sessionId: undefined,
      };

      jest
        .mocked(MCPClient.create)
        .mockResolvedValue(mockClient as unknown as MCPClient);

      jest.mocked(operations.getProjectMcpServers).mockResolvedValue([
        {
          id: "mcp1",
          serverKey: "mcp1",
          deprecatedComposioAppId: null,
          createdAt: new Date(),
          customHeaders: {},
          projectId: "project123",
          type: ToolProviderType.MCP,
          updatedAt: new Date(),
          url: "http://mcp1.example.com",
          mcpTransport: MCPTransport.HTTP,
          mcpRequiresAuth: false,
          contexts: [],
        },
      ]);

      const mcpHandlers = createMcpHandlerMocks();

      const tools = await getSystemTools(
        mockDb,
        "project123",
        null,
        mcpHandlers,
      );

      expect(tools.mcpToolsSchema).toHaveLength(1);
      expect(tools.mcpToolSources["mcp1__mockMcpTool"]).toEqual({
        client: mockClient,
        serverKey: "mcp1",
      });

      // Verify MCPClient.create was called with empty handlers (sessionless)
      expect(MCPClient.create).toHaveBeenCalledWith(
        "http://mcp1.example.com",
        MCPTransport.HTTP,
        {},
        undefined,
        undefined,
        {}, // handlers should be empty object when threadId is null
      );

      // Verify getMcpThreadSession was NOT called when threadId is null
      expect(operations.getMcpThreadSession).not.toHaveBeenCalled();
    });
  });
});
