import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import type TamboAI from "@tambo-ai/typescript-sdk";
import { REGISTRY_SERVER_KEY, ServerType } from "../../mcp/mcp-constants";
import type { ActiveMcpServer } from "../../mcp/mcp-server-context";
import type { ResourceSource } from "../../model/resource-info";
import { TamboRegistryProvider } from "../tambo-registry-provider";
import {
  TamboThreadInputProvider,
  useTamboThreadInput,
} from "../tambo-thread-input-provider";

// Mock the thread provider
const mockSendThreadMessage = jest.fn();
jest.mock("../tambo-thread-provider", () => ({
  useTamboThread: () => ({
    thread: { id: "test-thread-id" },
    sendThreadMessage: mockSendThreadMessage,
  }),
}));

// Mock servers array - will be updated per test
let mockServers: ActiveMcpServer[] = [];

// Mock the MCP server context
jest.mock("../../mcp/mcp-server-context", () => ({
  useTamboMcpServers: () => mockServers,
}));

// Helper to create virtual registry server
const createMockRegistryServer = (): ActiveMcpServer => ({
  key: REGISTRY_SERVER_KEY,
  serverKey: REGISTRY_SERVER_KEY,
  url: "",
  name: "Registry",
  status: "connected",
  serverType: ServerType.TAMBO_REGISTRY,
  client: null,
});

// Helper to create internal server
const createMockInternalServer = (serverKey: string): ActiveMcpServer => ({
  key: serverKey,
  serverKey,
  url: "https://api.tambo.ai/mcp",
  name: "__tambo_internal_mcp_server__",
  status: "connected",
  serverType: ServerType.TAMBO_INTERNAL,
  client: null,
});

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

describe("TamboThreadInputProvider - Resource Content Resolution Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendThreadMessage.mockResolvedValue(undefined);
    // Default: include registry server
    mockServers = [createMockRegistryServer()];
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

  const createWrapper = (
    resourceSource?: ResourceSource,
    resources?: { uri: string; name: string; mimeType?: string }[],
  ) => {
    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TamboRegistryProvider
            listResources={resourceSource?.listResources}
            getResource={resourceSource?.getResource}
            resources={resources}
          >
            <TamboThreadInputProvider>{children}</TamboThreadInputProvider>
          </TamboRegistryProvider>
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

    const resourceSource: ResourceSource = {
      listResources: jest.fn().mockResolvedValue([
        {
          uri: "file:///my-document.txt",
          name: "My Document",
          mimeType: "text/plain",
        },
      ]),
      getResource: mockGetResource,
    };

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper(resourceSource),
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
    expect(content).toHaveLength(3);
    expect(content[0]).toEqual({
      type: "text",
      text: "Show me the contents of ",
    });
    expect(content[1]).toEqual({
      type: "resource",
      resource: {
        uri: "file:///my-document.txt",
        text: "This is the document content from the registry",
        mimeType: "text/plain",
      },
    });
    expect(content[2]).toEqual({
      type: "text",
      text: " in a table",
    });
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

    const resourceSource: ResourceSource = {
      listResources: jest.fn().mockResolvedValue([]),
      getResource: mockGetResource,
    };

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper(resourceSource),
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

    // Should have: text "Compare ", resource1, text " with ", resource2
    expect(content).toHaveLength(4);
    expect(content[0]).toEqual({ type: "text", text: "Compare " });
    expect(content[1]).toEqual({
      type: "resource",
      resource: { uri: "file:///doc1.txt", text: "Content of doc1" },
    });
    expect(content[2]).toEqual({ type: "text", text: " with " });
    expect(content[3]).toEqual({
      type: "resource",
      resource: { uri: "file:///doc2.txt", text: "Content of doc2" },
    });
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

    const resourceSource: ResourceSource = {
      listResources: jest.fn().mockResolvedValue([]),
      getResource: mockGetResource,
    };

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper(resourceSource),
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

    expect(content[1]).toEqual({
      type: "resource",
      resource: {
        uri: "file:///image.png",
        blob: "base64encodedimagedata",
        mimeType: "image/png",
      },
    });
  });

  it("should continue with submission even if resource fetch fails (graceful fallback)", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
    const mockGetResource = jest
      .fn()
      .mockRejectedValue(new Error("Resource fetch failed"));

    const resourceSource: ResourceSource = {
      listResources: jest.fn().mockResolvedValue([]),
      getResource: mockGetResource,
    };

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper(resourceSource),
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
    expect(content[1]).toEqual({
      type: "resource",
      resource: { uri: "file:///missing.txt" },
    });

    consoleSpy.mockRestore();
  });

  it("should NOT resolve internal server resources (serverType: TAMBO_INTERNAL)", async () => {
    // Add internal server to mock servers
    mockServers = [
      createMockRegistryServer(),
      createMockInternalServer("tambo-abc123"),
    ];

    const mockGetResource = jest.fn().mockResolvedValue({
      contents: [{ uri: "tambo:test://resource/1", text: "Should not fetch" }],
    });

    const resourceSource: ResourceSource = {
      listResources: jest.fn().mockResolvedValue([]),
      getResource: mockGetResource,
    };

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper(resourceSource),
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

    expect(content[1]).toEqual({
      type: "resource",
      resource: { uri: "tambo:test://internal/resource/1" },
    });
  });

  it("should handle mixed registry and internal server resources", async () => {
    // Add both registry and internal server
    mockServers = [
      createMockRegistryServer(),
      createMockInternalServer("tambo-xyz"),
    ];

    const mockGetResource = jest.fn().mockResolvedValue({
      contents: [{ uri: "file:///registry-doc.txt", text: "Registry content" }],
    });

    const resourceSource: ResourceSource = {
      listResources: jest.fn().mockResolvedValue([]),
      getResource: mockGetResource,
    };

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper(resourceSource),
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

    // Registry resource should have resolved content
    expect(content[0]).toEqual({
      type: "resource",
      resource: { uri: "file:///registry-doc.txt", text: "Registry content" },
    });

    // Internal server resource should NOT have resolved content
    expect(content[2]).toEqual({
      type: "resource",
      resource: { uri: "tambo:test://internal" },
    });
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

    const resourceSource: ResourceSource = {
      listResources: jest.fn().mockResolvedValue([]),
      getResource: mockGetResource,
    };

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper(resourceSource),
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

    expect(content[1]).toEqual({
      type: "resource",
      resource: {
        uri: "file:///doc.txt",
        name: "Important Document.txt",
        text: "Document content",
      },
    });
  });

  it("should handle message without any resource references", async () => {
    const mockGetResource = jest.fn();

    const resourceSource: ResourceSource = {
      listResources: jest.fn().mockResolvedValue([]),
      getResource: mockGetResource,
    };

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper(resourceSource),
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

    expect(content).toEqual([
      {
        type: "text",
        text: "Just a regular message without resources",
      },
    ]);
  });

  it("should handle null returned from getResource", async () => {
    const mockGetResource = jest.fn().mockResolvedValue(null);

    const resourceSource: ResourceSource = {
      listResources: jest.fn().mockResolvedValue([]),
      getResource: mockGetResource,
    };

    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper(resourceSource),
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
    expect(content[1]).toEqual({
      type: "resource",
      resource: { uri: "file:///unknown.txt" },
    });
  });

  it("should warn when no resourceSource is available for registry resource", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    // No resourceSource provided
    const { result } = renderHook(() => useTamboThreadInput(), {
      wrapper: createWrapper(undefined),
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
});
