import { MCPClient, MCPTransport } from "../mcp-client";

// Mock the MCP SDK modules
jest.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    close: jest.fn(),
    listTools: jest.fn(),
    callTool: jest.fn(),
    onclose: null,
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
      onclose: null,
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
      );

      expect(MockedStreamableHTTPClientTransport).toHaveBeenCalledWith(
        new URL(endpoint),
        { sessionId: undefined, requestInit: { headers } },
      );
      expect(MockedClient).toHaveBeenCalledWith({
        name: "tambo-mcp-client",
        version: "1.0.0",
      });
      expect(mockClientInstance.connect).toHaveBeenCalledWith(
        mockTransportInstance,
      );
      expect(client).toBeInstanceOf(MCPClient);
    });

    it("should create and connect an MCPClient with SSE transport", async () => {
      const endpoint = "https://api.example.com/mcp";

      const client = await MCPClient.create(endpoint, MCPTransport.SSE);

      expect(MockedSSEClientTransport).toHaveBeenCalledWith(new URL(endpoint), {
        requestInit: { headers: {} },
      });
      expect(mockClientInstance.connect).toHaveBeenCalledWith({});
      expect(client).toBeInstanceOf(MCPClient);
    });

    it("should create client with default headers when none provided", async () => {
      const endpoint = "https://api.example.com/mcp";

      await MCPClient.create(endpoint);

      expect(MockedStreamableHTTPClientTransport).toHaveBeenCalledWith(
        new URL(endpoint),
        { sessionId: undefined, requestInit: { headers: {} } },
      );
    });
  });

  describe("reconnect", () => {
    it("should create new transport and client instances and call connect when reconnect() is called", async () => {
      const endpoint = "https://api.example.com/mcp";
      const client = await MCPClient.create(endpoint, MCPTransport.HTTP);

      // Clear previous calls to focus on reconnect behavior
      jest.clearAllMocks();

      // Create new mock instances to verify new instances are created
      const newMockClientInstance = {
        connect: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
        listTools: jest.fn(),
        callTool: jest.fn(),
        onclose: null,
      };

      const newMockTransportInstance = {
        sessionId: "new-session-id",
      };

      // Mock the constructors to return new instances
      MockedClient.mockImplementation(() => newMockClientInstance as any);
      MockedStreamableHTTPClientTransport.mockImplementation(
        () => newMockTransportInstance as any,
      );

      await client.reconnect();

      // Verify old client was closed
      expect(mockClientInstance.close).toHaveBeenCalled();

      // Verify new transport was created with preserved session ID
      expect(MockedStreamableHTTPClientTransport).toHaveBeenCalledWith(
        new URL(endpoint),
        { sessionId: "test-session-id", requestInit: { headers: {} } },
      );

      // Verify new client was created
      expect(MockedClient).toHaveBeenCalledWith({
        name: "tambo-mcp-client",
        version: "1.0.0",
      });

      // Verify new client's connect was called with new transport
      expect(newMockClientInstance.connect).toHaveBeenCalledWith(
        newMockTransportInstance,
      );
    });

    it("should reconnect without session ID for SSE transport", async () => {
      const endpoint = "https://api.example.com/mcp";
      const client = await MCPClient.create(endpoint, MCPTransport.SSE);

      // Clear previous calls
      jest.clearAllMocks();

      await client.reconnect();

      expect(mockClientInstance.close).toHaveBeenCalled();
      expect(MockedSSEClientTransport).toHaveBeenCalledWith(new URL(endpoint), {
        requestInit: { headers: {} },
      });
      expect(mockClientInstance.connect).toHaveBeenCalledWith({});
    });

    it("should handle close errors when reportErrorOnClose is true", async () => {
      const endpoint = "https://api.example.com/mcp";
      const client = await MCPClient.create(endpoint, MCPTransport.HTTP);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Make close throw an error
      mockClientInstance.close.mockRejectedValue(new Error("Close failed"));

      await client.reconnect(true);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error closing Tambo MCP Client:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it("should not log close errors when reportErrorOnClose is false", async () => {
      const endpoint = "https://api.example.com/mcp";
      const client = await MCPClient.create(endpoint, MCPTransport.HTTP);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Make close throw an error
      mockClientInstance.close.mockRejectedValue(new Error("Close failed"));

      await client.reconnect(false);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("onclose", () => {
    it("should reconnect MCPClient when client is closed by external means", async () => {
      const endpoint = "https://api.example.com/mcp";
      const client = await MCPClient.create(endpoint, MCPTransport.HTTP);
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      // Create new mock instances to verify reconnection creates new instances
      const newMockClientInstance = {
        connect: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
        listTools: jest.fn(),
        callTool: jest.fn(),
        onclose: null,
      };

      const newMockTransportInstance = {
        sessionId: "reconnected-session-id",
      };

      // Mock the constructors to return new instances for reconnection
      MockedClient.mockImplementation(() => newMockClientInstance as any);
      MockedStreamableHTTPClientTransport.mockImplementation(
        () => newMockTransportInstance as any,
      );

      // Simulate the onclose callback being triggered by external client closure
      await (client as any).onclose();

      // Verify warning message is logged
      expect(consoleSpy).toHaveBeenCalledWith(
        "Tambo MCP Client closed, reconnecting...",
      );

      // Verify old client was closed
      expect(mockClientInstance.close).toHaveBeenCalled();

      // Verify new transport was created with preserved session ID
      expect(MockedStreamableHTTPClientTransport).toHaveBeenCalledWith(
        new URL(endpoint),
        { sessionId: "test-session-id", requestInit: { headers: {} } },
      );

      // Verify new client was created
      expect(MockedClient).toHaveBeenCalledWith({
        name: "tambo-mcp-client",
        version: "1.0.0",
      });

      // Verify new client's connect was called with new transport
      expect(newMockClientInstance.connect).toHaveBeenCalledWith(
        newMockTransportInstance,
      );

      consoleSpy.mockRestore();
    });
  });

  describe("listTools", () => {
    it("should list all tools with pagination", async () => {
      const endpoint = "https://api.example.com/mcp";
      const client = await MCPClient.create(endpoint, MCPTransport.HTTP);

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
      const client = await MCPClient.create(endpoint, MCPTransport.HTTP);

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
      const client = await MCPClient.create(endpoint, MCPTransport.HTTP);

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
      const client = await MCPClient.create(endpoint, MCPTransport.HTTP);

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
      const client = await MCPClient.create(endpoint, MCPTransport.HTTP);

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

      await MCPClient.create(endpoint, MCPTransport.HTTP, headers);

      expect(MockedStreamableHTTPClientTransport).toHaveBeenCalledWith(
        new URL(endpoint),
        { sessionId: undefined, requestInit: { headers } },
      );
    });

    it("should initialize SSE transport without session ID", async () => {
      const endpoint = "https://api.example.com/mcp";
      const headers = { Authorization: "Bearer token" };

      await MCPClient.create(endpoint, MCPTransport.SSE, headers);

      expect(MockedSSEClientTransport).toHaveBeenCalledWith(new URL(endpoint), {
        requestInit: { headers },
      });
    });
  });

  describe("client initialization", () => {
    it("should initialize client with correct name and version", async () => {
      const endpoint = "https://api.example.com/mcp";

      await MCPClient.create(endpoint);

      expect(MockedClient).toHaveBeenCalledWith({
        name: "tambo-mcp-client",
        version: "1.0.0",
      });
    });

    it("should set onclose handler", async () => {
      const endpoint = "https://api.example.com/mcp";
      const _client = await MCPClient.create(endpoint);

      expect(mockClientInstance.onclose).toBeDefined();
      expect(typeof mockClientInstance.onclose).toBe("function");
    });
  });
});
