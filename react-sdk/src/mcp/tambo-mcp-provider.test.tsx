import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ClientNotification,
  ClientRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { render, waitFor } from "@testing-library/react";
import React, { useEffect } from "react";
import {
  TamboClientContext,
  useTamboClient,
} from "../providers/tambo-client-provider";
import { TamboMcpTokenProvider } from "../providers/tambo-mcp-token-provider";
import {
  TamboRegistryProvider,
  useTamboRegistry,
} from "../providers/tambo-registry-provider";
import { MCPClient, MCPTransport } from "./mcp-client";
import {
  extractErrorMessage,
  TamboMcpProvider,
  useTamboMcpServers,
  type McpServer,
  type ProviderMCPHandlers,
} from "./tambo-mcp-provider";

// Import the private function for testing by re-exporting it for tests only
// We'll need to export it temporarily or test it through public API

// Helper to create mock RequestHandlerExtra for testing
function createMockExtra(): RequestHandlerExtra<
  ClientRequest,
  ClientNotification
> {
  return {
    signal: new AbortController().signal,
    requestId: "test-request-id",
    sendNotification: (async () => {}) as any,
    sendRequest: (async () => ({ _meta: {} })) as any,
  };
}

// Mock the MCP client to avoid ES module issues
jest.mock("./mcp-client", () => ({
  MCPClient: jest.fn(),
  MCPTransport: {
    SSE: "sse",
    HTTP: "http",
  },
}));

// Mock the registry provider to avoid dependency issues
jest.mock("../providers/tambo-registry-provider", () => {
  const actual = jest.requireActual("../providers/tambo-registry-provider");
  return {
    ...actual,
    useTamboRegistry: jest.fn(),
  };
});

// Mock the client provider to avoid dependency issues
jest.mock("../providers/tambo-client-provider", () => {
  return {
    useTamboClient: jest.fn(),
    TamboClientContext: React.createContext(undefined),
  };
});

// Helper to wrap tests with all required providers (used across multiple describe blocks)
const TestWrapper: React.FC<{
  mcpServers: any;
  handlers?: ProviderMCPHandlers;
  children: React.ReactNode;
}> = ({ mcpServers, handlers, children }) => {
  const client = useTamboClient();
  return (
    <TamboClientContext.Provider
      value={{
        client,
        queryClient: {} as any,
        isUpdatingToken: false,
      }}
    >
      <TamboRegistryProvider mcpServers={mcpServers}>
        <TamboMcpTokenProvider>
          <TamboMcpProvider handlers={handlers}>{children}</TamboMcpProvider>
        </TamboMcpTokenProvider>
      </TamboRegistryProvider>
    </TamboClientContext.Provider>
  );
};

describe("extractErrorMessage", () => {
  describe("Array content handling", () => {
    it("should extract text from array content with multiple text items", () => {
      const content = [
        { type: "text", text: "Error:" },
        { type: "text", text: "Tool execution failed" },
        { type: "image", url: "http://example.com/error.png" }, // Should be filtered out
      ];

      const result = extractErrorMessage(content);

      expect(result).toBe("Error: Tool execution failed");
    });

    it("should extract text from array content with single text item", () => {
      const content = [{ type: "text", text: "Simple error message" }];

      const result = extractErrorMessage(content);

      expect(result).toBe("Simple error message");
    });

    it("should return fallback message for array content with no text items", () => {
      const content = [
        { type: "image", url: "http://example.com/error.png" },
        { type: "resource", uri: "file://error.log" },
      ];

      const result = extractErrorMessage(content);

      expect(result).toBe("Error occurred but no details provided");
    });

    it("should return fallback message for empty array content", () => {
      const content: any[] = [];

      const result = extractErrorMessage(content);

      expect(result).toBe("Error occurred but no details provided");
    });

    it("should handle array content with mixed types correctly", () => {
      const content = [
        { type: "resource", uri: "file://log.txt" },
        { type: "text", text: "First error" },
        { type: "image", url: "http://example.com/img.png" },
        { type: "text", text: "Second error" },
        { type: "unknown", data: "something" },
      ];

      const result = extractErrorMessage(content);

      expect(result).toBe("First error Second error");
    });

    it("should handle array content with malformed items", () => {
      const content = [
        null,
        { type: "text", text: "Valid error" },
        { type: "text" }, // Missing text property
        { type: "text", text: null }, // Invalid text type
        { type: "text", text: "Another valid error" },
      ];

      const result = extractErrorMessage(content);

      expect(result).toBe("Valid error Another valid error");
    });
  });

  describe("Non-array content handling", () => {
    it("should return string content as-is", () => {
      const content = "Direct error message";

      const result = extractErrorMessage(content);

      expect(result).toBe("Direct error message");
    });

    it("should handle null content", () => {
      const content = null;

      const result = extractErrorMessage(content);

      expect(result).toBe("Unknown error occurred");
    });

    it("should handle undefined content", () => {
      const content = undefined;

      const result = extractErrorMessage(content);

      expect(result).toBe("Unknown error occurred");
    });

    it("should handle number content", () => {
      const content = 42;

      const result = extractErrorMessage(content);

      expect(result).toBe("42");
    });

    it("should handle boolean content", () => {
      const content = false;

      const result = extractErrorMessage(content);

      expect(result).toBe("false");
    });

    it("should handle object content", () => {
      const content = { error: "Something went wrong" };

      const result = extractErrorMessage(content);

      expect(result).toBe('{"error":"Something went wrong"}');
    });

    it("should handle complex object content", () => {
      const content = {
        error: "Something went wrong",
        code: 500,
        details: { message: "Internal server error" },
      };

      const result = extractErrorMessage(content);

      expect(result).toBe(
        '{"error":"Something went wrong","code":500,"details":{"message":"Internal server error"}}',
      );
    });

    it("should handle empty object content", () => {
      const content = {};

      const result = extractErrorMessage(content);

      expect(result).toBe("{}");
    });
  });
});

describe("TamboMcpProvider server list changes", () => {
  beforeEach(() => {
    // Mock registry so tool registration is a no-op
    (useTamboRegistry as unknown as jest.Mock).mockReturnValue({
      registerTool: jest.fn(),
    });

    // Mock client with baseURL
    (useTamboClient as unknown as jest.Mock).mockReturnValue({
      baseURL: "https://api.tambo.co",
    });

    // Ensure MCPClient.create exists and returns a fake client with listTools and close
    (MCPClient as unknown as any).create = jest.fn().mockResolvedValue({
      listTools: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    });
  });

  const Capture: React.FC<{ onUpdate: (servers: McpServer[]) => void }> = ({
    onUpdate,
  }) => {
    const servers = useTamboMcpServers();
    useEffect(() => {
      onUpdate(servers);
    }, [servers, onUpdate]);
    return <div data-testid="urls">{servers.map((s) => s.url).join(",")}</div>;
  };

  it("adds a new server when the list grows", async () => {
    let latest: McpServer[] = [];
    const { rerender, getByTestId } = render(
      <TamboClientContext.Provider
        value={{
          client: useTamboClient(),
          queryClient: {} as any,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider mcpServers={["https://a.example"]}>
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture onUpdate={(s) => (latest = s)} />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for initial connection
    await waitFor(() => {
      expect(latest.length).toBe(1);
    });

    // Add new server
    rerender(
      <TamboClientContext.Provider
        value={{
          client: useTamboClient(),
          queryClient: {} as any,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider
          mcpServers={["https://a.example", "https://b.example"]}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture onUpdate={(s) => (latest = s)} />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(2);
      const urls = getByTestId("urls").textContent || "";
      expect(urls).toContain("https://a.example");
      expect(urls).toContain("https://b.example");
    });
  });

  it("removes a server when the list shrinks", async () => {
    let latest: McpServer[] = [];
    const { rerender, getByTestId } = render(
      <TamboClientContext.Provider
        value={{
          client: useTamboClient(),
          queryClient: {} as any,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider
          mcpServers={["https://a.example", "https://b.example"]}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture onUpdate={(s) => (latest = s)} />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(2);
    });

    // Remove one server
    rerender(
      <TamboClientContext.Provider
        value={{
          client: useTamboClient(),
          queryClient: {} as any,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider mcpServers={["https://a.example"]}>
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture onUpdate={(s) => (latest = s)} />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(1);
      const urls = getByTestId("urls").textContent || "";
      expect(urls).toContain("https://a.example");
      expect(urls).not.toContain("https://b.example");
    });
  });

  it("does not duplicate when a new copy of the same list is passed", async () => {
    let latest: McpServer[] = [];
    const initial = [
      { url: "https://a.example", transport: MCPTransport.SSE },
      { url: "https://b.example", transport: MCPTransport.SSE },
    ];

    const { rerender } = render(
      <TestWrapper mcpServers={initial}>
        <Capture onUpdate={(s) => (latest = s)} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(2);
    });

    // Pass a new array instance with the same logical servers
    const same = [
      { url: "https://a.example", transport: MCPTransport.SSE },
      { url: "https://b.example", transport: MCPTransport.SSE },
    ];
    rerender(
      <TestWrapper mcpServers={same}>
        <Capture onUpdate={(s) => (latest = s)} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(2);
      const urls = latest.map((s) => s.url).sort();
      expect(urls).toEqual(["https://a.example", "https://b.example"].sort());
    });
  });

  it("forwards maxCalls from MCP listTools to registry.registerTool", async () => {
    const registerToolMock = jest.fn();

    // Mock registry to capture registerTool calls
    (useTamboRegistry as unknown as jest.Mock).mockReturnValue({
      registerTool: registerToolMock,
    });

    // Mock client
    (useTamboClient as unknown as jest.Mock).mockReturnValue({
      baseURL: "https://api.tambo.co",
    });

    // Prepare MCP client to return a tool with maxCalls in its metadata
    (MCPClient as unknown as any).create = jest.fn().mockResolvedValue({
      listTools: jest.fn().mockResolvedValue([
        {
          name: "mcp-tool",
          description: "Tool from MCP",
          inputSchema: {},
          outputSchema: {},
          // MCP may include maxCalls in the tool metadata
          maxCalls: 7,
        },
      ]),
      close: jest.fn(),
    });

    // Render provider to trigger MCP sync
    render(
      <TestWrapper mcpServers={["https://mcp.example"]}>
        <div />
      </TestWrapper>,
    );

    // Wait for registerTool to be called
    await waitFor(() => {
      expect(registerToolMock).toHaveBeenCalled();
    });

    // Inspect the first registered tool
    const registered = registerToolMock.mock.calls[0][0];
    expect(registered).toBeDefined();
    expect(registered.name).toBe("mcp-tool");
    expect(registered.maxCalls).toBe(7);
  });

  it("reuses client when same server is passed with new array instance", async () => {
    const createSpy = jest.fn().mockResolvedValue({
      listTools: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    });
    (MCPClient as unknown as any).create = createSpy;

    let latest: McpServer[] = [];
    const initial = [{ url: "https://a.example", transport: MCPTransport.SSE }];

    const { rerender } = render(
      <TestWrapper mcpServers={initial}>
        <Capture onUpdate={(s) => (latest = s)} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(1);
    });

    // Verify client was created once
    expect(createSpy).toHaveBeenCalledTimes(1);
    const firstClient = latest[0].client;

    // Pass a new array with same server
    const same = [{ url: "https://a.example", transport: MCPTransport.SSE }];
    rerender(
      <TestWrapper mcpServers={same}>
        <Capture onUpdate={(s) => (latest = s)} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(1);
    });

    // Client should NOT have been created again
    expect(createSpy).toHaveBeenCalledTimes(1);
    // Should be the exact same client instance
    expect(latest[0].client).toBe(firstClient);
  });

  it("calls close() on removed server clients", async () => {
    const closeSpy = jest.fn();
    const createSpy = jest.fn().mockResolvedValue({
      listTools: jest.fn().mockResolvedValue([]),
      close: closeSpy,
    });
    (MCPClient as unknown as any).create = createSpy;

    let latest: McpServer[] = [];
    const { rerender } = render(
      <TamboClientContext.Provider
        value={{
          client: useTamboClient(),
          queryClient: {} as any,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider
          mcpServers={["https://a.example", "https://b.example"]}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture onUpdate={(s) => (latest = s)} />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(2);
    });

    expect(closeSpy).not.toHaveBeenCalled();

    // Remove one server
    rerender(
      <TamboClientContext.Provider
        value={{
          client: useTamboClient(),
          queryClient: {} as any,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider mcpServers={["https://a.example"]}>
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture onUpdate={(s) => (latest = s)} />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(1);
    });

    // close() should have been called once for the removed server
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it("calls close() on all clients when provider unmounts", async () => {
    const closeSpy = jest.fn();
    const createSpy = jest.fn().mockResolvedValue({
      listTools: jest.fn().mockResolvedValue([]),
      close: closeSpy,
    });
    (MCPClient as unknown as any).create = createSpy;

    let latest: McpServer[] = [];
    const { unmount } = render(
      <TamboClientContext.Provider
        value={{
          client: useTamboClient(),
          queryClient: {} as any,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider
          mcpServers={["https://a.example", "https://b.example"]}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture onUpdate={(s) => (latest = s)} />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(2);
    });

    expect(closeSpy).not.toHaveBeenCalled();

    // Unmount the provider
    unmount();

    // close() should have been called for both clients
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });

  it("creates new client when customHeaders change", async () => {
    const closeSpy = jest.fn();
    let clientIdCounter = 0;
    const createSpy = jest.fn().mockImplementation(async () => {
      const id = ++clientIdCounter;
      return {
        id, // Add an ID so we can track which client is which
        listTools: jest.fn().mockResolvedValue([]),
        close: closeSpy,
      };
    });
    (MCPClient as unknown as any).create = createSpy;

    let latest: McpServer[] = [];
    const { rerender } = render(
      <TestWrapper
        mcpServers={[
          {
            url: "https://a.example",
            transport: MCPTransport.SSE,
            customHeaders: { Authorization: "Bearer token1" },
          },
        ]}
      >
        <Capture onUpdate={(s) => (latest = s)} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(1);
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    const firstClientId = (latest[0].client as any)?.id;
    expect(firstClientId).toBe(1);

    // Change the customHeaders
    rerender(
      <TestWrapper
        mcpServers={[
          {
            url: "https://a.example",
            transport: MCPTransport.SSE,
            customHeaders: { Authorization: "Bearer token2" },
          },
        ]}
      >
        <Capture onUpdate={(s) => (latest = s)} />
      </TestWrapper>,
    );

    // Wait for old client to be closed and new client to be created
    await waitFor(
      () => {
        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(createSpy).toHaveBeenCalledTimes(2);
        expect(latest.length).toBe(1);
        const newClientId = (latest[0].client as any)?.id;
        expect(newClientId).toBe(2); // Should be the new client
      },
      { timeout: 3000 },
    );
  });

  // Note: Token changes for the internal Tambo server are covered by the
  // "creates new client when customHeaders change" test above, since token
  // changes result in different Authorization headers, which trigger client recreation.
});

describe("TamboMcpProvider handler support", () => {
  let mockClient: any;
  let createSpy: jest.Mock;

  beforeEach(() => {
    // Mock registry so tool registration is a no-op
    (useTamboRegistry as unknown as jest.Mock).mockReturnValue({
      registerTool: jest.fn(),
    });

    // Mock client with baseURL
    (useTamboClient as unknown as jest.Mock).mockReturnValue({
      baseURL: "https://api.tambo.co",
    });

    // Create a mock client with update methods
    mockClient = {
      listTools: jest.fn().mockResolvedValue([]),
      updateElicitationHandler: jest.fn(),
      updateSamplingHandler: jest.fn(),
      close: jest.fn(),
    };

    // Mock MCPClient.create to return our mock client
    createSpy = jest.fn().mockResolvedValue(mockClient);
    (MCPClient as unknown as any).create = createSpy;
  });

  const Capture: React.FC<{ onUpdate: (servers: McpServer[]) => void }> = ({
    onUpdate,
  }) => {
    const servers = useTamboMcpServers();
    useEffect(() => {
      onUpdate(servers);
    }, [servers, onUpdate]);
    return null;
  };

  it("should pass provider-level elicitation handler to MCPClient.create", async () => {
    const mockElicitationHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "test" }],
    });

    const handlers: ProviderMCPHandlers = {
      elicitation: mockElicitationHandler,
    };

    let latest: McpServer[] = [];
    render(
      <TestWrapper mcpServers={["https://test.example"]} handlers={handlers}>
        <Capture onUpdate={(s) => (latest = s)} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(1);
    });

    // Verify MCPClient.create was called with an HTTP transport and wrapped handler
    expect(createSpy).toHaveBeenCalledWith(
      "https://test.example",
      MCPTransport.HTTP,
      undefined,
      undefined,
      undefined,
      expect.objectContaining({
        elicitation: expect.any(Function),
      }),
    );

    // Get the actual handler that was passed
    const passedHandlers = createSpy.mock.calls[0][5];
    expect(passedHandlers.elicitation).toBeDefined();

    // Call the wrapped handler and verify it receives serverInfo
    const mockRequest = {
      method: "sampling/createMessage" as const,
      params: {},
    };
    const mockExtra = createMockExtra();
    await passedHandlers.elicitation(mockRequest, mockExtra);

    expect(mockElicitationHandler).toHaveBeenCalledWith(
      mockRequest,
      mockExtra,
      expect.objectContaining({
        url: "https://test.example",
        serverKey: "test",
      }),
    );
  });

  it("should pass provider-level sampling handler to MCPClient.create", async () => {
    const mockSamplingHandler = jest.fn().mockResolvedValue({
      model: "test-model",
      stopReason: "endTurn",
      role: "assistant",
      content: { type: "text", text: "response" },
    });

    const handlers: ProviderMCPHandlers = {
      sampling: mockSamplingHandler,
    };

    let latest: McpServer[] = [];
    render(
      <TestWrapper mcpServers={["https://test.example"]} handlers={handlers}>
        <Capture onUpdate={(s) => (latest = s)} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(1);
    });

    // Verify MCPClient.create was called with HTTP transport and sampling handler
    expect(createSpy).toHaveBeenCalledWith(
      "https://test.example",
      MCPTransport.HTTP,
      undefined,
      undefined,
      undefined,
      expect.objectContaining({
        sampling: expect.any(Function),
      }),
    );

    // Get the actual handler and verify it receives serverInfo
    const passedHandlers = createSpy.mock.calls[0][5];
    const mockRequest = {
      method: "sampling/createMessage" as const,
      params: {
        messages: [],
        modelPreferences: {},
      },
    };
    const mockExtra = createMockExtra();
    await passedHandlers.sampling(mockRequest, mockExtra);

    expect(mockSamplingHandler).toHaveBeenCalledWith(
      mockRequest,
      mockExtra,
      expect.objectContaining({
        url: "https://test.example",
        serverKey: "test",
      }),
    );
  });

  it("should allow per-server handlers to override provider-level handlers", async () => {
    const providerElicitationHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "provider" }],
    });

    const serverElicitationHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "server" }],
    });

    const handlers: ProviderMCPHandlers = {
      elicitation: providerElicitationHandler,
    };

    let latest: McpServer[] = [];
    render(
      <TestWrapper
        mcpServers={[
          {
            url: "https://test.example",
            handlers: {
              elicitation: serverElicitationHandler,
            },
          },
        ]}
        handlers={handlers}
      >
        <Capture onUpdate={(s) => (latest = s)} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(1);
    });

    // Verify the per-server handler was used, not the provider handler
    const passedHandlers = createSpy.mock.calls[0][5];
    expect(passedHandlers.elicitation).toBe(serverElicitationHandler);
  });

  it("should pass different serverInfo to handlers for different servers", async () => {
    const mockElicitationHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "test" }],
    });

    const handlers: ProviderMCPHandlers = {
      elicitation: mockElicitationHandler,
    };

    let latest: McpServer[] = [];
    render(
      <TestWrapper
        mcpServers={[
          { url: "https://server-a.example", name: "Server A" },
          { url: "https://server-b.example", name: "Server B" },
        ]}
        handlers={handlers}
      >
        <Capture onUpdate={(s) => (latest = s)} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(2);
    });

    // Verify both servers got handlers
    expect(createSpy).toHaveBeenCalledTimes(2);

    // Get handlers for both servers
    const serverAHandlers = createSpy.mock.calls[0][5];
    const serverBHandlers = createSpy.mock.calls[1][5];

    const mockRequest = {
      method: "sampling/createMessage" as const,
      params: {},
    };
    const mockExtra = createMockExtra();

    // Call handler for server A
    await serverAHandlers.elicitation(mockRequest, mockExtra);
    expect(mockElicitationHandler).toHaveBeenCalledWith(
      mockRequest,
      mockExtra,
      expect.objectContaining({
        url: "https://server-a.example",
        name: "Server A",
      }),
    );

    mockElicitationHandler.mockClear();

    // Call handler for server B
    await serverBHandlers.elicitation(mockRequest, mockExtra);
    expect(mockElicitationHandler).toHaveBeenCalledWith(
      mockRequest,
      mockExtra,
      expect.objectContaining({
        url: "https://server-b.example",
        name: "Server B",
      }),
    );
  });

  it("should update handlers when provider handlers change", async () => {
    const initialHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "initial" }],
    });

    const updatedHandler = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "updated" }],
    });

    let latest: McpServer[] = [];
    const { rerender } = render(
      <TestWrapper
        mcpServers={["https://test.example"]}
        handlers={{ elicitation: initialHandler }}
      >
        <Capture onUpdate={(s) => (latest = s)} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(1);
    });

    // Update the handlers
    rerender(
      <TestWrapper
        mcpServers={["https://test.example"]}
        handlers={{ elicitation: updatedHandler }}
      >
        <Capture onUpdate={(s) => (latest = s)} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(mockClient.updateElicitationHandler).toHaveBeenCalled();
    });

    // Verify the handler was updated
    expect(mockClient.updateElicitationHandler).toHaveBeenCalledWith(
      expect.any(Function),
    );
  });
});

describe("TamboMcpProvider serverKey derivation and tool prefixing", () => {
  let mockRegisterTool: jest.Mock;

  beforeEach(() => {
    mockRegisterTool = jest.fn();

    (useTamboRegistry as unknown as jest.Mock).mockReturnValue({
      registerTool: mockRegisterTool,
    });

    (useTamboClient as unknown as jest.Mock).mockReturnValue({
      baseURL: "https://api.tambo.co",
    });
  });

  const Capture: React.FC<{ onUpdate: (servers: McpServer[]) => void }> = ({
    onUpdate,
  }) => {
    const servers = useTamboMcpServers();
    useEffect(() => {
      onUpdate(servers);
    }, [servers, onUpdate]);
    return null;
  };

  describe("serverKey derivation", () => {
    it("should derive serverKey from URL when not provided", async () => {
      (MCPClient as unknown as any).create = jest.fn().mockResolvedValue({
        listTools: jest.fn().mockResolvedValue([]),
        close: jest.fn(),
      });

      let latest: McpServer[] = [];
      render(
        <TestWrapper mcpServers={["https://mcp.linear.app/mcp"]}>
          <Capture onUpdate={(s) => (latest = s)} />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(latest.length).toBe(1);
        expect(latest[0].serverKey).toBe("linear");
      });
    });

    it("should use provided serverKey when specified", async () => {
      (MCPClient as unknown as any).create = jest.fn().mockResolvedValue({
        listTools: jest.fn().mockResolvedValue([]),
        close: jest.fn(),
      });

      let latest: McpServer[] = [];
      render(
        <TestWrapper
          mcpServers={[
            {
              url: "https://mcp.linear.app/mcp",
              serverKey: "custom-key",
            },
          ]}
        >
          <Capture onUpdate={(s) => (latest = s)} />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(latest.length).toBe(1);
        expect(latest[0].serverKey).toBe("custom-key");
      });
    });

    it("should derive serverKey correctly for various URL patterns", async () => {
      (MCPClient as unknown as any).create = jest.fn().mockResolvedValue({
        listTools: jest.fn().mockResolvedValue([]),
        close: jest.fn(),
      });

      const testCases = [
        { url: "https://api.github.com", expected: "github" },
        { url: "https://google.com", expected: "google" },
        { url: "https://google.co.uk", expected: "google" },
        { url: "https://mcp.company.co.uk", expected: "company" },
        { url: "https://www.example.com", expected: "example" },
      ];

      for (const { url, expected } of testCases) {
        let latest: McpServer[] = [];
        const { unmount } = render(
          <TestWrapper mcpServers={[url]}>
            <Capture onUpdate={(s) => (latest = s)} />
          </TestWrapper>,
        );

        await waitFor(() => {
          expect(latest.length).toBe(1);
          expect(latest[0].serverKey).toBe(expected);
        });

        unmount();
      }
    });
  });

  describe("tool name prefixing", () => {
    it("should NOT prefix tool names when only one server is present", async () => {
      (MCPClient as unknown as any).create = jest.fn().mockResolvedValue({
        listTools: jest
          .fn()
          .mockResolvedValue([
            { name: "test-tool", description: "A test tool" },
          ]),
        close: jest.fn(),
      });

      let latest: McpServer[] = [];
      render(
        <TestWrapper mcpServers={["https://mcp.linear.app/mcp"]}>
          <Capture onUpdate={(s) => (latest = s)} />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(latest.length).toBe(1);
        expect(mockRegisterTool).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "test-tool", // NOT prefixed
          }),
        );
      });
    });

    it("should prefix tool names when multiple servers are present", async () => {
      (MCPClient as unknown as any).create = jest.fn().mockResolvedValue({
        listTools: jest
          .fn()
          .mockResolvedValue([
            { name: "test-tool", description: "A test tool" },
          ]),
        close: jest.fn(),
      });

      let latest: McpServer[] = [];
      render(
        <TestWrapper
          mcpServers={["https://mcp.linear.app/mcp", "https://api.github.com"]}
        >
          <Capture onUpdate={(s) => (latest = s)} />
        </TestWrapper>,
      );

      await waitFor(
        () => {
          expect(latest.length).toBe(2);
          // Check that tools are registered with prefixed names
          const calls = mockRegisterTool.mock.calls;
          const toolNames = calls.map((call) => call[0].name);

          // Debug: log the actual tool names registered
          if (toolNames.length < 2) {
            throw new Error(
              `Only ${toolNames.length} tools registered: ${toolNames.join(", ")}`,
            );
          }

          expect(
            calls.some((call) => call[0].name === "linear__test-tool"),
          ).toBe(true);
          expect(
            calls.some((call) => call[0].name === "github__test-tool"),
          ).toBe(true);
        },
        { timeout: 5000 },
      );
    });

    it("should use custom serverKey in prefix when provided", async () => {
      (MCPClient as unknown as any).create = jest.fn().mockResolvedValue({
        listTools: jest
          .fn()
          .mockResolvedValue([
            { name: "test-tool", description: "A test tool" },
          ]),
        close: jest.fn(),
      });

      let latest: McpServer[] = [];
      render(
        <TestWrapper
          mcpServers={[
            {
              url: "https://mcp.linear.app/mcp",
              serverKey: "my-server",
            },
            "https://api.github.com",
          ]}
        >
          <Capture onUpdate={(s) => (latest = s)} />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(latest.length).toBe(2);
        const calls = mockRegisterTool.mock.calls;
        expect(
          calls.some((call) => call[0].name === "my-server__test-tool"),
        ).toBe(true);
      });
    });
  });
});
