import TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import React from "react";
import { z } from "zod";
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
