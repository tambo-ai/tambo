import TamboAI, { advanceStream } from "@tambo-ai/typescript-sdk";
import { QueryClient } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { z } from "zod/v4";
import { TamboComponent } from "../model/component-metadata";
import {
  GenerationStage,
  TamboThreadMessage,
} from "../model/generate-component-response";
import { serializeRegistry } from "../testing/tools";
import {
  TamboClientContext,
  useTamboClient,
  useTamboQueryClient,
} from "./tambo-client-provider";
import { TamboContextHelpersProvider } from "./tambo-context-helpers-provider";
import { TamboMcpTokenProvider } from "./tambo-mcp-token-provider";
import { TamboRegistryProvider } from "./tambo-registry-provider";
import { TamboThreadProvider, useTamboThread } from "./tambo-thread-provider";

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: jest.fn().mockReturnValue("test-uuid"),
  },
});

// Mock the required providers
jest.mock("./tambo-client-provider", () => {
  return {
    useTamboClient: jest.fn(),
    useTamboQueryClient: jest.fn(),
    TamboClientContext: React.createContext(undefined),
  };
});
jest.mock("@tambo-ai/typescript-sdk", () => {
  const actual = jest.requireActual<typeof import("@tambo-ai/typescript-sdk")>(
    "@tambo-ai/typescript-sdk",
  );

  return {
    __esModule: true,
    ...actual,
    advanceStream: jest.fn(),
  };
});

// Mock the getCustomContext
jest.mock("../util/registry", () => ({
  ...jest.requireActual("../util/registry"),
  getCustomContext: () => ({
    message: "additional instructions",
  }),
}));

// Test utilities
const createMockMessage = (
  overrides: Partial<TamboThreadMessage> = {},
): TamboThreadMessage => ({
  id: "test-message-1",
  content: [{ type: "text", text: "Hello" }],
  role: "user",
  threadId: "test-thread-1",
  createdAt: new Date().toISOString(),
  componentState: {},
  ...overrides,
});

const createMockThread = (
  overrides: Partial<TamboAI.Beta.Threads.ThreadRetrieveResponse> = {},
): TamboAI.Beta.Threads.ThreadRetrieveResponse => ({
  id: "test-thread-1",
  messages: [],
  createdAt: "2024-01-01T00:00:00Z",
  projectId: "test-project",
  updatedAt: "2024-01-01T00:00:00Z",
  metadata: {},
  ...overrides,
});

const createMockAdvanceResponse = (
  overrides: Partial<TamboAI.Beta.Threads.ThreadAdvanceResponse> = {},
): TamboAI.Beta.Threads.ThreadAdvanceResponse => ({
  responseMessageDto: {
    id: "test-uuid",
    content: [{ type: "text" as const, text: "Default response" }],
    role: "assistant",
    threadId: "test-thread-1",
    component: undefined,
    componentState: {},
    createdAt: new Date().toISOString(),
  },
  generationStage: GenerationStage.COMPLETE,
  mcpAccessToken: "test-mcp-access-token",
  ...overrides,
});

describe("TamboThreadProvider", () => {
  const mockThread = createMockThread();

  let mockTamboAI: TamboAI;
  let mockThreadsApi: TamboAI.Beta.Threads;
  let mockProjectsApi: TamboAI.Beta.Projects;

  let mockQueryClient: {
    invalidateQueries: jest.Mock;
    setQueryData: jest.Mock;
  };

  const mockRegistry: TamboComponent[] = [
    {
      name: "TestOnly",
      component: () => <div>TestOnly</div>,
      description: "TestOnly",
      propsSchema: z.object({
        test: z.string(),
      }),
      associatedTools: [
        {
          name: "test-tool",
          tool: jest.fn().mockResolvedValue("test-tool"),
          description: "test-tool",
          inputSchema: z.object({
            param: z.string().describe("test-param-description"),
          }),
          outputSchema: z.string(),
        },
      ],
    },
  ];

  /**
   * Creates a test wrapper component with configurable options.
   * Reduces duplication across tests by centralizing provider setup.
   * @param options - Configuration options for the wrapper
   * @param options.components - The Tambo components to register
   * @param options.streaming - Whether to enable streaming responses
   * @param options.onCallUnregisteredTool - Handler for unregistered tool calls
   * @param options.autoGenerateThreadName - Whether to auto-generate thread names
   * @param options.autoGenerateNameThreshold - Token threshold for auto-generating names
   * @returns A React component that wraps children with the necessary providers
   */
  const createWrapper = ({
    components = mockRegistry,
    streaming = false,
    onCallUnregisteredTool,
    autoGenerateThreadName,
    autoGenerateNameThreshold,
  }: {
    components?: TamboComponent[];
    streaming?: boolean;
    onCallUnregisteredTool?: (
      toolName: string,
      parameters: TamboAI.ToolCallRequest["parameters"],
    ) => Promise<string>;
    autoGenerateThreadName?: boolean;
    autoGenerateNameThreshold?: number;
  } = {}) =>
    function TestWrapper({ children }: { children: React.ReactNode }) {
      const client = useTamboClient();
      const queryClient = useTamboQueryClient();

      return (
        <TamboClientContext.Provider
          value={{
            client,
            queryClient,
            isUpdatingToken: false,
          }}
        >
          <TamboRegistryProvider
            components={components}
            onCallUnregisteredTool={onCallUnregisteredTool}
          >
            <TamboContextHelpersProvider
              contextHelpers={{
                currentTimeContextHelper: () => null,
                currentPageContextHelper: () => null,
              }}
            >
              <TamboMcpTokenProvider>
                <TamboThreadProvider
                  streaming={streaming}
                  autoGenerateThreadName={autoGenerateThreadName}
                  autoGenerateNameThreshold={autoGenerateNameThreshold}
                >
                  {children}
                </TamboThreadProvider>
              </TamboMcpTokenProvider>
            </TamboContextHelpersProvider>
          </TamboRegistryProvider>
        </TamboClientContext.Provider>
      );
    };

  // Default wrapper for most tests
  const Wrapper = createWrapper();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockTamboAI = new TamboAI({
      apiKey: "",
      fetch: () => {
        throw new Error("Unexpected network call in test");
      },
    });

    mockThreadsApi = mockTamboAI.beta.threads;
    mockProjectsApi = mockTamboAI.beta.projects;

    // Setup mock query client
    mockQueryClient = {
      invalidateQueries: jest.fn().mockResolvedValue(undefined),
      setQueryData: jest.fn(),
    };
    jest
      .mocked(useTamboQueryClient)
      .mockReturnValue(mockQueryClient as unknown as QueryClient);

    jest.spyOn(mockThreadsApi, "retrieve").mockResolvedValue(mockThread);
    jest
      .spyOn(mockThreadsApi.messages, "create")
      .mockResolvedValue(createMockMessage());
    jest
      .spyOn(mockThreadsApi, "advance")
      .mockResolvedValue(createMockAdvanceResponse());
    jest
      .spyOn(mockThreadsApi, "advanceByID")
      .mockResolvedValue(createMockAdvanceResponse());
    jest.spyOn(mockThreadsApi, "generateName").mockResolvedValue({
      ...mockThread,
      name: "Generated Thread Name",
    });
    jest.spyOn(mockThreadsApi, "update").mockResolvedValue({} as any);
    jest.spyOn(mockProjectsApi, "getCurrent").mockResolvedValue({
      id: "test-project-id",
      name: "Test Project",
      isTokenRequired: false,
      providerType: "llm",
      userId: "test-user-id",
    });
    jest.mocked(useTamboClient).mockReturnValue(mockTamboAI);
  });

  it("should initialize with placeholder thread", () => {
    const { result } = renderHook(() => useTamboThread(), { wrapper: Wrapper });

    expect(result.current.thread.id).toBe("placeholder");
    expect(result.current.isIdle).toBe(true);
    expect(result.current.generationStage).toBe(GenerationStage.IDLE);
  });

  it("should switch to a new thread", async () => {
    const { result } = renderHook(() => useTamboThread(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.switchCurrentThread("test-thread-1");
    });

    expect(mockThreadsApi.retrieve).toHaveBeenCalledWith("test-thread-1");
    expect(result.current.thread.id).toBe("test-thread-1");
  });

  it("should start a new thread", async () => {
    const { result } = renderHook(() => useTamboThread(), { wrapper: Wrapper });

    await act(async () => {
      result.current.startNewThread();
    });

    expect(result.current.thread.id).toBe("placeholder");
    expect(result.current.isIdle).toBe(true);
  });

  it("should add a message to the thread", async () => {
    const { result } = renderHook(() => useTamboThread(), { wrapper: Wrapper });
    const testMessage: TamboThreadMessage = {
      id: "test-message-1",
      content: [{ type: "text", text: "Hello" }],
      role: "user",
      threadId: "test-thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
    };

    await act(async () => {
      await result.current.addThreadMessage(testMessage, true);
    });

    expect(mockThreadsApi.messages.create).toHaveBeenCalledWith(
      "test-thread-1",
      {
        content: testMessage.content,
        role: testMessage.role,
      },
    );
  });

  it("should update a message in the thread", async () => {
    const { result } = renderHook(() => useTamboThread(), { wrapper: Wrapper });
    const testMessage: TamboThreadMessage = {
      id: "test-message-1",
      content: [{ type: "text", text: "Updated message" }],
      role: "user",
      threadId: "test-thread-1",
      createdAt: new Date().toISOString(),
      componentState: {},
    };

    await act(async () => {
      await result.current.updateThreadMessage(
        "test-message-1",
        testMessage,
        true,
      );
    });

    expect(mockThreadsApi.messages.create).toHaveBeenCalledWith(
      "test-thread-1",
      {
        content: testMessage.content,
        role: testMessage.role,
      },
    );
  });

  it("should send a message and update thread state", async () => {
    const mockStreamResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
      responseMessageDto: {
        id: "response-1",
        content: [{ type: "text", text: "Response" }],
        role: "assistant",
        threadId: "test-thread-1",
        component: undefined,
        componentState: {},
        createdAt: new Date().toISOString(),
      },
      generationStage: GenerationStage.COMPLETE,
      mcpAccessToken: "test-mcp-access-token",
    };

    const mockAsyncIterator = {
      [Symbol.asyncIterator]: async function* () {
        yield mockStreamResponse;
      },
    };

    jest.mocked(advanceStream).mockResolvedValue(mockAsyncIterator);

    const { result } = renderHook(() => useTamboThread(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.sendThreadMessage("Hello", {
        threadId: "test-thread-1",
        streamResponse: true,
        additionalContext: {
          custom: {
            message: "additional instructions",
          },
        },
      });
    });

    expect(advanceStream).toHaveBeenCalledWith(
      expect.anything(),
      {
        messageToAppend: {
          content: [{ type: "text", text: "Hello" }],
          role: "user",
          additionalContext: {
            custom: {
              message: "additional instructions",
            },
          },
        },
        availableComponents: serializeRegistry(mockRegistry),
        contextKey: undefined,
        clientTools: [],
        toolCallCounts: {},
      },
      "test-thread-1",
    );
    expect(result.current.generationStage).toBe(GenerationStage.COMPLETE);
  });

  it("should handle streaming responses", async () => {
    const mockStreamResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
      responseMessageDto: {
        id: "stream-1",
        content: [{ type: "text", text: "Streaming response" }],
        role: "assistant",
        threadId: "test-thread-1",
        component: undefined,
        componentState: {},
        createdAt: new Date().toISOString(),
      },
      generationStage: GenerationStage.COMPLETE,
      mcpAccessToken: "test-mcp-access-token",
    };

    // Create an async iterator mock
    const mockAsyncIterator = {
      [Symbol.asyncIterator]: async function* () {
        yield mockStreamResponse;
      },
    };

    // Mock advanceStream to return our async iterator
    jest.mocked(advanceStream).mockResolvedValue(mockAsyncIterator);

    const { result } = renderHook(() => useTamboThread(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.sendThreadMessage("Hello", {
        threadId: "test-thread-1",
        streamResponse: true,
      });
    });

    expect(result.current.generationStage).toBe(GenerationStage.COMPLETE);
  });

  it("should handle tool calls during message processing.", async () => {
    const mockToolCallChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
      responseMessageDto: {
        id: "tool-call-1",
        content: [{ type: "text", text: "Tool response" }],
        role: "tool",
        threadId: "test-thread-1",
        toolCallRequest: {
          toolName: "test-tool",
          parameters: [{ parameterName: "test", parameterValue: "test" }],
        },
        componentState: {},
        createdAt: new Date().toISOString(),
      },
      generationStage: GenerationStage.COMPLETE,
      mcpAccessToken: "test-mcp-access-token",
    };

    const mockFinalChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
      responseMessageDto: {
        id: "advance-response2",
        content: [{ type: "text", text: "response 2" }],
        role: "user",
        threadId: "test-thread-1",
        componentState: {},
        createdAt: new Date().toISOString(),
      },
      generationStage: GenerationStage.COMPLETE,
      mcpAccessToken: "test-mcp-access-token",
    };

    const mockAsyncIterator = {
      [Symbol.asyncIterator]: async function* () {
        yield mockToolCallChunk;
      },
    };

    const mockAsyncIterator2 = {
      [Symbol.asyncIterator]: async function* () {
        yield mockFinalChunk;
      },
    };

    jest
      .mocked(advanceStream)
      .mockResolvedValueOnce(mockAsyncIterator)
      .mockResolvedValueOnce(mockAsyncIterator2);

    const { result } = renderHook(() => useTamboThread(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.sendThreadMessage("Use tool", {
        threadId: "test-thread-1",
        streamResponse: true,
      });
    });
    expect(result.current.generationStage).toBe(GenerationStage.COMPLETE);
    // New inputSchema interface: tool receives single object arg
    expect(mockRegistry[0]?.associatedTools?.[0]?.tool).toHaveBeenCalledWith({
      test: "test",
    });
  });

  it("should handle unregistered tool calls with onCallUnregisteredTool", async () => {
    const mockOnCallUnregisteredTool = jest
      .fn()
      .mockResolvedValue("unregistered-tool-result");

    const mockUnregisteredToolCallChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse =
      {
        responseMessageDto: {
          id: "unregistered-tool-call-1",
          content: [{ type: "text", text: "Unregistered tool response" }],
          role: "tool",
          threadId: "test-thread-1",
          toolCallRequest: {
            toolName: "unregistered-tool",
            parameters: [
              { parameterName: "input", parameterValue: "test-input" },
            ],
          },
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

    const mockFinalChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
      responseMessageDto: {
        id: "advance-response2",
        content: [{ type: "text", text: "response 2" }],
        role: "user",
        threadId: "test-thread-1",
        componentState: {},
        createdAt: new Date().toISOString(),
      },
      generationStage: GenerationStage.COMPLETE,
      mcpAccessToken: "test-mcp-access-token",
    };

    const mockAsyncIterator = {
      [Symbol.asyncIterator]: async function* () {
        yield mockUnregisteredToolCallChunk;
      },
    };

    const mockAsyncIterator2 = {
      [Symbol.asyncIterator]: async function* () {
        yield mockFinalChunk;
      },
    };

    jest
      .mocked(advanceStream)
      .mockResolvedValueOnce(mockAsyncIterator)
      .mockResolvedValueOnce(mockAsyncIterator2);

    const { result } = renderHook(() => useTamboThread(), {
      wrapper: createWrapper({
        onCallUnregisteredTool: mockOnCallUnregisteredTool,
      }),
    });

    await act(async () => {
      await result.current.sendThreadMessage("Use unregistered tool", {
        threadId: "test-thread-1",
        streamResponse: true,
      });
    });

    expect(result.current.generationStage).toBe(GenerationStage.COMPLETE);
    expect(mockOnCallUnregisteredTool).toHaveBeenCalledWith(
      "unregistered-tool",
      [{ parameterName: "input", parameterValue: "test-input" }],
    );
  });

  it("should handle unregistered tool calls without onCallUnregisteredTool", async () => {
    const mockUnregisteredToolCallChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse =
      {
        responseMessageDto: {
          id: "unregistered-tool-call-1",
          content: [{ type: "text", text: "Unregistered tool response" }],
          role: "tool",
          threadId: "test-thread-1",
          toolCallRequest: {
            toolName: "unregistered-tool",
            parameters: [
              { parameterName: "input", parameterValue: "test-input" },
            ],
          },
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

    const mockFinalChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
      responseMessageDto: {
        id: "advance-response2",
        content: [{ type: "text", text: "response 2" }],
        role: "user",
        threadId: "test-thread-1",
        componentState: {},
        createdAt: new Date().toISOString(),
      },
      generationStage: GenerationStage.COMPLETE,
      mcpAccessToken: "test-mcp-access-token",
    };

    const mockAsyncIterator = {
      [Symbol.asyncIterator]: async function* () {
        yield mockUnregisteredToolCallChunk;
      },
    };

    const mockAsyncIterator2 = {
      [Symbol.asyncIterator]: async function* () {
        yield mockFinalChunk;
      },
    };

    jest
      .mocked(advanceStream)
      .mockResolvedValueOnce(mockAsyncIterator)
      .mockResolvedValueOnce(mockAsyncIterator2);

    const { result } = renderHook(() => useTamboThread(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.sendThreadMessage("Use unregistered tool", {
        threadId: "test-thread-1",
        streamResponse: true,
      });
    });

    expect(result.current.generationStage).toBe(GenerationStage.COMPLETE);
    // Should not throw an error, but the tool call should fail gracefully
  });

  describe("streaming behavior", () => {
    it("should call advanceStream when streamResponse=true", async () => {
      const mockStreamResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "stream-response",
          content: [{ type: "text", text: "Streaming response" }],
          role: "assistant",
          threadId: "test-thread-1",
          component: undefined,
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield mockStreamResponse;
        },
      };

      jest.mocked(advanceStream).mockResolvedValue(mockAsyncIterator);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({ streaming: true }),
      });

      await act(async () => {
        await result.current.sendThreadMessage("Hello streaming", {
          threadId: "test-thread-1",
          streamResponse: true,
          additionalContext: {
            custom: {
              message: "additional instructions",
            },
          },
        });
      });

      expect(advanceStream).toHaveBeenCalledWith(
        mockTamboAI,
        {
          messageToAppend: {
            content: [{ type: "text", text: "Hello streaming" }],
            role: "user",
            additionalContext: {
              custom: {
                message: "additional instructions",
              },
            },
          },
          availableComponents: serializeRegistry(mockRegistry),
          contextKey: undefined,
          clientTools: [],
          forceToolChoice: undefined,
          toolCallCounts: {},
        },
        "test-thread-1",
      );

      // Should not call advance or advanceById
      expect(mockThreadsApi.advance).not.toHaveBeenCalled();
      expect(mockThreadsApi.advanceByID).not.toHaveBeenCalled();
    });

    it("should throw error when streamResponse=false (non-streaming not supported)", async () => {
      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({ streaming: true }),
      });

      await act(async () => {
        await expect(
          result.current.sendThreadMessage("Hello non-streaming", {
            threadId: "test-thread-1",
            streamResponse: false,
          }),
        ).rejects.toThrow();
      });
    });

    it("should call advanceStream when streamResponse is undefined and provider streaming=true (default)", async () => {
      const mockStreamResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "stream-response",
          content: [{ type: "text", text: "Streaming response" }],
          role: "assistant",
          threadId: "test-thread-1",
          component: undefined,
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield mockStreamResponse;
        },
      };

      jest.mocked(advanceStream).mockResolvedValue(mockAsyncIterator);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({ streaming: true }),
      });

      await act(async () => {
        await result.current.sendThreadMessage("Hello default streaming", {
          threadId: "test-thread-1",
          // streamResponse is undefined, should use provider's streaming=true (default)
          additionalContext: {
            custom: {
              message: "additional instructions",
            },
          },
        });
      });

      expect(advanceStream).toHaveBeenCalledWith(
        mockTamboAI,
        {
          messageToAppend: {
            content: [{ type: "text", text: "Hello default streaming" }],
            role: "user",
            additionalContext: {
              custom: {
                message: "additional instructions",
              },
            },
          },
          availableComponents: serializeRegistry(mockRegistry),
          contextKey: undefined,
          clientTools: [],
          forceToolChoice: undefined,
          toolCallCounts: {},
        },
        "test-thread-1",
      );

      // Should not call advance or advanceById
      expect(mockThreadsApi.advance).not.toHaveBeenCalled();
      expect(mockThreadsApi.advanceByID).not.toHaveBeenCalled();
    });

    it("should call advanceStream when streamResponse=true for placeholder thread", async () => {
      const mockStreamResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "stream-response",
          content: [{ type: "text", text: "Streaming response" }],
          role: "assistant",
          threadId: "new-thread-1",
          component: undefined,
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield mockStreamResponse;
        },
      };

      jest.mocked(advanceStream).mockResolvedValue(mockAsyncIterator);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({ streaming: false }),
      });

      // Start with placeholder thread (which is the default state)
      expect(result.current.thread.id).toBe("placeholder");

      await act(async () => {
        await result.current.sendThreadMessage("Hello streaming new thread", {
          threadId: "placeholder",
          streamResponse: true,
          additionalContext: {
            custom: {
              message: "additional instructions",
            },
          },
        });
      });

      expect(advanceStream).toHaveBeenCalledWith(
        mockTamboAI,
        {
          messageToAppend: {
            content: [{ type: "text", text: "Hello streaming new thread" }],
            role: "user",
            additionalContext: {
              custom: {
                message: "additional instructions",
              },
            },
          },
          availableComponents: serializeRegistry(mockRegistry),
          contextKey: undefined,
          clientTools: [],
          forceToolChoice: undefined,
          toolCallCounts: {},
        },
        undefined, // threadId is undefined for placeholder thread
      );

      // Should not call advance or advanceById
      expect(mockThreadsApi.advance).not.toHaveBeenCalled();
      expect(mockThreadsApi.advanceByID).not.toHaveBeenCalled();
    });

    it("should handle multiple sequential messages during streaming (server tool scenario)", async () => {
      // This test verifies the fix for the bug where the second message doesn't render
      // during server tool response streaming. The scenario:
      // 1. First message: "I will call the tool..." with statusMessage
      // 2. Second message: The tool result response streaming in

      // First message - tool announcement (server tools don't have componentName set during streaming)
      const mockFirstMessage: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "msg-first",
          content: [{ type: "text", text: "I will search the docs..." }],
          role: "assistant",
          threadId: "test-thread-1",
          component: {
            componentName: "",
            componentState: {},
            message: "",
            props: {},
            statusMessage: "searching the Tambo docs...",
          },
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.STREAMING_RESPONSE,
        mcpAccessToken: "test-mcp-access-token",
      };

      // Second message - tool result (different ID!)
      const mockSecondMessageChunk1: TamboAI.Beta.Threads.ThreadAdvanceResponse =
        {
          responseMessageDto: {
            id: "msg-second",
            content: [{ type: "text", text: "Here's what I found..." }],
            role: "assistant",
            threadId: "test-thread-1",
            componentState: {},
            createdAt: new Date().toISOString(),
          },
          generationStage: GenerationStage.STREAMING_RESPONSE,
          mcpAccessToken: "test-mcp-access-token",
        };

      const mockSecondMessageChunk2: TamboAI.Beta.Threads.ThreadAdvanceResponse =
        {
          responseMessageDto: {
            id: "msg-second",
            content: [
              {
                type: "text",
                text: "Here's what I found in the documentation about that topic.",
              },
            ],
            role: "assistant",
            threadId: "test-thread-1",
            componentState: {},
            createdAt: new Date().toISOString(),
          },
          generationStage: GenerationStage.COMPLETE,
          mcpAccessToken: "test-mcp-access-token",
        };

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield mockFirstMessage;
          yield mockSecondMessageChunk1;
          yield mockSecondMessageChunk2;
        },
      };

      jest.mocked(advanceStream).mockResolvedValue(mockAsyncIterator);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({ streaming: true }),
      });

      await act(async () => {
        await result.current.sendThreadMessage("Search the docs", {
          threadId: "test-thread-1",
          streamResponse: true,
        });
      });

      // Thread should have 3 messages: user message + 2 assistant messages
      expect(result.current.thread.messages).toHaveLength(3);

      // Filter to assistant messages only
      const assistantMessages = result.current.thread.messages.filter(
        (m) => m.role === "assistant",
      );
      expect(assistantMessages).toHaveLength(2);

      // First assistant message should have the tool status
      const firstMsg = result.current.thread.messages.find(
        (m) => m.id === "msg-first",
      );
      expect(firstMsg).toBeDefined();
      expect(firstMsg?.content[0]?.text).toContain("search the docs");

      // Second assistant message should have the final content
      const secondMsg = result.current.thread.messages.find(
        (m) => m.id === "msg-second",
      );
      expect(secondMsg).toBeDefined();
      expect(secondMsg?.content[0]?.text).toContain(
        "what I found in the documentation",
      );

      // Generation should be complete
      expect(result.current.generationStage).toBe(GenerationStage.COMPLETE);
    });
  });

  describe("error handling", () => {
    it("should set generation stage to ERROR when streaming sendThreadMessage fails", async () => {
      const testError = new Error("Streaming API call failed");

      // Mock advanceStream to throw an error
      jest.mocked(advanceStream).mockRejectedValue(testError);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: Wrapper,
      });

      // Expect the error to be thrown
      await act(async () => {
        await result.current.switchCurrentThread("test-thread-1");
        await expect(
          result.current.sendThreadMessage("Hello", {
            threadId: "test-thread-1",
            streamResponse: true,
          }),
        ).rejects.toThrow("Streaming API call failed");
      });

      // Verify generation stage is set to ERROR
      expect(result.current.generationStage).toBe(GenerationStage.ERROR);
    });

    it("should rollback optimistic user message when sendThreadMessage fails", async () => {
      const testError = new Error("API call failed");
      jest.mocked(advanceStream).mockRejectedValue(testError);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: Wrapper,
      });

      await act(async () => {
        await result.current.switchCurrentThread("test-thread-1");
      });

      const initialMessageCount = result.current.thread.messages.length;

      await act(async () => {
        await expect(
          result.current.sendThreadMessage("Hello", {
            threadId: "test-thread-1",
            streamResponse: true,
          }),
        ).rejects.toThrow("API call failed");
      });

      // Verify user message was rolled back
      expect(result.current.thread.messages.length).toBe(initialMessageCount);
    });

    it("should rollback optimistic message when addThreadMessage fails", async () => {
      const testError = new Error("Create message failed");
      jest.mocked(mockThreadsApi.messages.create).mockRejectedValue(testError);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: Wrapper,
      });

      await act(async () => {
        await result.current.switchCurrentThread("test-thread-1");
      });

      const initialMessageCount = result.current.thread.messages.length;
      const newMessage = createMockMessage({ threadId: "test-thread-1" });

      await act(async () => {
        await expect(
          result.current.addThreadMessage(newMessage, true),
        ).rejects.toThrow("Create message failed");
      });

      // Verify message was rolled back
      expect(result.current.thread.messages.length).toBe(initialMessageCount);
    });

    it("should rollback optimistic update when updateThreadMessage fails", async () => {
      const testError = new Error("Update message failed");
      jest.mocked(mockThreadsApi.messages.create).mockRejectedValue(testError);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: Wrapper,
      });

      await act(async () => {
        await result.current.switchCurrentThread("test-thread-1");
      });

      const existingMessage = createMockMessage({
        id: "existing-msg",
        threadId: "test-thread-1",
        content: [{ type: "text", text: "Old content" }],
      });

      await act(async () => {
        await result.current.addThreadMessage(existingMessage, false);
      });

      const initialMessageCount = result.current.thread.messages.length;

      await act(async () => {
        await expect(
          result.current.updateThreadMessage(
            "existing-msg",
            {
              threadId: "test-thread-1",
              content: [{ type: "text", text: "New content" }],
              role: "assistant",
            },
            true,
          ),
        ).rejects.toThrow("Update message failed");
      });

      // Verify message was rolled back
      expect(result.current.thread.messages.length).toBe(
        initialMessageCount - 1,
      );
    });

    it("should rollback optimistic name update when updateThreadName fails", async () => {
      const testError = new Error("Update name failed");
      jest.mocked(mockThreadsApi.update).mockRejectedValue(testError);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: Wrapper,
      });

      await act(async () => {
        await result.current.switchCurrentThread("test-thread-1");
      });

      const initialName = result.current.thread.name;

      await act(async () => {
        await expect(
          result.current.updateThreadName("New Name", "test-thread-1"),
        ).rejects.toThrow("Update name failed");
      });

      // Verify name was rolled back
      expect(result.current.thread.name).toBe(initialName);
    });
  });

  describe("refetch threads list behavior", () => {
    it("should refetch threads list when creating a new thread via sendThreadMessage", async () => {
      const { result } = renderHook(() => useTamboThread(), {
        wrapper: Wrapper,
      });

      // Mock the stream response to return a new thread ID
      const mockStreamResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "response-1",
          content: [{ type: "text", text: "Response" }],
          role: "assistant",
          threadId: "new-thread-123",
          component: undefined,
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield mockStreamResponse;
        },
      };

      jest.mocked(advanceStream).mockResolvedValue(mockAsyncIterator);

      // Start with placeholder thread
      expect(result.current.thread.id).toBe("placeholder");

      // Send a message which will create a new thread with contextKey
      await act(async () => {
        await result.current.sendThreadMessage("Hello", {
          threadId: "placeholder",
          streamResponse: true,
          contextKey: "test-context-key",
        });
      });

      // Verify that setQueryData was called first (optimistic update)
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ["threads", "test-project-id", "test-context-key"],
        expect.any(Function),
      );

      // Verify that refetchQueries was called when the new thread was created
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["threads"],
      });
    });

    it("should not refetch threads list when switching between existing threads", async () => {
      const { result } = renderHook(() => useTamboThread(), {
        wrapper: Wrapper,
      });

      // Start with placeholder thread
      expect(result.current.thread.id).toBe("placeholder");

      // Clear any previous mock calls
      jest.clearAllMocks();

      // Mock the retrieve call to return the expected thread
      const existingThread = createMockThread({ id: "existing-thread-123" });
      jest
        .mocked(mockThreadsApi.retrieve)
        .mockResolvedValueOnce(existingThread);

      // Switch to an existing thread (this should not trigger refetch)
      await act(async () => {
        await result.current.switchCurrentThread("existing-thread-123");
      });

      // Verify that the thread retrieval was called
      expect(mockThreadsApi.retrieve).toHaveBeenCalledWith(
        "existing-thread-123",
      );

      // Verify that neither setQueryData nor refetchQueries were called
      expect(mockQueryClient.setQueryData).not.toHaveBeenCalled();
      expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();

      // Verify the thread was switched correctly
      expect(result.current.thread.id).toBe("existing-thread-123");
    });
  });

  describe("transformToContent", () => {
    it("should use custom async transformToContent when provided (streaming)", async () => {
      const mockTransformToContent = jest
        .fn()
        .mockResolvedValue([
          { type: "text", text: "Async transformed content" },
        ]);

      const customToolRegistry: TamboComponent[] = [
        {
          name: "TestComponent",
          component: () => <div>Test</div>,
          description: "Test",
          propsSchema: z.object({ test: z.string() }),
          associatedTools: [
            {
              name: "async-tool",
              tool: jest.fn().mockResolvedValue({ data: "async tool result" }),
              description: "Tool with async transform",
              inputSchema: z.object({ input: z.string() }),
              outputSchema: z.object({ data: z.string() }),
              transformToContent: mockTransformToContent,
            },
          ],
        },
      ];

      const mockToolCallChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "tool-call-chunk",
          content: [{ type: "text", text: "Tool call" }],
          role: "tool",
          threadId: "test-thread-1",
          toolCallRequest: {
            toolName: "async-tool",
            parameters: [
              { parameterName: "input", parameterValue: "async-test" },
            ],
          },
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

      const mockFinalChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "final-chunk",
          content: [{ type: "text", text: "Final streaming response" }],
          role: "assistant",
          threadId: "test-thread-1",
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield mockToolCallChunk;
          yield mockFinalChunk;
        },
      };

      jest
        .mocked(advanceStream)
        .mockResolvedValueOnce(mockAsyncIterator)
        .mockResolvedValueOnce({
          [Symbol.asyncIterator]: async function* () {
            yield mockFinalChunk;
          },
        });

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({
          components: customToolRegistry,
          streaming: true,
        }),
      });

      await act(async () => {
        await result.current.sendThreadMessage("Use async tool", {
          threadId: "test-thread-1",
          streamResponse: true,
        });
      });

      // Verify the tool was called with single object arg (new inputSchema interface)
      expect(
        customToolRegistry[0]?.associatedTools?.[0]?.tool,
      ).toHaveBeenCalledWith({ input: "async-test" });

      // Verify transformToContent was called
      expect(mockTransformToContent).toHaveBeenCalledWith({
        data: "async tool result",
      });

      // Verify advanceStream was called twice (initial request and tool response)
      expect(advanceStream).toHaveBeenCalledTimes(2);

      // Verify the second advanceStream call included the transformed content
      expect(advanceStream).toHaveBeenLastCalledWith(
        mockTamboAI,
        expect.objectContaining({
          messageToAppend: expect.objectContaining({
            content: [{ type: "text", text: "Async transformed content" }],
            role: "tool",
          }),
        }),
        "test-thread-1",
      );
    });
  });

  describe("tamboStreamableHint streaming behavior", () => {
    it("should call streamable tool during streaming when tamboStreamableHint is true", async () => {
      const streamableToolFn = jest
        .fn()
        .mockResolvedValue({ data: "streamed" });

      const customToolRegistry: TamboComponent[] = [
        {
          name: "TestComponent",
          component: () => <div>Test</div>,
          description: "Test",
          propsSchema: z.object({ test: z.string() }),
          associatedTools: [
            {
              name: "streamable-tool",
              tool: streamableToolFn,
              description: "Tool safe for streaming",
              inputSchema: z.object({ input: z.string() }),
              outputSchema: z.object({ data: z.string() }),
              annotations: { tamboStreamableHint: true },
            },
          ],
        },
      ];

      // First chunk initializes finalMessage
      const mockInitialChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "initial-chunk",
          content: [{ type: "text", text: "Starting..." }],
          role: "assistant",
          threadId: "test-thread-1",
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.STREAMING_RESPONSE,
        mcpAccessToken: "test-mcp-access-token",
      };

      // Second chunk has the tool call - this triggers streaming tool handling
      const mockToolCallChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "initial-chunk", // Same ID as initial - it's an update
          content: [{ type: "text", text: "Streaming..." }],
          role: "assistant",
          threadId: "test-thread-1",
          component: {
            componentName: "",
            componentState: {},
            message: "",
            props: {},
            toolCallRequest: {
              toolName: "streamable-tool",
              parameters: [
                { parameterName: "input", parameterValue: "stream-test" },
              ],
            },
          },
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.STREAMING_RESPONSE,
        mcpAccessToken: "test-mcp-access-token",
      };

      const mockFinalChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "initial-chunk",
          content: [{ type: "text", text: "Complete" }],
          role: "assistant",
          threadId: "test-thread-1",
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield mockInitialChunk;
          yield mockToolCallChunk;
          yield mockFinalChunk;
        },
      };

      jest.mocked(advanceStream).mockResolvedValueOnce(mockAsyncIterator);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({
          components: customToolRegistry,
          streaming: true,
        }),
      });

      await act(async () => {
        await result.current.sendThreadMessage("Test streamable tool", {
          threadId: "test-thread-1",
          streamResponse: true,
        });
      });

      // Streamable tool should be called during streaming
      expect(streamableToolFn).toHaveBeenCalledWith({ input: "stream-test" });
    });

    it("should NOT call non-streamable tool during streaming", async () => {
      const nonStreamableToolFn = jest
        .fn()
        .mockResolvedValue({ data: "result" });

      const customToolRegistry: TamboComponent[] = [
        {
          name: "TestComponent",
          component: () => <div>Test</div>,
          description: "Test",
          propsSchema: z.object({ test: z.string() }),
          associatedTools: [
            {
              name: "non-streamable-tool",
              tool: nonStreamableToolFn,
              description: "Tool not safe for streaming",
              inputSchema: z.object({ input: z.string() }),
              outputSchema: z.object({ data: z.string() }),
              // No tamboStreamableHint - defaults to false
            },
          ],
        },
      ];

      // First chunk initializes finalMessage
      const mockInitialChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "streaming-chunk",
          content: [{ type: "text", text: "Starting..." }],
          role: "assistant",
          threadId: "test-thread-1",
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.STREAMING_RESPONSE,
        mcpAccessToken: "test-mcp-access-token",
      };

      // Second chunk has the tool call - but tool is NOT streamable
      const mockToolCallChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "streaming-chunk",
          content: [{ type: "text", text: "Streaming..." }],
          role: "assistant",
          threadId: "test-thread-1",
          component: {
            componentName: "",
            componentState: {},
            message: "",
            props: {},
            toolCallRequest: {
              toolName: "non-streamable-tool",
              parameters: [{ parameterName: "input", parameterValue: "test" }],
            },
          },
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.STREAMING_RESPONSE,
        mcpAccessToken: "test-mcp-access-token",
      };

      const mockFinalChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "streaming-chunk",
          content: [{ type: "text", text: "Complete" }],
          role: "assistant",
          threadId: "test-thread-1",
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield mockInitialChunk;
          yield mockToolCallChunk;
          yield mockFinalChunk;
        },
      };

      jest.mocked(advanceStream).mockResolvedValueOnce(mockAsyncIterator);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({
          components: customToolRegistry,
          streaming: true,
        }),
      });

      await act(async () => {
        await result.current.sendThreadMessage("Test non-streamable tool", {
          threadId: "test-thread-1",
          streamResponse: true,
        });
      });

      // Non-streamable tool should NOT be called during the streaming chunk phase
      // (it would only be called when generationStage is COMPLETE with a toolCallRequest)
      expect(nonStreamableToolFn).not.toHaveBeenCalled();
    });

    it("should only call streamable tools during streaming when mixed", async () => {
      const streamableToolFn = jest
        .fn()
        .mockResolvedValue({ data: "streamed" });
      const nonStreamableToolFn = jest
        .fn()
        .mockResolvedValue({ data: "not-streamed" });

      const customToolRegistry: TamboComponent[] = [
        {
          name: "TestComponent",
          component: () => <div>Test</div>,
          description: "Test",
          propsSchema: z.object({ test: z.string() }),
          associatedTools: [
            {
              name: "streamable-tool",
              tool: streamableToolFn,
              description: "Tool safe for streaming",
              inputSchema: z.object({ input: z.string() }),
              outputSchema: z.object({ data: z.string() }),
              annotations: { tamboStreamableHint: true },
            },
            {
              name: "non-streamable-tool",
              tool: nonStreamableToolFn,
              description: "Tool not safe for streaming",
              inputSchema: z.object({ input: z.string() }),
              outputSchema: z.object({ data: z.string() }),
              annotations: { tamboStreamableHint: false },
            },
          ],
        },
      ];

      // First chunk initializes finalMessage
      const mockInitialChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "streaming-chunk",
          content: [{ type: "text", text: "Starting..." }],
          role: "assistant",
          threadId: "test-thread-1",
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.STREAMING_RESPONSE,
        mcpAccessToken: "test-mcp-access-token",
      };

      // Second chunk calls the streamable tool
      const mockStreamableToolChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse =
        {
          responseMessageDto: {
            id: "streaming-chunk",
            content: [{ type: "text", text: "Calling streamable..." }],
            role: "assistant",
            threadId: "test-thread-1",
            component: {
              componentName: "",
              componentState: {},
              message: "",
              props: {},
              toolCallRequest: {
                toolName: "streamable-tool",
                parameters: [
                  { parameterName: "input", parameterValue: "streamed-input" },
                ],
              },
            },
            componentState: {},
            createdAt: new Date().toISOString(),
          },
          generationStage: GenerationStage.STREAMING_RESPONSE,
          mcpAccessToken: "test-mcp-access-token",
        };

      // Third chunk calls the non-streamable tool
      const mockNonStreamableToolChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse =
        {
          responseMessageDto: {
            id: "streaming-chunk",
            content: [{ type: "text", text: "Calling non-streamable..." }],
            role: "assistant",
            threadId: "test-thread-1",
            component: {
              componentName: "",
              componentState: {},
              message: "",
              props: {},
              toolCallRequest: {
                toolName: "non-streamable-tool",
                parameters: [
                  {
                    parameterName: "input",
                    parameterValue: "non-streamed-input",
                  },
                ],
              },
            },
            componentState: {},
            createdAt: new Date().toISOString(),
          },
          generationStage: GenerationStage.STREAMING_RESPONSE,
          mcpAccessToken: "test-mcp-access-token",
        };

      const mockFinalChunk: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "streaming-chunk",
          content: [{ type: "text", text: "Complete" }],
          role: "assistant",
          threadId: "test-thread-1",
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield mockInitialChunk;
          yield mockStreamableToolChunk;
          yield mockNonStreamableToolChunk;
          yield mockFinalChunk;
        },
      };

      jest.mocked(advanceStream).mockResolvedValueOnce(mockAsyncIterator);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({
          components: customToolRegistry,
          streaming: true,
        }),
      });

      await act(async () => {
        await result.current.sendThreadMessage("Test mixed tools", {
          threadId: "test-thread-1",
          streamResponse: true,
        });
      });

      // Only the streamable tool should be called during streaming
      expect(streamableToolFn).toHaveBeenCalledWith({
        input: "streamed-input",
      });
      expect(nonStreamableToolFn).not.toHaveBeenCalled();
    });
  });

  describe("auto-generate thread name", () => {
    it("should auto-generate thread name after reaching threshold", async () => {
      const mockStreamResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "response-1",
          content: [{ type: "text", text: "Response" }],
          role: "assistant",
          threadId: "test-thread-1",
          component: undefined,
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield mockStreamResponse;
        },
      };

      jest.mocked(advanceStream).mockResolvedValue(mockAsyncIterator);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({ autoGenerateNameThreshold: 2 }),
      });

      const existingThread = createMockThread({
        id: "test-thread-1",
        name: undefined,
      });

      jest
        .mocked(mockThreadsApi.retrieve)
        .mockResolvedValueOnce(existingThread);

      await act(async () => {
        await result.current.switchCurrentThread("test-thread-1");
      });

      // Add first message
      await act(async () => {
        await result.current.addThreadMessage(
          createMockMessage({
            id: "msg-1",
            role: "user",
            threadId: "test-thread-1",
          }),
          false,
        );
      });

      expect(mockThreadsApi.generateName).not.toHaveBeenCalled();

      // Add second message and send to reach threshold
      await act(async () => {
        await result.current.addThreadMessage(
          createMockMessage({
            id: "msg-2",
            role: "assistant",
            threadId: "test-thread-1",
          }),
          false,
        );
      });

      await act(async () => {
        await result.current.sendThreadMessage("Test message", {
          streamResponse: true,
        });
      });

      expect(mockThreadsApi.generateName).toHaveBeenCalledWith("test-thread-1");
      expect(result.current.thread.name).toBe("Generated Thread Name");
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ["threads", "test-project-id", undefined],
        expect.any(Function),
      );
    });

    it("should NOT auto-generate when autoGenerateThreadName is false", async () => {
      const mockStreamResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "response-1",
          content: [{ type: "text", text: "Response" }],
          role: "assistant",
          threadId: "test-thread-1",
          component: undefined,
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield mockStreamResponse;
        },
      };

      jest.mocked(advanceStream).mockResolvedValue(mockAsyncIterator);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({
          autoGenerateThreadName: false,
          autoGenerateNameThreshold: 2,
        }),
      });

      const existingThread = createMockThread({
        id: "test-thread-1",
        name: undefined,
      });

      jest
        .mocked(mockThreadsApi.retrieve)
        .mockResolvedValueOnce(existingThread);

      await act(async () => {
        await result.current.switchCurrentThread("test-thread-1");
      });

      await act(async () => {
        await result.current.addThreadMessage(
          createMockMessage({
            id: "msg-1",
            role: "user",
            threadId: "test-thread-1",
          }),
          false,
        );
      });

      await act(async () => {
        await result.current.addThreadMessage(
          createMockMessage({
            id: "msg-2",
            role: "assistant",
            threadId: "test-thread-1",
          }),
          false,
        );
      });

      await act(async () => {
        await result.current.sendThreadMessage("Test message", {
          streamResponse: true,
        });
      });

      // Should NOT generate name because feature is disabled
      expect(mockThreadsApi.generateName).not.toHaveBeenCalled();
    });

    it("should NOT auto-generate when thread already has a name", async () => {
      const mockStreamResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "response-1",
          content: [{ type: "text", text: "Response" }],
          role: "assistant",
          threadId: "test-thread-1",
          component: undefined,
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield mockStreamResponse;
        },
      };

      jest.mocked(advanceStream).mockResolvedValue(mockAsyncIterator);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({ autoGenerateNameThreshold: 2 }),
      });

      const threadWithName = createMockThread({
        id: "test-thread-1",
        name: "Existing Thread Name",
      });

      jest
        .mocked(mockThreadsApi.retrieve)
        .mockResolvedValueOnce(threadWithName);

      await act(async () => {
        await result.current.switchCurrentThread("test-thread-1");
      });

      // Verify thread has existing name
      expect(result.current.thread.name).toBe("Existing Thread Name");

      // Add messages to build up state
      await act(async () => {
        await result.current.addThreadMessage(
          createMockMessage({
            id: "msg-1",
            role: "user",
            threadId: "test-thread-1",
          }),
          false,
        );
      });

      await act(async () => {
        await result.current.addThreadMessage(
          createMockMessage({
            id: "msg-2",
            role: "assistant",
            threadId: "test-thread-1",
          }),
          false,
        );
      });

      expect(result.current.thread.messages).toHaveLength(2);

      // Send another message to reach threshold (3 messages total)
      await act(async () => {
        await result.current.sendThreadMessage("Test message", {
          streamResponse: true,
        });
      });

      // Should NOT generate name because thread already has one
      expect(mockThreadsApi.generateName).not.toHaveBeenCalled();
    });

    it("should NOT auto-generate for placeholder thread", async () => {
      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({ autoGenerateNameThreshold: 2 }),
      });

      // Stay on placeholder thread
      expect(result.current.thread.id).toBe("placeholder");

      // Add messages to placeholder thread
      await act(async () => {
        await result.current.addThreadMessage(
          createMockMessage({
            id: "msg-1",
            role: "user",
            threadId: "placeholder",
          }),
          false,
        );
      });

      await act(async () => {
        await result.current.addThreadMessage(
          createMockMessage({
            id: "msg-2",
            role: "assistant",
            threadId: "placeholder",
          }),
          false,
        );
      });

      // Should NOT generate name for placeholder thread
      expect(mockThreadsApi.generateName).not.toHaveBeenCalled();
    });
  });
});
