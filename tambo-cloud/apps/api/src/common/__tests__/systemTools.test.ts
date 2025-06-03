import { jest } from "@jest/globals";
import {
  MCPClient,
  MCPToolSpec,
  MCPTransport,
  ToolProviderType,
} from "@tambo-ai-cloud/core";
import { getDb, operations } from "@tambo-ai-cloud/db";
import { Composio, OpenAIToolSet } from "composio-core";
import { JSONSchema7 } from "json-schema";
import { getComposio } from "../composio";
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
jest.mock("composio-core", () => ({
  Composio: jest.fn().mockImplementation(() => ({
    apps: {
      list: jest.fn(),
    },
  })),

  OpenAIToolSet: jest.fn().mockImplementation(() => ({
    getTools: jest.fn(),
  })),
}));
jest.mock("../composio", () => ({
  getComposio: jest.fn().mockImplementation(() => ({
    apps: {
      list: jest.fn(),
    },
  })),
}));

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
const _openaiToolSetInstance = null as unknown as OpenAIToolSet;
const _mcpClientInstance = null as unknown as MCPClient;
const _composioInstance = null as unknown as Composio;

describe("getSystemTools", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(getComposio).mockImplementation(
      () =>
        ({
          apps: {
            list: jest
              .fn<typeof _composioInstance.apps.list>()
              .mockResolvedValue([]),
          },
        }) as any,
    );
    jest.mocked(OpenAIToolSet).mockImplementation(
      () =>
        ({
          getTools: jest
            .fn<typeof _openaiToolSetInstance.getTools>()
            .mockResolvedValue([]),
        }) as Partial<OpenAIToolSet> as any,
    );
    jest.mocked(operations.getProjectMcpServers).mockResolvedValue([]);
    jest.mocked(operations.getComposioApps).mockResolvedValue([]);
  });
  it("should return empty tools when no MCP servers or Composio apps exist", async () => {
    // mockDb.query.toolProviders.findMany.mockResolvedValue([]);
    const mockDb = getDb("");

    const tools = await getSystemTools(mockDb, "project123", "default");
    expect(tools).toEqual({
      composioToolNames: [],
      mcpToolSources: {},
      composioClient: undefined,
      tools: [],
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
    jest.mocked(OpenAIToolSet).mockImplementation(
      () =>
        ({
          getTools: jest
            .fn<typeof _openaiToolSetInstance.getTools>()
            .mockResolvedValueOnce([
              //   {
              //     type: "function",
              //     function: {
              //       name: "mockMcpTool",
              //     },
              //   },
            ]),
        }) as Partial<OpenAIToolSet> as any,
    );
    jest.mocked(operations.getProjectMcpServers).mockResolvedValueOnce([
      {
        id: "mcp1",
        composioAppId: "app123",
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

    const tools = await getSystemTools(mockDb, "project123", "default");
    expect(tools).toEqual(
      expect.objectContaining({
        composioClient: undefined,
        composioToolNames: [],
        mcpToolSources: {
          mockMcpTool: expect.any(Object),
        },
        tools: [
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

  it("should fetch and combine tools from Composio apps", async () => {
    const mockDb = getDb("");

    jest.mocked(operations.getComposioApps).mockResolvedValueOnce([
      {
        id: "composio1",
        composioAppId: "app123",
        createdAt: new Date(),
        customHeaders: {},
        contexts: [],
        projectId: "project123",
        type: ToolProviderType.COMPOSIO,
        updatedAt: new Date(),
        url: null,
        mcpTransport: MCPTransport.HTTP,
        mcpRequiresAuth: false,
      },
    ]);

    jest.mocked(OpenAIToolSet).mockImplementation(
      () =>
        ({
          getTools: jest
            .fn<typeof _openaiToolSetInstance.getTools>()
            .mockResolvedValueOnce([
              {
                type: "function",
                function: {
                  name: "mockComposioTool",
                },
              },
            ]),
        }) as Partial<OpenAIToolSet> as any,
    );

    const tools = await getSystemTools(mockDb, "project123", "default");
    expect(tools).toEqual(
      expect.objectContaining({
        composioToolNames: ["mockComposioTool"],
        mcpToolSources: {},
        tools: [
          {
            function: {
              description: undefined,
              name: "mockComposioTool",
              parameters: {
                properties: {},
                required: [],
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
