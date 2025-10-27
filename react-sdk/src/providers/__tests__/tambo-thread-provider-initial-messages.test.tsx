import TamboAI, { advanceStream } from "@tambo-ai/typescript-sdk";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { DeepPartial } from "ts-essentials";
import {
  GenerationStage,
  TamboThreadMessage,
} from "../../model/generate-component-response";
import { useTamboClient, useTamboQueryClient } from "../tambo-client-provider";
import { TamboContextHelpersProvider } from "../tambo-context-helpers-provider";
import { TamboMcpTokenProvider } from "../tambo-mcp-token-provider";
import { TamboRegistryProvider } from "../tambo-registry-provider";
import { TamboThreadProvider, useTamboThread } from "../tambo-thread-provider";

type PartialTamboAI = DeepPartial<TamboAI>;

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: jest.fn().mockReturnValue("test-uuid"),
  },
});

// Mock the required providers
jest.mock("../tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
  useTamboQueryClient: jest.fn(),
}));
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
const createWrapper = (initialMessages: TamboThreadMessage[] = []) => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <TamboRegistryProvider components={[]} tools={[]}>
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
  );
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
});
