import { EventType } from "@ag-ui/core";
import TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import React from "react";
import { z } from "zod";
import type { TamboTool } from "../../model/component-metadata";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { TamboRegistryContext } from "../../providers/tambo-registry-provider";
import { TamboV1StreamProvider } from "../providers/tambo-v1-stream-context";
import {
  createRunStream,
  useTamboV1SendMessage,
} from "./use-tambo-v1-send-message";

jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
}));

describe("useTamboV1SendMessage", () => {
  const mockThreadsRunsApi = {
    run: jest.fn(),
    create: jest.fn(),
  };

  const mockTamboAI = {
    apiKey: "",
    threads: {
      runs: mockThreadsRunsApi,
    },
  } as unknown as TamboAI;

  const mockRegistry = {
    componentList: new Map(),
    toolRegistry: new Map(),
  };

  let queryClient: QueryClient;

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TamboRegistryContext.Provider value={mockRegistry as any}>
          <TamboV1StreamProvider threadId="thread_123">
            {children}
          </TamboV1StreamProvider>
        </TamboRegistryContext.Provider>
      </QueryClientProvider>
    );
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.mocked(useTamboClient).mockReturnValue(mockTamboAI);
    mockThreadsRunsApi.run.mockReset();
    mockThreadsRunsApi.create.mockReset();
  });

  it("returns a mutation object", () => {
    const { result } = renderHook(() => useTamboV1SendMessage("thread_123"), {
      wrapper: TestWrapper,
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it("returns a mutation object when threadId is not provided", () => {
    const { result } = renderHook(() => useTamboV1SendMessage(), {
      wrapper: TestWrapper,
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
  });
});

describe("createRunStream", () => {
  const mockStream = {
    [Symbol.asyncIterator]: async function* () {
      yield { type: "RUN_STARTED", runId: "run_1", threadId: "thread_123" };
    },
  };

  const mockThreadsRunsApi = {
    run: jest.fn(),
    create: jest.fn(),
  };

  const mockClient = {
    threads: {
      runs: mockThreadsRunsApi,
    },
  } as unknown as TamboAI;

  const mockRegistry = {
    componentList: new Map([
      [
        "TestComponent",
        {
          name: "TestComponent",
          description: "A test component",
          component: () => null,
          propsSchema: z.object({ title: z.string() }),
        },
      ],
    ]),
    toolRegistry: new Map([
      [
        "testTool",
        {
          name: "testTool",
          description: "A test tool",
          tool: async () => "result",
          inputSchema: z.object({ query: z.string() }),
        },
      ],
    ]),
  };

  const testMessage = {
    role: "user" as const,
    content: [{ type: "text" as const, text: "Hello" }],
  };

  beforeEach(() => {
    mockThreadsRunsApi.run.mockReset();
    mockThreadsRunsApi.create.mockReset();
  });

  it("calls client.threads.runs.run when threadId is provided", async () => {
    mockThreadsRunsApi.run.mockResolvedValue(mockStream);

    const result = await createRunStream({
      client: mockClient,
      threadId: "thread_123",
      message: testMessage,
      registry: mockRegistry as any,
    });

    expect(mockThreadsRunsApi.run).toHaveBeenCalledWith("thread_123", {
      message: testMessage,
      availableComponents: expect.any(Array),
      tools: expect.any(Array),
    });
    expect(mockThreadsRunsApi.create).not.toHaveBeenCalled();
    expect(result.stream).toBe(mockStream);
    expect(result.initialThreadId).toBe("thread_123");
  });

  it("calls client.threads.runs.create when threadId is not provided", async () => {
    mockThreadsRunsApi.create.mockResolvedValue(mockStream);

    const result = await createRunStream({
      client: mockClient,
      threadId: undefined,
      message: testMessage,
      registry: mockRegistry as any,
    });

    expect(mockThreadsRunsApi.create).toHaveBeenCalledWith({
      message: testMessage,
      availableComponents: expect.any(Array),
      tools: expect.any(Array),
    });
    expect(mockThreadsRunsApi.run).not.toHaveBeenCalled();
    expect(result.stream).toBe(mockStream);
    expect(result.initialThreadId).toBeUndefined();
  });

  it("converts registry components to availableComponents format", async () => {
    mockThreadsRunsApi.run.mockResolvedValue(mockStream);

    await createRunStream({
      client: mockClient,
      threadId: "thread_123",
      message: testMessage,
      registry: mockRegistry as any,
    });

    const callArgs = mockThreadsRunsApi.run.mock.calls[0][1];
    expect(callArgs.availableComponents).toEqual([
      {
        name: "TestComponent",
        description: "A test component",
        propsSchema: expect.any(Object),
      },
    ]);
  });

  it("converts registry tools to tools format", async () => {
    mockThreadsRunsApi.run.mockResolvedValue(mockStream);

    await createRunStream({
      client: mockClient,
      threadId: "thread_123",
      message: testMessage,
      registry: mockRegistry as any,
    });

    const callArgs = mockThreadsRunsApi.run.mock.calls[0][1];
    expect(callArgs.tools).toEqual([
      expect.objectContaining({
        name: "testTool",
        description: "A test tool",
      }),
    ]);
  });

  it("handles empty registry", async () => {
    mockThreadsRunsApi.run.mockResolvedValue(mockStream);

    const emptyRegistry = {
      componentList: new Map(),
      toolRegistry: new Map(),
    };

    await createRunStream({
      client: mockClient,
      threadId: "thread_123",
      message: testMessage,
      registry: emptyRegistry as any,
    });

    const callArgs = mockThreadsRunsApi.run.mock.calls[0][1];
    expect(callArgs.availableComponents).toEqual([]);
    expect(callArgs.tools).toEqual([]);
  });
});

describe("useTamboV1SendMessage mutation", () => {
  const mockThreadsRunsApi = {
    run: jest.fn(),
    create: jest.fn(),
  };

  const mockTamboAI = {
    apiKey: "",
    threads: {
      runs: mockThreadsRunsApi,
    },
  } as unknown as TamboAI;

  let queryClient: QueryClient;

  function createAsyncIterator<T>(events: T[]) {
    return {
      [Symbol.asyncIterator]: async function* () {
        for (const event of events) {
          yield event;
        }
      },
    };
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.mocked(useTamboClient).mockReturnValue(mockTamboAI);
    mockThreadsRunsApi.run.mockReset();
    mockThreadsRunsApi.create.mockReset();
  });

  it("extracts threadId from RUN_STARTED event when creating new thread", async () => {
    const mockStream = createAsyncIterator([
      {
        type: EventType.RUN_STARTED,
        runId: "run_1",
        threadId: "new_thread_123",
      },
      { type: EventType.RUN_FINISHED },
    ]);

    mockThreadsRunsApi.create.mockResolvedValue(mockStream);

    const mockRegistry = {
      componentList: new Map(),
      toolRegistry: new Map(),
    };

    function TestWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TamboRegistryContext.Provider value={mockRegistry as any}>
            <TamboV1StreamProvider>{children}</TamboV1StreamProvider>
          </TamboRegistryContext.Provider>
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useTamboV1SendMessage(), {
      wrapper: TestWrapper,
    });

    let mutationResult: { threadId: string | undefined } | undefined;
    await act(async () => {
      mutationResult = await result.current.mutateAsync({
        message: {
          role: "user",
          content: [{ type: "text", text: "Hello" }],
        },
      });
    });

    expect(mutationResult?.threadId).toBe("new_thread_123");
  });

  it("throws error when first event is not RUN_STARTED on new thread", async () => {
    const mockStream = createAsyncIterator([
      { type: EventType.TEXT_MESSAGE_START, messageId: "msg_1" },
    ]);

    mockThreadsRunsApi.create.mockResolvedValue(mockStream);

    const mockRegistry = {
      componentList: new Map(),
      toolRegistry: new Map(),
    };

    function TestWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TamboRegistryContext.Provider value={mockRegistry as any}>
            <TamboV1StreamProvider>{children}</TamboV1StreamProvider>
          </TamboRegistryContext.Provider>
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useTamboV1SendMessage(), {
      wrapper: TestWrapper,
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          message: {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        });
      }),
    ).rejects.toThrow("Expected first event to be RUN_STARTED with threadId");
  });

  it("executes tools on awaiting_input event", async () => {
    const toolExecuted = jest.fn().mockResolvedValue("tool result");

    const testTool: TamboTool = {
      name: "test_tool",
      description: "A test tool",
      tool: toolExecuted,
      inputSchema: z.object({ query: z.string() }),
      outputSchema: z.string(),
    };

    const mockRegistry = {
      componentList: new Map(),
      toolRegistry: new Map([["test_tool", testTool]]),
    };

    const initialStream = createAsyncIterator([
      {
        type: EventType.RUN_STARTED,
        runId: "run_1",
        threadId: "thread_123",
      },
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "msg_1",
        role: "assistant",
      },
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "call_1",
        toolCallName: "test_tool",
        parentMessageId: "msg_1",
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: '{"query":"test"}',
      },
      {
        type: EventType.TOOL_CALL_END,
        toolCallId: "call_1",
      },
      {
        type: EventType.CUSTOM,
        name: "tambo.run.awaiting_input",
        value: { pendingToolCallIds: ["call_1"] },
      },
    ]);

    const continueStream = createAsyncIterator([
      {
        type: EventType.RUN_STARTED,
        runId: "run_2",
        threadId: "thread_123",
      },
      { type: EventType.RUN_FINISHED },
    ]);

    mockThreadsRunsApi.run
      .mockResolvedValueOnce(initialStream)
      .mockResolvedValueOnce(continueStream);

    function TestWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TamboRegistryContext.Provider value={mockRegistry as any}>
            <TamboV1StreamProvider threadId="thread_123">
              {children}
            </TamboV1StreamProvider>
          </TamboRegistryContext.Provider>
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useTamboV1SendMessage("thread_123"), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        message: {
          role: "user",
          content: [{ type: "text", text: "Hello" }],
        },
      });
    });

    expect(toolExecuted).toHaveBeenCalledWith({ query: "test" });

    // Verify continuation was called with tool results
    expect(mockThreadsRunsApi.run).toHaveBeenCalledTimes(2);
    const continueCall = mockThreadsRunsApi.run.mock.calls[1];
    expect(continueCall[0]).toBe("thread_123");
    expect(continueCall[1].previousRunId).toBe("run_1");
    expect(continueCall[1].message.content[0]).toEqual({
      type: "tool_result",
      toolUseId: "call_1",
      content: [{ type: "text", text: "tool result" }],
    });
  });

  it("handles tool calls with chunked args", async () => {
    const toolExecuted = jest.fn().mockResolvedValue({ result: 42 });

    const testTool: TamboTool = {
      name: "chunked_tool",
      description: "Tool with chunked args",
      tool: toolExecuted,
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      outputSchema: z.object({ result: z.number() }),
    };

    const mockRegistry = {
      componentList: new Map(),
      toolRegistry: new Map([["chunked_tool", testTool]]),
    };

    const initialStream = createAsyncIterator([
      {
        type: EventType.RUN_STARTED,
        runId: "run_1",
        threadId: "thread_123",
      },
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "msg_1",
        role: "assistant",
      },
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "call_1",
        toolCallName: "chunked_tool",
        parentMessageId: "msg_1",
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: '{"a":',
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: "10,",
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: '"b":20}',
      },
      {
        type: EventType.TOOL_CALL_END,
        toolCallId: "call_1",
      },
      {
        type: EventType.CUSTOM,
        name: "tambo.run.awaiting_input",
        value: { pendingToolCallIds: ["call_1"] },
      },
    ]);

    const continueStream = createAsyncIterator([
      {
        type: EventType.RUN_STARTED,
        runId: "run_2",
        threadId: "thread_123",
      },
      { type: EventType.RUN_FINISHED },
    ]);

    mockThreadsRunsApi.run
      .mockResolvedValueOnce(initialStream)
      .mockResolvedValueOnce(continueStream);

    function TestWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TamboRegistryContext.Provider value={mockRegistry as any}>
            <TamboV1StreamProvider threadId="thread_123">
              {children}
            </TamboV1StreamProvider>
          </TamboRegistryContext.Provider>
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useTamboV1SendMessage("thread_123"), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        message: {
          role: "user",
          content: [{ type: "text", text: "Calculate" }],
        },
      });
    });

    expect(toolExecuted).toHaveBeenCalledWith({ a: 10, b: 20 });
  });

  it("handles missing TOOL_CALL_ARGS gracefully", async () => {
    // Test that tools can be executed even when no args events are received
    // (the hook keeps input as empty object)
    const toolExecuted = jest.fn().mockResolvedValue("result");

    const testTool: TamboTool = {
      name: "test_tool",
      description: "Test tool",
      tool: toolExecuted,
      inputSchema: z.object({}),
      outputSchema: z.string(),
    };

    const mockRegistry = {
      componentList: new Map(),
      toolRegistry: new Map([["test_tool", testTool]]),
    };

    const initialStream = createAsyncIterator([
      {
        type: EventType.RUN_STARTED,
        runId: "run_1",
        threadId: "thread_123",
      },
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "msg_1",
        role: "assistant",
      },
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "call_1",
        toolCallName: "test_tool",
        parentMessageId: "msg_1",
      },
      // No TOOL_CALL_ARGS events - args will be empty
      {
        type: EventType.TOOL_CALL_END,
        toolCallId: "call_1",
      },
      {
        type: EventType.CUSTOM,
        name: "tambo.run.awaiting_input",
        value: { pendingToolCallIds: ["call_1"] },
      },
    ]);

    const continueStream = createAsyncIterator([
      {
        type: EventType.RUN_STARTED,
        runId: "run_2",
        threadId: "thread_123",
      },
      { type: EventType.RUN_FINISHED },
    ]);

    mockThreadsRunsApi.run
      .mockResolvedValueOnce(initialStream)
      .mockResolvedValueOnce(continueStream);

    function TestWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TamboRegistryContext.Provider value={mockRegistry as any}>
            <TamboV1StreamProvider threadId="thread_123">
              {children}
            </TamboV1StreamProvider>
          </TamboRegistryContext.Provider>
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useTamboV1SendMessage("thread_123"), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        message: {
          role: "user",
          content: [{ type: "text", text: "Test" }],
        },
      });
    });

    // Tool should be called with empty input due to no args events
    expect(toolExecuted).toHaveBeenCalledWith({});
  });

  it("handles unknown tool in awaiting_input by returning error result", async () => {
    const mockRegistry = {
      componentList: new Map(),
      toolRegistry: new Map(), // Empty registry - tool not found
    };

    const initialStream = createAsyncIterator([
      {
        type: EventType.RUN_STARTED,
        runId: "run_1",
        threadId: "thread_123",
      },
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "msg_1",
        role: "assistant",
      },
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "call_1",
        toolCallName: "unknown_tool",
        parentMessageId: "msg_1",
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: "{}",
      },
      {
        type: EventType.TOOL_CALL_END,
        toolCallId: "call_1",
      },
      {
        type: EventType.CUSTOM,
        name: "tambo.run.awaiting_input",
        value: { pendingToolCallIds: ["call_1"] },
      },
    ]);

    const continueStream = createAsyncIterator([
      {
        type: EventType.RUN_STARTED,
        runId: "run_2",
        threadId: "thread_123",
      },
      { type: EventType.RUN_FINISHED },
    ]);

    mockThreadsRunsApi.run
      .mockResolvedValueOnce(initialStream)
      .mockResolvedValueOnce(continueStream);

    function TestWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TamboRegistryContext.Provider value={mockRegistry as any}>
            <TamboV1StreamProvider threadId="thread_123">
              {children}
            </TamboV1StreamProvider>
          </TamboRegistryContext.Provider>
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useTamboV1SendMessage("thread_123"), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        message: {
          role: "user",
          content: [{ type: "text", text: "Test" }],
        },
      });
    });

    // Verify continuation was called (second call)
    expect(mockThreadsRunsApi.run).toHaveBeenCalledTimes(2);

    // Continuation should include error message for unknown tool
    const continueCall = mockThreadsRunsApi.run.mock.calls[1];
    expect(continueCall[1].message.content[0]).toEqual({
      type: "tool_result",
      toolUseId: "call_1",
      content: [
        { type: "text", text: 'Tool "unknown_tool" not found in registry' },
      ],
    });
  });

  it("works with default registry context when no provider is present", () => {
    // TamboRegistryContext has a default value, so the hook should work
    // (though with an empty registry)
    function TestWrapperWithoutRegistry({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TamboV1StreamProvider threadId="thread_123">
            {children}
          </TamboV1StreamProvider>
        </QueryClientProvider>
      );
    }

    // Should not throw - default context is used
    const { result } = renderHook(() => useTamboV1SendMessage("thread_123"), {
      wrapper: TestWrapperWithoutRegistry,
    });

    expect(result.current.mutate).toBeDefined();
  });

  it("invalidates queries on successful mutation", async () => {
    const mockStream = createAsyncIterator([
      {
        type: EventType.RUN_STARTED,
        runId: "run_1",
        threadId: "thread_123",
      },
      { type: EventType.RUN_FINISHED },
    ]);

    mockThreadsRunsApi.run.mockResolvedValue(mockStream);

    const mockRegistry = {
      componentList: new Map(),
      toolRegistry: new Map(),
    };

    function TestWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TamboRegistryContext.Provider value={mockRegistry as any}>
            <TamboV1StreamProvider threadId="thread_123">
              {children}
            </TamboV1StreamProvider>
          </TamboRegistryContext.Provider>
        </QueryClientProvider>
      );
    }

    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useTamboV1SendMessage("thread_123"), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        message: {
          role: "user",
          content: [{ type: "text", text: "Hello" }],
        },
      });
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["v1-threads", "thread_123"],
      });
    });
  });

  it("logs error on mutation failure", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const testError = new Error("API Error");
    mockThreadsRunsApi.run.mockRejectedValue(testError);

    const mockRegistry = {
      componentList: new Map(),
      toolRegistry: new Map(),
    };

    function TestWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TamboRegistryContext.Provider value={mockRegistry as any}>
            <TamboV1StreamProvider threadId="thread_123">
              {children}
            </TamboV1StreamProvider>
          </TamboRegistryContext.Provider>
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useTamboV1SendMessage("thread_123"), {
      wrapper: TestWrapper,
    });

    try {
      await act(async () => {
        await result.current.mutateAsync({
          message: {
            role: "user",
            content: [{ type: "text", text: "Hello" }],
          },
        });
      });
    } catch {
      // Expected to throw
    }

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "[useTamboV1SendMessage] Mutation failed:",
        testError,
      );
    });

    consoleSpy.mockRestore();
  });
});
