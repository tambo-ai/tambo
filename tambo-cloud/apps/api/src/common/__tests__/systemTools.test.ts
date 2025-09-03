import { jest } from "@jest/globals";
import {
  MCPClient,
  MCPToolSpec,
  MCPTransport,
  ToolProviderType,
} from "@tambo-ai-cloud/core";
import { getDb, operations } from "@tambo-ai-cloud/db";
import { type JSONSchema7 } from "json-schema";
import { getSystemTools } from "../systemTools";

jest.mock("@tambo-ai-cloud/db", () => {
  const schema = jest.requireActual<any>("@tambo-ai-cloud/db").schema;

  return {
    operations: {
      getProjectMcpServers: jest.fn(),
      getComposioApps: jest.fn(),
    },
    schema,
    getDb: jest.fn(),
  };
});
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
  },
};
// This is a workaround to an eslint bug where eslint crashes when trying to
// analyze `typeof ClassName.prototype.methodName` - instead we make fake
// instances and use `typeof instance.methodName`
const _mcpClientInstance = null as unknown as MCPClient;

describe("getSystemTools", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(operations.getProjectMcpServers).mockResolvedValue([]);
  });
  it("should return empty tools when no MCP servers exist", async () => {
    // mockDb.query.toolProviders.findMany.mockResolvedValue([]);
    const mockDb = getDb("");

    const tools = await getSystemTools(mockDb, "project123");
    expect(tools).toEqual({
      mcpToolSources: {},
      mcpToolsSchema: [],
    });
  });

  it("should fetch and combine tools from MCP servers", async () => {
    jest.mocked(MCPClient.create).mockResolvedValue({
      listTools: jest
        .fn<typeof _mcpClientInstance.listTools>()
        .mockResolvedValueOnce([
          {
            name: "mockMcpTool",
            description: "A mock MCP tool",
            inputSchema: {
              type: "object",
              properties: {
                param1: {
                  type: "string",
                },
              },
            },
          },
        ]),
    } as any);

    jest.mocked(operations.getProjectMcpServers).mockResolvedValueOnce([
      {
        id: "mcp1",
        deprecatedComposioAppId: "app123",
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

    jest.mocked(MCPClient.create).mockImplementation(
      () =>
        ({
          listTools: jest
            .fn<typeof _mcpClientInstance.listTools>()
            .mockResolvedValueOnce([mockMcpTool]),
        }) as any,
    );
    const mockDb = getDb("");

    const tools = await getSystemTools(mockDb, "project123");
    expect(tools).toEqual(
      expect.objectContaining({
        mcpToolSources: {
          mockMcpTool: expect.any(Object),
        },
        mcpToolsSchema: [
          {
            function: {
              description: "A mock MCP tool",
              name: "mockMcpTool",
              parameters: {
                properties: {
                  param1: {
                    type: "string",
                  },
                },
                required: undefined,
                type: "object",
                additionalProperties: false,
              },
              strict: true,
            },
            type: "function",
          },
        ],
      }),
    );
  });
});
