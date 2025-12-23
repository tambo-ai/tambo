import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import type TamboAI from "@tambo-ai/typescript-sdk";
import { ServerType } from "../../mcp/mcp-constants";
import type { McpServer } from "../../mcp/tambo-mcp-provider";
import { TamboProvider } from "../tambo-provider";
import { useTamboThreadInput } from "../tambo-thread-input-provider";

// Mock the Tambo client provider to avoid needing real API credentials

jest.mock("../tambo-client-provider", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactModule = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { QueryClient: QC } = require("@tanstack/react-query");
  const mockQueryClient = new QC();
  const MockContext = ReactModule.createContext({
    client: {},
    queryClient: mockQueryClient,
    isUpdatingToken: false,
  });
  return {
    TamboClientProvider: ({ children }: { children: React.ReactNode }) => (
      <MockContext.Provider
        value={{
          client: {},
          queryClient: mockQueryClient,
          isUpdatingToken: false,
        }}
      >
        {children}
      </MockContext.Provider>
    ),
    TamboClientContext: MockContext,
    useTamboClient: () => ({
      client: {},
      queryClient: mockQueryClient,
      isUpdatingToken: false,
    }),
  };
});

// Mock the thread provider to capture sendThreadMessage calls
const mockSendThreadMessage = jest.fn();
const mockContextKey = "test-context-key";
jest.mock("../tambo-thread-provider", () => ({
  TamboThreadProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  useTamboThread: () => ({
    thread: { id: "test-thread-id" },
    sendThreadMessage: mockSendThreadMessage,
    contextKey: mockContextKey,
  }),
}));

// Mock servers array - will be updated per test
let mockServers: McpServer[] = [];

// Mock the MCP provider to avoid real MCP connections
jest.mock("../../mcp/tambo-mcp-provider", () => ({
  TamboMcpProvider: ({ children }: { children: React.ReactNode }) => children,
  useTamboMcpServers: () => mockServers,
}));

// Mock the MCP token provider
jest.mock("../tambo-mcp-token-provider", () => ({
  TamboMcpTokenProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  useTamboMcpToken: () => ({
    mcpAccessToken: null,
    tamboBaseUrl: null,
  }),
}));

// Helper to create internal server
const createMockInternalServer = (serverKey: string): McpServer =>
  ({
    key: serverKey,
    serverKey,
    url: "https://api.tambo.ai/mcp",
    name: "__tambo_internal_mcp_server__",
    transport: "http",
    serverType: ServerType.TAMBO_INTERNAL,
    connectionError: undefined, // Internal servers resolved by backend
  }) as unknown as McpServer;

// Mock the message images hook
jest.mock("../../hooks/use-message-images", () => ({
  useMessageImages: () => ({
    images: [],
    addImage: jest.fn(),
    addImages: jest.fn(),
    removeImage: jest.fn(),
    clearImages: jest.fn(),
  }),
}));

// Mock the mutation hook to execute the mutation function directly
jest.mock("../../hooks/react-query-hooks", () => ({
  useTamboMutation: ({ mutationFn }: { mutationFn: () => Promise<void> }) => ({
    mutateAsync: mutationFn,
    mutate: mutationFn,
    isLoading: false,
    isError: false,
    isSuccess: false,
    error: null,
    reset: jest.fn(),
  }),
}));

describe("TamboProvider - Resource Content Resolution Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendThreadMessage.mockResolvedValue(undefined);
    // Default: no MCP servers (registry resources don't need a server entry)
    mockServers = [];
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    mockServers = [];
  });

  const createWrapper = (options?: {
    listResources?: (
      search?: string,
    ) => Promise<{ uri: string; name: string; mimeType?: string }[]>;
    getResource?: (uri: string) => Promise<unknown>;
    resources?: { uri: string; name: string; mimeType?: string }[];
  }) => {
    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TamboProvider
            apiKey="test-api-key"
            tamboUrl="https://api.tambo.ai"
            listResources={options?.listResources}
            // Cast to any because test mocks return simplified types
            getResource={options?.getResource as any}
            resources={options?.resources}
            contextKey={mockContextKey}
          >
            {children}
          </TamboProvider>
        </QueryClientProvider>
      );
    }
    return Wrapper;
  };

  it("should resolve registry resource content when submitting a message", async () => {
    const mockGetResource = jest.fn().mockResolvedValue({
      contents: [
        {
          uri: "file:///my-document.txt",
          mimeType: "text/plain",
          text: "This is the document content from the registry",
        },
      ],
    });

    const mockListResources = jest.fn().mockResolvedValue([
      {
        uri: "file:///my-document.txt",
        name: "My Document",
        mimeType: "text/plain",
      },
    ]);

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper({
        listResources: mockListResources,
        getResource: mockGetResource,
      }),
    });

    // Set the input value with a registry resource reference
    act(() => {
      result.current.setValue(
        "Show me the contents of @registry:file:///my-document.txt in a table",
      );
    });

    // Submit the message
    await act(async () => {
      await result.current.submit();
    });

    // Verify getResource was called with the correct URI (without the registry: prefix)
    expect(mockGetResource).toHaveBeenCalledWith("file:///my-document.txt");

    // Verify sendThreadMessage was called with the resolved content
    expect(mockSendThreadMessage).toHaveBeenCalledTimes(1);
    const [, options] = mockSendThreadMessage.mock.calls[0];
    const content =
      options.content as TamboAI.Beta.Threads.ChatCompletionContentPart[];

    // Should have: text "Show me the contents of ", resource with resolved content, text " in a table"
    expect(content).toMatchInlineSnapshot(`
      [
        {
          "text": "Show me the contents of ",
          "type": "text",
        },
        {
          "resource": {
            "mimeType": "text/plain",
            "text": "This is the document content from the registry",
            "uri": "file:///my-document.txt",
          },
          "type": "resource",
        },
        {
          "text": " in a table",
          "type": "text",
        },
      ]
    `);
  });

  it("should resolve multiple registry resources in a single message", async () => {
    const mockGetResource = jest
      .fn()
      .mockImplementation(async (uri: string) => {
        if (uri === "file:///doc1.txt") {
          return { contents: [{ uri, text: "Content of doc1" }] };
        }
        if (uri === "file:///doc2.txt") {
          return { contents: [{ uri, text: "Content of doc2" }] };
        }
        return null;
      });

    const mockListResources = jest.fn().mockResolvedValue([]);

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper({
        listResources: mockListResources,
        getResource: mockGetResource,
      }),
    });

    act(() => {
      result.current.setValue(
        "Compare @registry:file:///doc1.txt with @registry:file:///doc2.txt",
      );
    });

    await act(async () => {
      await result.current.submit();
    });

    // Both resources should have been fetched
    expect(mockGetResource).toHaveBeenCalledWith("file:///doc1.txt");
    expect(mockGetResource).toHaveBeenCalledWith("file:///doc2.txt");

    const [, options] = mockSendThreadMessage.mock.calls[0];
    const content =
      options.content as TamboAI.Beta.Threads.ChatCompletionContentPart[];

    expect(content).toMatchInlineSnapshot(`
      [
        {
          "text": "Compare ",
          "type": "text",
        },
        {
          "resource": {
            "text": "Content of doc1",
            "uri": "file:///doc1.txt",
          },
          "type": "resource",
        },
        {
          "text": " with ",
          "type": "text",
        },
        {
          "resource": {
            "text": "Content of doc2",
            "uri": "file:///doc2.txt",
          },
          "type": "resource",
        },
      ]
    `);
  });

  it("should resolve registry resource with blob content", async () => {
    const mockGetResource = jest.fn().mockResolvedValue({
      contents: [
        {
          uri: "file:///image.png",
          mimeType: "image/png",
          blob: "base64encodedimagedata",
        },
      ],
    });

    const mockListResources = jest.fn().mockResolvedValue([]);

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper({
        listResources: mockListResources,
        getResource: mockGetResource,
      }),
    });

    act(() => {
      result.current.setValue("Analyze @registry:file:///image.png");
    });

    await act(async () => {
      await result.current.submit();
    });

    const [, options] = mockSendThreadMessage.mock.calls[0];
    const content =
      options.content as TamboAI.Beta.Threads.ChatCompletionContentPart[];

    expect(content).toMatchInlineSnapshot(`
      [
        {
          "text": "Analyze ",
          "type": "text",
        },
        {
          "resource": {
            "blob": "base64encodedimagedata",
            "mimeType": "image/png",
            "uri": "file:///image.png",
          },
          "type": "resource",
        },
      ]
    `);
  });

  it("should continue with submission even if resource fetch fails (graceful fallback)", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
    const mockGetResource = jest
      .fn()
      .mockRejectedValue(new Error("Resource fetch failed"));

    const mockListResources = jest.fn().mockResolvedValue([]);

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper({
        listResources: mockListResources,
        getResource: mockGetResource,
      }),
    });

    act(() => {
      result.current.setValue("Check @registry:file:///missing.txt");
    });

    // Should not throw, should continue with submission
    await act(async () => {
      await result.current.submit();
    });

    // Resource fetch was attempted
    expect(mockGetResource).toHaveBeenCalledWith("file:///missing.txt");

    // Warning should be logged
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to fetch resource content for registry:file:///missing.txt:",
      expect.any(Error),
    );

    // Message should still be sent (without the resolved content)
    expect(mockSendThreadMessage).toHaveBeenCalledTimes(1);
    const [, options] = mockSendThreadMessage.mock.calls[0];
    const content =
      options.content as TamboAI.Beta.Threads.ChatCompletionContentPart[];

    // Resource should be present but without text/blob content
    expect(content).toMatchInlineSnapshot(`
      [
        {
          "text": "Check ",
          "type": "text",
        },
        {
          "resource": {
            "uri": "file:///missing.txt",
          },
          "type": "resource",
        },
      ]
    `);

    consoleSpy.mockRestore();
  });

  it("should NOT resolve internal server resources (serverType: TAMBO_INTERNAL)", async () => {
    // Add internal server to mock servers
    mockServers = [createMockInternalServer("tambo-abc123")];

    const mockGetResource = jest.fn().mockResolvedValue({
      contents: [{ uri: "tambo:test://resource/1", text: "Should not fetch" }],
    });

    const mockListResources = jest.fn().mockResolvedValue([]);

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper({
        listResources: mockListResources,
        getResource: mockGetResource,
      }),
    });

    act(() => {
      result.current.setValue(
        "Check @tambo-abc123:tambo:test://internal/resource/1",
      );
    });

    await act(async () => {
      await result.current.submit();
    });

    // getResource should NOT be called for internal server resources
    expect(mockGetResource).not.toHaveBeenCalled();

    // Message should still be sent with resource (but without resolved content)
    expect(mockSendThreadMessage).toHaveBeenCalledTimes(1);
    const [, options] = mockSendThreadMessage.mock.calls[0];
    const content =
      options.content as TamboAI.Beta.Threads.ChatCompletionContentPart[];

    expect(content).toMatchInlineSnapshot(`
      [
        {
          "text": "Check ",
          "type": "text",
        },
        {
          "resource": {
            "uri": "tambo:test://internal/resource/1",
          },
          "type": "resource",
        },
      ]
    `);
  });

  it("should handle mixed registry and internal server resources", async () => {
    // Add internal server
    mockServers = [createMockInternalServer("tambo-xyz")];

    const mockGetResource = jest.fn().mockResolvedValue({
      contents: [{ uri: "file:///registry-doc.txt", text: "Registry content" }],
    });

    const mockListResources = jest.fn().mockResolvedValue([]);

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper({
        listResources: mockListResources,
        getResource: mockGetResource,
      }),
    });

    act(() => {
      result.current.setValue(
        "@registry:file:///registry-doc.txt and @tambo-xyz:tambo:test://internal",
      );
    });

    await act(async () => {
      await result.current.submit();
    });

    // Only the registry resource should be fetched
    expect(mockGetResource).toHaveBeenCalledTimes(1);
    expect(mockGetResource).toHaveBeenCalledWith("file:///registry-doc.txt");

    const [, options] = mockSendThreadMessage.mock.calls[0];
    const content =
      options.content as TamboAI.Beta.Threads.ChatCompletionContentPart[];

    expect(content).toMatchInlineSnapshot(`
      [
        {
          "resource": {
            "text": "Registry content",
            "uri": "file:///registry-doc.txt",
          },
          "type": "resource",
        },
        {
          "text": " and ",
          "type": "text",
        },
        {
          "resource": {
            "uri": "tambo:test://internal",
          },
          "type": "resource",
        },
      ]
    `);
  });

  it("should include resource names when provided in submit options", async () => {
    const mockGetResource = jest.fn().mockResolvedValue({
      contents: [
        {
          uri: "file:///doc.txt",
          text: "Document content",
        },
      ],
    });

    const mockListResources = jest.fn().mockResolvedValue([]);

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper({
        listResources: mockListResources,
        getResource: mockGetResource,
      }),
    });

    act(() => {
      result.current.setValue("Check @registry:file:///doc.txt");
    });

    await act(async () => {
      await result.current.submit({
        resourceNames: {
          "registry:file:///doc.txt": "Important Document.txt",
        },
      });
    });

    const [, options] = mockSendThreadMessage.mock.calls[0];
    const content =
      options.content as TamboAI.Beta.Threads.ChatCompletionContentPart[];

    expect(content).toMatchInlineSnapshot(`
      [
        {
          "text": "Check ",
          "type": "text",
        },
        {
          "resource": {
            "name": "Important Document.txt",
            "text": "Document content",
            "uri": "file:///doc.txt",
          },
          "type": "resource",
        },
      ]
    `);
  });

  it("should handle message without any resource references", async () => {
    const mockGetResource = jest.fn();
    const mockListResources = jest.fn().mockResolvedValue([]);

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper({
        listResources: mockListResources,
        getResource: mockGetResource,
      }),
    });

    act(() => {
      result.current.setValue("Just a regular message without resources");
    });

    await act(async () => {
      await result.current.submit();
    });

    // No resource fetch should happen
    expect(mockGetResource).not.toHaveBeenCalled();

    // Message should be sent as plain text
    const [, options] = mockSendThreadMessage.mock.calls[0];
    const content =
      options.content as TamboAI.Beta.Threads.ChatCompletionContentPart[];

    expect(content).toMatchInlineSnapshot(`
      [
        {
          "text": "Just a regular message without resources",
          "type": "text",
        },
      ]
    `);
  });

  it("should handle null returned from getResource", async () => {
    const mockGetResource = jest.fn().mockResolvedValue(null);
    const mockListResources = jest.fn().mockResolvedValue([]);

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper({
        listResources: mockListResources,
        getResource: mockGetResource,
      }),
    });

    act(() => {
      result.current.setValue("Check @registry:file:///unknown.txt");
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(mockGetResource).toHaveBeenCalled();

    const [, options] = mockSendThreadMessage.mock.calls[0];
    const content =
      options.content as TamboAI.Beta.Threads.ChatCompletionContentPart[];

    // Resource should be present but without content
    expect(content).toMatchInlineSnapshot(`
      [
        {
          "text": "Check ",
          "type": "text",
        },
        {
          "resource": {
            "uri": "file:///unknown.txt",
          },
          "type": "resource",
        },
      ]
    `);
  });

  it("should warn when no resourceSource is available for registry resource", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    // No listResources/getResource provided
    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setValue("Check @registry:file:///doc.txt");
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "No resource source available to resolve registry resource: registry:file:///doc.txt",
    );

    consoleSpy.mockRestore();
  });

  it("should resolve static resources passed via resources prop", async () => {
    // When using static resources, we need both listResources and getResource
    // to form the resourceSource, even though the resources are static
    const mockGetResource = jest.fn().mockResolvedValue({
      contents: [
        {
          uri: "static://my-static-resource",
          text: "Static resource content",
          mimeType: "text/plain",
        },
      ],
    });

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper({
        resources: [
          {
            uri: "static://my-static-resource",
            name: "My Static Resource",
            mimeType: "text/plain",
          },
        ],
        // Need getResource to actually fetch the content
        getResource: mockGetResource,
        listResources: async () => [],
      }),
    });

    act(() => {
      result.current.setValue(
        "Show me @registry:static://my-static-resource please",
      );
    });

    await act(async () => {
      await result.current.submit();
    });

    // getResource should be called to fetch the content
    expect(mockGetResource).toHaveBeenCalledWith("static://my-static-resource");

    const [, options] = mockSendThreadMessage.mock.calls[0];
    const content =
      options.content as TamboAI.Beta.Threads.ChatCompletionContentPart[];

    expect(content).toMatchInlineSnapshot(`
      [
        {
          "text": "Show me ",
          "type": "text",
        },
        {
          "resource": {
            "mimeType": "text/plain",
            "text": "Static resource content",
            "uri": "static://my-static-resource",
          },
          "type": "resource",
        },
        {
          "text": " please",
          "type": "text",
        },
      ]
    `);
  });
});
