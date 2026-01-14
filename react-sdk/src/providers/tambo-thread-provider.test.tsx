import TamboAI, { advanceStream } from "@tambo-ai/typescript-sdk";
import { QueryClient } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { DeepPartial } from "ts-essentials";
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

type PartialTamboAI = DeepPartial<TamboAI>;

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
jest.mock("@tambo-ai/typescript-sdk", () => ({
  advanceStream: jest.fn(),
}));

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
  overrides: Partial<TamboAI.Beta.Threads.Thread> = {},
) => ({
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

  const mockThreadsApi = {
    messages: {
      create: jest.fn(),
    },
    retrieve: jest.fn(),
    advance: jest.fn(),
    advanceByID: jest.fn(),
    generateName: jest.fn(),
  } satisfies DeepPartial<
    TamboAI["beta"]["threads"]
  > as unknown as TamboAI.Beta.Threads;

  const mockProjectsApi = {
    getCurrent: jest.fn(),
  } satisfies DeepPartial<
    TamboAI["beta"]["projects"]
  > as unknown as TamboAI.Beta.Projects;

  const mockBeta = {
    threads: mockThreadsApi,
    projects: mockProjectsApi,
  } satisfies PartialTamboAI["beta"];

  const mockTamboAI = {
    apiKey: "",
    beta: mockBeta,
  } satisfies PartialTamboAI as unknown as TamboAI;

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

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock query client
    mockQueryClient = {
      invalidateQueries: jest.fn().mockResolvedValue(undefined),
      setQueryData: jest.fn(),
    };
    jest
      .mocked(useTamboQueryClient)
      .mockReturnValue(mockQueryClient as unknown as QueryClient);

    jest.mocked(mockThreadsApi.retrieve).mockResolvedValue(mockThread);
    jest
      .mocked(mockThreadsApi.messages.create)
      .mockResolvedValue(createMockMessage());
    jest
      .mocked(mockThreadsApi.advance)
      .mockResolvedValue(createMockAdvanceResponse());
    jest
      .mocked(mockThreadsApi.advanceByID)
      .mockResolvedValue(createMockAdvanceResponse());
    jest.mocked(mockThreadsApi.generateName).mockResolvedValue({
      ...mockThread,
      name: "Generated Thread Name",
    });
    jest.mocked(mockProjectsApi.getCurrent).mockResolvedValue({
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
    const mockAdvanceResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
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

    jest
      .mocked(mockThreadsApi.advanceByID)
      .mockResolvedValue(mockAdvanceResponse);

    const { result } = renderHook(() => useTamboThread(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.sendThreadMessage("Hello", {
        threadId: "test-thread-1",
        streamResponse: false,
        additionalContext: {
          custom: {
            message: "additional instructions",
          },
        },
      });
    });

    expect(mockThreadsApi.advanceByID).toHaveBeenCalledWith("test-thread-1", {
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
    });
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
    const mockToolCallResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
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

    jest
      .mocked(mockThreadsApi.advanceByID)
      .mockResolvedValueOnce(mockToolCallResponse)
      .mockResolvedValueOnce({
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
      });

    const { result } = renderHook(() => useTamboThread(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.sendThreadMessage("Use tool", {
        threadId: "test-thread-1",
        streamResponse: false,
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

    const mockUnregisteredToolCallResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse =
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

    jest
      .mocked(mockThreadsApi.advanceByID)
      .mockResolvedValueOnce(mockUnregisteredToolCallResponse)
      .mockResolvedValueOnce({
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
      });

    const { result } = renderHook(() => useTamboThread(), {
      wrapper: createWrapper({
        onCallUnregisteredTool: mockOnCallUnregisteredTool,
      }),
    });

    await act(async () => {
      await result.current.sendThreadMessage("Use unregistered tool", {
        threadId: "test-thread-1",
        streamResponse: false,
      });
    });

    expect(result.current.generationStage).toBe(GenerationStage.COMPLETE);
    expect(mockOnCallUnregisteredTool).toHaveBeenCalledWith(
      "unregistered-tool",
      [{ parameterName: "input", parameterValue: "test-input" }],
    );
  });

  it("should handle unregistered tool calls without onCallUnregisteredTool", async () => {
    const mockUnregisteredToolCallResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse =
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

    jest
      .mocked(mockThreadsApi.advanceByID)
      .mockResolvedValueOnce(mockUnregisteredToolCallResponse)
      .mockResolvedValueOnce({
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
      });

    const { result } = renderHook(() => useTamboThread(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.sendThreadMessage("Use unregistered tool", {
        threadId: "test-thread-1",
        streamResponse: false,
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

    it("should call advanceById when streamResponse=false for existing thread", async () => {
      // Use wrapper with streaming=true to show that explicit streamResponse=false overrides provider setting
      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({ streaming: true }),
      });

      await act(async () => {
        await result.current.sendThreadMessage("Hello non-streaming", {
          threadId: "test-thread-1",
          streamResponse: false,
          additionalContext: {
            custom: {
              message: "additional instructions",
            },
          },
        });
      });

      expect(mockThreadsApi.advanceByID).toHaveBeenCalledWith("test-thread-1", {
        messageToAppend: {
          content: [{ type: "text", text: "Hello non-streaming" }],
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
      });

      // Should not call advance or advanceStream
      expect(mockThreadsApi.advance).not.toHaveBeenCalled();
      expect(advanceStream).not.toHaveBeenCalled();
    });

    it("should call advanceById when streamResponse is undefined and provider streaming=false", async () => {
      // Use wrapper with streaming=false to test that undefined streamResponse respects provider setting
      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({ streaming: false }),
      });

      await act(async () => {
        await result.current.sendThreadMessage("Hello default", {
          threadId: "test-thread-1",
          // streamResponse is undefined, should use provider's streaming=false
          additionalContext: {
            custom: {
              message: "additional instructions",
            },
          },
        });
      });

      expect(mockThreadsApi.advanceByID).toHaveBeenCalledWith("test-thread-1", {
        messageToAppend: {
          content: [{ type: "text", text: "Hello default" }],
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
      });

      // Should not call advance or advanceStream
      expect(mockThreadsApi.advance).not.toHaveBeenCalled();
      expect(advanceStream).not.toHaveBeenCalled();
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

    it("should call advance when streamResponse=false for placeholder thread", async () => {
      // Use wrapper with streaming=true to show that explicit streamResponse=false overrides provider setting
      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({ streaming: true }),
      });

      // Start with placeholder thread (which is the default state)
      expect(result.current.thread.id).toBe("placeholder");

      await act(async () => {
        await result.current.sendThreadMessage("Hello new thread", {
          threadId: "placeholder",
          streamResponse: false,
          additionalContext: {
            custom: {
              message: "additional instructions",
            },
          },
        });
      });

      expect(mockThreadsApi.advance).toHaveBeenCalledWith({
        messageToAppend: {
          content: [{ type: "text", text: "Hello new thread" }],
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
      });

      // Should not call advanceById or advanceStream
      expect(mockThreadsApi.advanceByID).not.toHaveBeenCalled();
      expect(advanceStream).not.toHaveBeenCalled();
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
  });

  describe("error handling", () => {
    it("should set generation stage to ERROR when non-streaming sendThreadMessage fails", async () => {
      const testError = new Error("API call failed");

      // Mock advanceById to throw an error
      jest.mocked(mockThreadsApi.advanceByID).mockRejectedValue(testError);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: Wrapper,
      });

      // Expect the error to be thrown
      await act(async () => {
        await result.current.switchCurrentThread("test-thread-1");
        await expect(
          result.current.sendThreadMessage("Hello", {
            threadId: "test-thread-1",
            streamResponse: false,
          }),
        ).rejects.toThrow("API call failed");
      });

      // Verify generation stage is set to ERROR
      expect(result.current.generationStage).toBe(GenerationStage.ERROR);
    });

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

    it("should set generation stage to ERROR when advance API call fails for placeholder thread", async () => {
      const testError = new Error("Advance API call failed");

      // Mock advance to throw an error
      jest.mocked(mockThreadsApi.advance).mockRejectedValue(testError);

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: Wrapper,
      });

      // Start with placeholder thread (which is the default state)
      expect(result.current.thread.id).toBe("placeholder");

      // Expect the error to be thrown
      await act(async () => {
        await expect(
          result.current.sendThreadMessage("Hello", {
            threadId: "placeholder",
            streamResponse: false,
          }),
        ).rejects.toThrow("Advance API call failed");
      });

      // Verify generation stage is set to ERROR
      expect(result.current.generationStage).toBe(GenerationStage.ERROR);
    });
  });

  describe("refetch threads list behavior", () => {
    it("should refetch threads list when creating a new thread via sendThreadMessage", async () => {
      const { result } = renderHook(() => useTamboThread(), {
        wrapper: Wrapper,
      });

      // Mock the advance response to return a new thread ID
      const mockAdvanceResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
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

      jest
        .mocked(mockThreadsApi.advance)
        .mockResolvedValue(mockAdvanceResponse);

      // Start with placeholder thread
      expect(result.current.thread.id).toBe("placeholder");

      // Send a message which will create a new thread with contextKey
      await act(async () => {
        await result.current.sendThreadMessage("Hello", {
          threadId: "placeholder",
          streamResponse: false,
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
    it("should use custom transformToContent when provided (non-streaming)", async () => {
      const mockTransformToContent = jest.fn().mockReturnValue([
        { type: "text", text: "Custom transformed content" },
        {
          type: "image_url",
          image_url: { url: "https://example.com/image.png" },
        },
      ]);

      const customToolRegistry: TamboComponent[] = [
        {
          name: "TestComponent",
          component: () => <div>Test</div>,
          description: "Test",
          propsSchema: z.object({ test: z.string() }),
          associatedTools: [
            {
              name: "custom-tool",
              tool: jest.fn().mockResolvedValue({ data: "tool result" }),
              description: "Tool with custom transform",
              inputSchema: z.object({ input: z.string() }),
              outputSchema: z.object({ data: z.string() }),
              transformToContent: mockTransformToContent,
            },
          ],
        },
      ];

      const mockToolCallResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "tool-call-1",
          content: [{ type: "text", text: "Tool response" }],
          role: "tool",
          threadId: "test-thread-1",
          toolCallRequest: {
            toolName: "custom-tool",
            parameters: [{ parameterName: "input", parameterValue: "test" }],
          },
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

      jest
        .mocked(mockThreadsApi.advanceByID)
        .mockResolvedValueOnce(mockToolCallResponse)
        .mockResolvedValueOnce({
          responseMessageDto: {
            id: "final-response",
            content: [{ type: "text", text: "Final response" }],
            role: "assistant",
            threadId: "test-thread-1",
            componentState: {},
            createdAt: new Date().toISOString(),
          },
          generationStage: GenerationStage.COMPLETE,
          mcpAccessToken: "test-mcp-access-token",
        });

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({ components: customToolRegistry }),
      });

      await act(async () => {
        await result.current.sendThreadMessage("Use custom tool", {
          threadId: "test-thread-1",
          streamResponse: false,
        });
      });

      // Verify the tool was called with single object arg (new inputSchema interface)
      expect(
        customToolRegistry[0]?.associatedTools?.[0]?.tool,
      ).toHaveBeenCalledWith({ input: "test" });

      // Verify transformToContent was called with the tool result
      expect(mockTransformToContent).toHaveBeenCalledWith({
        data: "tool result",
      });

      // Verify the second advance call included the transformed content
      expect(mockThreadsApi.advanceByID).toHaveBeenCalledTimes(2);
      expect(mockThreadsApi.advanceByID).toHaveBeenLastCalledWith(
        "test-thread-1",
        expect.objectContaining({
          messageToAppend: expect.objectContaining({
            content: [
              { type: "text", text: "Custom transformed content" },
              {
                type: "image_url",
                image_url: { url: "https://example.com/image.png" },
              },
            ],
            role: "tool",
          }),
        }),
      );
    });

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

    it("should fallback to stringified text when transformToContent is not provided", async () => {
      const toolWithoutTransform: TamboComponent[] = [
        {
          name: "TestComponent",
          component: () => <div>Test</div>,
          description: "Test",
          propsSchema: z.object({ test: z.string() }),
          associatedTools: [
            {
              name: "no-transform-tool",
              tool: jest
                .fn()
                .mockResolvedValue({ complex: "data", nested: { value: 42 } }),
              description: "Tool without custom transform",
              inputSchema: z.object({ input: z.string() }),
              outputSchema: z.object({
                complex: z.string(),
                nested: z.object({ value: z.number() }),
              }),
              // No transformToContent provided
            },
          ],
        },
      ];

      const mockToolCallResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "tool-call-1",
          content: [{ type: "text", text: "Tool call" }],
          role: "tool",
          threadId: "test-thread-1",
          toolCallRequest: {
            toolName: "no-transform-tool",
            parameters: [{ parameterName: "input", parameterValue: "test" }],
          },
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

      jest
        .mocked(mockThreadsApi.advanceByID)
        .mockResolvedValueOnce(mockToolCallResponse)
        .mockResolvedValueOnce({
          responseMessageDto: {
            id: "final-response",
            content: [{ type: "text", text: "Final response" }],
            role: "assistant",
            threadId: "test-thread-1",
            componentState: {},
            createdAt: new Date().toISOString(),
          },
          generationStage: GenerationStage.COMPLETE,
          mcpAccessToken: "test-mcp-access-token",
        });

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({ components: toolWithoutTransform }),
      });

      await act(async () => {
        await result.current.sendThreadMessage("Use tool without transform", {
          threadId: "test-thread-1",
          streamResponse: false,
        });
      });

      // Verify the tool was called with single object arg (new inputSchema interface)
      expect(
        toolWithoutTransform[0]?.associatedTools?.[0]?.tool,
      ).toHaveBeenCalledWith({ input: "test" });

      // Verify the second advance call used stringified content
      expect(mockThreadsApi.advanceByID).toHaveBeenLastCalledWith(
        "test-thread-1",
        expect.objectContaining({
          messageToAppend: expect.objectContaining({
            content: [
              {
                type: "text",
                text: '{"complex":"data","nested":{"value":42}}',
              },
            ],
            role: "tool",
          }),
        }),
      );
    });

    it("should always return text for error responses even with transformToContent", async () => {
      const mockTransformToContent = jest.fn().mockReturnValue([
        {
          type: "image_url",
          image_url: { url: "https://example.com/error.png" },
        },
      ]);

      const toolWithTransform: TamboComponent[] = [
        {
          name: "TestComponent",
          component: () => <div>Test</div>,
          description: "Test",
          propsSchema: z.object({ test: z.string() }),
          associatedTools: [
            {
              name: "error-tool",
              tool: jest
                .fn()
                .mockRejectedValue(new Error("Tool execution failed")),
              description: "Tool that errors",
              inputSchema: z.object({ input: z.string() }),
              outputSchema: z.string(),
              transformToContent: mockTransformToContent,
            },
          ],
        },
      ];

      const mockToolCallResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse = {
        responseMessageDto: {
          id: "tool-call-1",
          content: [{ type: "text", text: "Tool call" }],
          role: "tool",
          threadId: "test-thread-1",
          toolCallRequest: {
            toolName: "error-tool",
            parameters: [{ parameterName: "input", parameterValue: "test" }],
          },
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
        mcpAccessToken: "test-mcp-access-token",
      };

      jest
        .mocked(mockThreadsApi.advanceByID)
        .mockResolvedValueOnce(mockToolCallResponse)
        .mockResolvedValueOnce({
          responseMessageDto: {
            id: "final-response",
            content: [{ type: "text", text: "Final response" }],
            role: "assistant",
            threadId: "test-thread-1",
            componentState: {},
            createdAt: new Date().toISOString(),
          },
          generationStage: GenerationStage.COMPLETE,
          mcpAccessToken: "test-mcp-access-token",
        });

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: createWrapper({ components: toolWithTransform }),
      });

      await act(async () => {
        await result.current.sendThreadMessage("Use error tool", {
          threadId: "test-thread-1",
          streamResponse: false,
        });
      });

      // Verify the tool was called with single object arg (new inputSchema interface)
      expect(
        toolWithTransform[0]?.associatedTools?.[0]?.tool,
      ).toHaveBeenCalledWith({ input: "test" });

      // Verify transformToContent was NOT called for error responses
      expect(mockTransformToContent).not.toHaveBeenCalled();

      // Verify the second advance call used text content with the error message
      expect(mockThreadsApi.advanceByID).toHaveBeenLastCalledWith(
        "test-thread-1",
        expect.objectContaining({
          messageToAppend: expect.objectContaining({
            content: [
              expect.objectContaining({
                type: "text",
                // Error message should be in text format
              }),
            ],
            role: "tool",
          }),
        }),
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
        await result.current.sendThreadMessage("Test message");
      });

      expect(mockThreadsApi.generateName).toHaveBeenCalledWith("test-thread-1");
      expect(result.current.thread.name).toBe("Generated Thread Name");
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ["threads", "test-project-id", undefined],
        expect.any(Function),
      );
    });

    it("should NOT auto-generate when autoGenerateThreadName is false", async () => {
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
        await result.current.sendThreadMessage("Test message");
      });

      // Should NOT generate name because feature is disabled
      expect(mockThreadsApi.generateName).not.toHaveBeenCalled();
    });

    it("should NOT auto-generate when thread already has a name", async () => {
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
        await result.current.sendThreadMessage("Test message");
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
