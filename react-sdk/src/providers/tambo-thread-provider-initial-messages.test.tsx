import { advanceStream } from "@tambo-ai/typescript-sdk";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { TamboTool } from "..";
import {
  GenerationStage,
  TamboThreadMessage,
} from "../model/generate-component-response";
import {
  TamboClientContext,
  useTamboClient,
  useTamboQueryClient,
} from "./tambo-client-provider";
import { TamboContextHelpersProvider } from "./tambo-context-helpers-provider";
import { TamboMcpTokenProvider } from "./tambo-mcp-token-provider";
import { TamboRegistryProvider } from "./tambo-registry-provider";
import { TamboThreadProvider, useTamboThread } from "./tambo-thread-provider";
import type { PartialTamboAI } from "../testing/types";

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

// Test wrapper
const createWrapper = (
  initialMessages: TamboThreadMessage[] = [],
  tools: TamboTool[] = [],
) => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
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
        <TamboRegistryProvider components={[]} tools={tools}>
          <TamboContextHelpersProvider>
            <TamboMcpTokenProvider>
              <TamboThreadProvider
                initialMessages={initialMessages}
                autoGenerateThreadName={false}
              >
                {children}
              </TamboThreadProvider>
            </TamboMcpTokenProvider>
          </TamboContextHelpersProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>
    );
  };
  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

describe("TamboThreadProvider with initial messages", () => {
  const mockClient: PartialTamboAI = {
    beta: {
      threads: {
        advance: jest.fn(),
        advanceByID: jest.fn(),
        cancel: jest.fn(),
        messages: {
          create: jest.fn(),
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTamboClient as jest.Mock).mockReturnValue(mockClient);
    // Provide a minimal mock for the query client used by the provider
    const mockQueryClient = {
      setQueryData: jest.fn(),
      invalidateQueries: jest.fn(),
    };
    (useTamboQueryClient as jest.Mock).mockReturnValue(mockQueryClient);
    (advanceStream as jest.Mock).mockImplementation(async function* () {
      yield {
        responseMessageDto: {
          id: "response-1",
          role: "assistant",
          content: [{ type: "text", text: "Hello back!" }],
          threadId: "new-thread-id",
          componentState: {},
          createdAt: new Date().toISOString(),
        },
        generationStage: GenerationStage.COMPLETE,
      };
    });
  });

  it("should initialize with empty messages when no initial messages provided", () => {
    const { result } = renderHook(() => useTamboThread(), {
      wrapper: createWrapper(),
    });

    expect(result.current.thread.messages).toEqual([]);
  });

  it("should initialize with provided initial messages", () => {
    const initialMessages: TamboThreadMessage[] = [
      createMockMessage({
        id: "initial-1",
        role: "system",
        content: [{ type: "text", text: "You are a helpful assistant." }],
      }),
      createMockMessage({
        id: "initial-2",
        role: "user",
        content: [{ type: "text", text: "Hello!" }],
      }),
    ];

    const { result } = renderHook(() => useTamboThread(), {
      wrapper: createWrapper(initialMessages),
    });

    expect(result.current.thread.messages).toHaveLength(2);
    expect(result.current.thread.messages[0].content[0].text).toBe(
      "You are a helpful assistant.",
    );
    expect(result.current.thread.messages[1].content[0].text).toBe("Hello!");
  });

  it("should include initial messages when sending a message to a new thread", async () => {
    const initialMessages: TamboThreadMessage[] = [
      createMockMessage({
        id: "initial-1",
        role: "system",
        content: [{ type: "text", text: "You are a helpful assistant." }],
      }),
    ];

    const { result } = renderHook(() => useTamboThread(), {
      wrapper: createWrapper(initialMessages),
    });

    await act(async () => {
      await result.current.sendThreadMessage("Test message");
    });

    // Check that advanceStream was called with initial messages
    expect(advanceStream).toHaveBeenCalledWith(
      mockClient,
      expect.objectContaining({
        initialMessages: [
          {
            content: [{ type: "text", text: "You are a helpful assistant." }],
            role: "system",
            additionalContext: undefined,
          },
        ],
      }),
      undefined,
    );
  });

  it("should not include initial messages when sending to an existing thread", async () => {
    const initialMessages: TamboThreadMessage[] = [
      createMockMessage({
        id: "initial-1",
        role: "system",
        content: [{ type: "text", text: "You are a helpful assistant." }],
      }),
    ];

    const { result } = renderHook(() => useTamboThread(), {
      wrapper: createWrapper(initialMessages),
    });

    // Switch to an existing thread first
    await act(async () => {
      result.current.switchCurrentThread("existing-thread-id", false);
    });

    await act(async () => {
      await result.current.sendThreadMessage("Test message");
    });

    // Check that advanceStream was called without initial messages
    expect(advanceStream).toHaveBeenCalledWith(
      mockClient,
      expect.not.objectContaining({
        initialMessages: expect.anything(),
      }),
      "existing-thread-id",
    );
  });

  it("should reset to initial messages when starting a new thread", () => {
    const initialMessages: TamboThreadMessage[] = [
      createMockMessage({
        id: "initial-1",
        role: "system",
        content: [{ type: "text", text: "You are a helpful assistant." }],
      }),
    ];

    const { result } = renderHook(() => useTamboThread(), {
      wrapper: createWrapper(initialMessages),
    });

    // Switch to an existing thread
    act(() => {
      result.current.switchCurrentThread("existing-thread-id", false);
    });

    // Start a new thread
    act(() => {
      result.current.startNewThread();
    });

    expect(result.current.thread.messages).toHaveLength(1);
    expect(result.current.thread.messages[0].content[0].text).toBe(
      "You are a helpful assistant.",
    );
  });

  it("should not include initial messages in tool response when first message triggers a tool", async () => {
    const initialMessages: TamboThreadMessage[] = [
      createMockMessage({
        id: "initial-1",
        role: "system",
        content: [{ type: "text", text: "You are a helpful assistant." }],
      }),
    ];

    // Create a test tool with JSON schema format
    const testTool = {
      name: "testTool",
      description: "A test tool",
      tool: jest.fn().mockResolvedValue({ result: "success" }),
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
      outputSchema: {
        type: "object" as const,
        properties: {
          result: { type: "string" as const },
        },
      },
    };

    // Mock advanceStream to simulate a tool call on first message
    let advanceStreamCallCount = 0;
    (advanceStream as jest.Mock).mockImplementation(async function* () {
      advanceStreamCallCount++;

      if (advanceStreamCallCount === 1) {
        // First call: user message triggers a tool
        yield {
          responseMessageDto: {
            id: "response-1",
            role: "assistant",
            content: [],
            threadId: "new-thread-id",
            componentState: {},
            createdAt: new Date().toISOString(),
            tool_call_id: "tool-call-1",
            toolCallRequest: {
              toolName: "testTool",
              args: {},
            },
          },
          generationStage: GenerationStage.FETCHING_CONTEXT,
        };
      } else {
        // Second call: tool response should NOT have initialMessages
        yield {
          responseMessageDto: {
            id: "response-2",
            role: "assistant",
            content: [{ type: "text", text: "Tool executed successfully" }],
            threadId: "new-thread-id",
            componentState: {},
            createdAt: new Date().toISOString(),
          },
          generationStage: GenerationStage.COMPLETE,
        };
      }
    });

    const { result } = renderHook(() => useTamboThread(), {
      wrapper: createWrapper(initialMessages, [testTool]),
    });

    await act(async () => {
      await result.current.sendThreadMessage("Test message that triggers tool");
    });

    // First call should have initialMessages
    expect(advanceStream).toHaveBeenNthCalledWith(
      1,
      mockClient,
      expect.objectContaining({
        initialMessages: expect.any(Array),
      }),
      undefined,
    );

    // Second call (tool response) should NOT have initialMessages
    expect(advanceStream).toHaveBeenNthCalledWith(
      2,
      mockClient,
      expect.objectContaining({
        messageToAppend: expect.objectContaining({
          role: "tool",
        }),
      }),
      "new-thread-id",
    );

    // Verify that the second call does NOT contain initialMessages
    const secondCallParams = (advanceStream as jest.Mock).mock.calls[1][1];
    expect(secondCallParams.initialMessages).toBeUndefined();
  });
});
