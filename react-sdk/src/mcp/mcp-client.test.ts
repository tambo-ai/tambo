import { MCPClient, MCPTransport } from "./mcp-client";

// Mock the MCP SDK modules
jest.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    close: jest.fn(),
    listTools: jest.fn(),
    callTool: jest.fn(),
    setRequestHandler: jest.fn(),
    removeRequestHandler: jest.fn(),
  })),
}));

jest.mock("@modelcontextprotocol/sdk/client/sse.js", () => ({
  SSEClientTransport: jest.fn().mockImplementation(() => ({
    // SSE transport doesn't have sessionId
  })),
}));

jest.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => ({
  StreamableHTTPClientTransport: jest
    .fn()
    .mockImplementation((url, options) => ({
      sessionId: options?.sessionId,
    })),
}));

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Type the mocked modules
const MockedClient = Client as jest.MockedClass<typeof Client>;
const MockedSSEClientTransport = SSEClientTransport as jest.MockedClass<
  typeof SSEClientTransport
>;
const MockedStreamableHTTPClientTransport =
  StreamableHTTPClientTransport as jest.MockedClass<
    typeof StreamableHTTPClientTransport
  >;

describe("MCPClient", () => {
  let mockClientInstance: any;
  let mockTransportInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instances
    mockClientInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      listTools: jest.fn(),
      callTool: jest.fn(),
      setRequestHandler: jest.fn(),
      removeRequestHandler: jest.fn(),
    };

    mockTransportInstance = {
      sessionId: "test-session-id",
    };

    // Setup mocks
    MockedClient.mockImplementation(() => mockClientInstance);
    MockedStreamableHTTPClientTransport.mockImplementation(
      () => mockTransportInstance,
    );
    MockedSSEClientTransport.mockImplementation(
      () => ({}) as SSEClientTransport,
    );
  });

  describe("create", () => {
    it("should create and connect an MCPClient with HTTP transport by default", async () => {
      const endpoint = "https://api.example.com/mcp";
      const headers = { Authorization: "Bearer token" };

      const client = await MCPClient.create(
        endpoint,
        MCPTransport.HTTP,
        headers,
        undefined,
        undefined,
      );

      expect(MockedStreamableHTTPClientTransport).toHaveBeenCalledWith(
        new URL(endpoint),
        { sessionId: undefined, requestInit: { headers } },
      );
      expect(MockedClient).toHaveBeenCalledWith(
        {
          name: "tambo-mcp-client",
          version: "1.0.0",
        },
        { capabilities: {} },
      );
      expect(mockClientInstance.connect).toHaveBeenCalledWith(
        mockTransportInstance,
      );
      expect(client).toBeInstanceOf(MCPClient);
    });

    it("should create and connect an MCPClient with SSE transport", async () => {
      const endpoint = "https://api.example.com/mcp";

      const client = await MCPClient.create(
        endpoint,
        MCPTransport.SSE,
        undefined,
        undefined,
        undefined,
      );

      expect(MockedSSEClientTransport).toHaveBeenCalledWith(new URL(endpoint), {
        requestInit: { headers: {} },
      });
      expect(mockClientInstance.connect).toHaveBeenCalledWith({});
      expect(client).toBeInstanceOf(MCPClient);
    });

    it("should create client with default headers when none provided", async () => {
      const endpoint = "https://api.example.com/mcp";

      await MCPClient.create(
        endpoint,
        MCPTransport.HTTP,
        undefined,
        undefined,
        undefined,
      );

      expect(MockedStreamableHTTPClientTransport).toHaveBeenCalledWith(
        new URL(endpoint),
        { sessionId: undefined, requestInit: { headers: {} } },
      );
    });
  });

  describe("listTools", () => {
    it("should list all tools with pagination", async () => {
      const endpoint = "https://api.example.com/mcp";
      const client = await MCPClient.create(
        endpoint,
        MCPTransport.HTTP,
        undefined,
        undefined,
        undefined,
      );

      const mockTools = [
        {
          name: "tool1",
          description: "First tool",
          inputSchema: {
            type: "object",
            properties: { arg1: { type: "string" } },
          },
        },
        {
          name: "tool2",
          description: "Second tool",
          inputSchema: {
            type: "object",
            properties: { arg2: { type: "number" } },
          },
        },
      ];

      const mockResponse1 = {
        tools: [mockTools[0]],
        nextCursor: "cursor1",
      };

      const mockResponse2 = {
        tools: [mockTools[1]],
        nextCursor: undefined,
      };

      mockClientInstance.listTools
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const result = await client.listTools();

      expect(mockClientInstance.listTools).toHaveBeenCalledTimes(2);
      expect(mockClientInstance.listTools).toHaveBeenNthCalledWith(
        1,
        { cursor: undefined },
        {},
      );
      expect(mockClientInstance.listTools).toHaveBeenNthCalledWith(
        2,
        { cursor: "cursor1" },
        {},
      );
      expect(result).toEqual([
        {
          name: "tool1",
          description: "First tool",
          inputSchema: {
            type: "object",
            properties: { arg1: { type: "string" } },
          },
        },
        {
          name: "tool2",
          description: "Second tool",
          inputSchema: {
            type: "object",
            properties: { arg2: { type: "number" } },
          },
        },
      ]);
    });

    it("should handle single page of tools", async () => {
      const endpoint = "https://api.example.com/mcp";
      const client = await MCPClient.create(
        endpoint,
        MCPTransport.HTTP,
        undefined,
        undefined,
        undefined,
      );

      const mockTools = [
        {
          name: "tool1",
          description: "Only tool",
          inputSchema: {
            type: "object",
            properties: { arg1: { type: "string" } },
          },
        },
      ];

      const mockResponse = {
        tools: mockTools,
        nextCursor: undefined,
      };

      mockClientInstance.listTools.mockResolvedValue(mockResponse);

      const result = await client.listTools();

      expect(mockClientInstance.listTools).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          name: "tool1",
          description: "Only tool",
          inputSchema: {
            type: "object",
            properties: { arg1: { type: "string" } },
          },
        },
      ]);
    });

    it("should throw error for invalid input schema", async () => {
      const endpoint = "https://api.example.com/mcp";
      const client = await MCPClient.create(
        endpoint,
        MCPTransport.HTTP,
        undefined,
        undefined,
        undefined,
      );

      const mockTools = [
        {
          name: "invalid-tool",
          description: "Tool with invalid schema",
          inputSchema: { type: "string" }, // Invalid - should be object
        },
      ];

      const mockResponse = {
        tools: mockTools,
        nextCursor: undefined,
      };

      mockClientInstance.listTools.mockResolvedValue(mockResponse);

      await expect(client.listTools()).rejects.toThrow(
        "Input schema for tool invalid-tool is not an object",
      );
    });
  });

  describe("callTool", () => {
    it("should call a tool with arguments", async () => {
      const endpoint = "https://api.example.com/mcp";
      const client = await MCPClient.create(
        endpoint,
        MCPTransport.HTTP,
        undefined,
        undefined,
        undefined,
      );

      const mockResult = { success: true, data: "test result" };
      mockClientInstance.callTool.mockResolvedValue(mockResult);

      const result = await client.callTool("testTool", {
        arg1: "value1",
        arg2: 42,
      });

      expect(mockClientInstance.callTool).toHaveBeenCalledWith({
        name: "testTool",
        arguments: { arg1: "value1", arg2: 42 },
      });
      expect(result).toBe(mockResult);
    });

    it("should handle tool call errors", async () => {
      const endpoint = "https://api.example.com/mcp";
      const client = await MCPClient.create(
        endpoint,
        MCPTransport.HTTP,
        undefined,
        undefined,
        undefined,
      );
      const error = new Error("Tool call failed");
      mockClientInstance.callTool.mockRejectedValue(error);

      await expect(client.callTool("testTool", {})).rejects.toThrow(
        "Tool call failed",
      );
    });
  });

  describe("transport initialization", () => {
    it("should initialize HTTP transport with session ID", async () => {
      const endpoint = "https://api.example.com/mcp";
      const headers = { Authorization: "Bearer token" };

      await MCPClient.create(
        endpoint,
        MCPTransport.HTTP,
        headers,
        undefined,
        undefined,
      );

      expect(MockedStreamableHTTPClientTransport).toHaveBeenCalledWith(
        new URL(endpoint),
        { sessionId: undefined, requestInit: { headers } },
      );
    });

    it("should initialize SSE transport without session ID", async () => {
      const endpoint = "https://api.example.com/mcp";
      const headers = { Authorization: "Bearer token" };

      await MCPClient.create(
        endpoint,
        MCPTransport.SSE,
        headers,
        undefined,
        undefined,
      );

      expect(MockedSSEClientTransport).toHaveBeenCalledWith(new URL(endpoint), {
        requestInit: { headers },
      });
    });
  });

  describe("client initialization", () => {
    it("should initialize client with correct name and version", async () => {
      const endpoint = "https://api.example.com/mcp";

      await MCPClient.create(
        endpoint,
        MCPTransport.HTTP,
        undefined,
        undefined,
        undefined,
      );

      expect(MockedClient).toHaveBeenCalledWith(
        {
          name: "tambo-mcp-client",
          version: "1.0.0",
        },
        { capabilities: {} },
      );
    });
  });

  describe("handlers (elicitation/sampling)", () => {
    it("sets handlers on create when provided", async () => {
      const endpoint = "https://api.example.com/mcp";
      const elicitation = jest.fn(async () => ({}) as any);
      const sampling = jest.fn(async () => ({}) as any);

      await MCPClient.create(
        endpoint,
        MCPTransport.HTTP,
        undefined,
        undefined,
        undefined,
        { elicitation, sampling },
      );

      expect(MockedClient).toHaveBeenLastCalledWith(
        {
          name: "tambo-mcp-client",
          version: "1.0.0",
        },
        {
          capabilities: {
            elicitation: {},
            sampling: {},
          },
        },
      );

      // Request handlers should be set for both
      expect(mockClientInstance.setRequestHandler).toHaveBeenCalled();
      expect(
        (mockClientInstance.setRequestHandler as jest.Mock).mock.calls.length,
      ).toBeGreaterThanOrEqual(2);
    });

    it("removes elicitation handler when set to undefined", async () => {
      const endpoint = "https://api.example.com/mcp";
      const client = await MCPClient.create(
        endpoint,
        MCPTransport.HTTP,
        undefined,
        undefined,
        undefined,
        {
          elicitation: async () => ({}) as any,
        },
      );

      const removeSpy = mockClientInstance.removeRequestHandler as jest.Mock;

      // then remove
      removeSpy.mockClear();
      await client.updateElicitationHandler(undefined);
      expect(removeSpy).toHaveBeenCalledWith(expect.any(String));
    });

    it("removes sampling handler when set to undefined", async () => {
      const endpoint = "https://api.example.com/mcp";
      const client = await MCPClient.create(
        endpoint,
        MCPTransport.HTTP,
        undefined,
        undefined,
        undefined,
        {
          sampling: async () => ({}) as any,
        },
      );

      const removeSpy = mockClientInstance.removeRequestHandler as jest.Mock;

      // then remove
      removeSpy.mockClear();
      await client.updateSamplingHandler(undefined);
      expect(removeSpy).toHaveBeenCalledWith(expect.any(String));
    });
  });
});
