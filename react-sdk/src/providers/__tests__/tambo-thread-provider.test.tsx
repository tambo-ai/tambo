import TamboAI, { advanceStream } from "@tambo-ai/typescript-sdk";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { DeepPartial } from "ts-essentials";
import { z } from "zod";
import { TamboComponent } from "../../model/component-metadata";
import {
  GenerationStage,
  TamboThreadMessage,
} from "../../model/generate-component-response";
import { serializeRegistry } from "../../testing/tools";
import { useTamboClient } from "../tambo-client-provider";
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
}));
jest.mock("@tambo-ai/typescript-sdk", () => ({
  advanceStream: jest.fn(),
}));

// Mock the system context and getCustomContext
jest.mock("../../util/registry", () => ({
  ...jest.requireActual("../../util/registry"),
  getSystemContext: () => ({
    localTime: "7/24/2025, 6:26:21 PM",
    timezone: "America/New_York",
  }),
  getCustomContext: () => ({
    message: "additional instructions",
  }),
}));

// Mock the combined context which includes the system context and the custom context
const mockCombinedContext = {
  system: {
    localTime: "7/24/2025, 6:26:21 PM",
    timezone: "America/New_York",
  },
  ...{
    custom: {
      message: "additional instructions",
    },
  },
};

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
    advanceById: jest.fn(),
  } satisfies DeepPartial<
    TamboAI["beta"]["threads"]
  > as unknown as TamboAI.Beta.Threads;

  const mockBeta = {
    threads: mockThreadsApi,
  } satisfies PartialTamboAI["beta"];

  const mockTamboAI = {
    apiKey: "",
    beta: mockBeta,
  } satisfies PartialTamboAI as unknown as TamboAI;

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
          toolSchema: z
            .function()
            .args(z.string().describe("test-param-description"))
            .returns(z.string()),
        },
      ],
    },
  ];

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TamboRegistryProvider components={mockRegistry}>
      <TamboThreadProvider streaming={false}>{children}</TamboThreadProvider>
    </TamboRegistryProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(mockThreadsApi.retrieve).mockResolvedValue(mockThread);
    jest
      .mocked(mockThreadsApi.messages.create)
      .mockResolvedValue(createMockMessage());
    jest
      .mocked(mockThreadsApi.advance)
      .mockResolvedValue(createMockAdvanceResponse());
    jest
      .mocked(mockThreadsApi.advanceById)
      .mockResolvedValue(createMockAdvanceResponse());
    jest.mocked(useTamboClient).mockReturnValue(mockTamboAI);
  });

  it("should initialize with placeholder thread", () => {
    const { result } = renderHook(() => useTamboThread(), { wrapper });

    expect(result.current.thread.id).toBe("placeholder");
    expect(result.current.isIdle).toBe(true);
    expect(result.current.generationStage).toBe(GenerationStage.IDLE);
  });

  it("should switch to a new thread", async () => {
    const { result } = renderHook(() => useTamboThread(), { wrapper });

    await act(async () => {
      await result.current.switchCurrentThread("test-thread-1");
    });

    expect(mockThreadsApi.retrieve).toHaveBeenCalledWith("test-thread-1", {
      includeInternal: true,
    });
    expect(result.current.thread.id).toBe("test-thread-1");
  });

  it("should start a new thread", async () => {
    const { result } = renderHook(() => useTamboThread(), { wrapper });

    await act(async () => {
      result.current.startNewThread();
    });

    expect(result.current.thread.id).toBe("placeholder");
    expect(result.current.isIdle).toBe(true);
  });

  it("should add a message to the thread", async () => {
    const { result } = renderHook(() => useTamboThread(), { wrapper });
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
    const { result } = renderHook(() => useTamboThread(), { wrapper });
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
      .mocked(mockThreadsApi.advanceById)
      .mockResolvedValue(mockAdvanceResponse);

    const { result } = renderHook(() => useTamboThread(), { wrapper });

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

    expect(mockThreadsApi.advanceById).toHaveBeenCalledWith("test-thread-1", {
      messageToAppend: {
        content: [{ type: "text", text: "Hello" }],
        role: "user",
        additionalContext: mockCombinedContext,
      },
      availableComponents: serializeRegistry(mockRegistry),
      contextKey: undefined,
      clientTools: [],
      toolCallCounts: {},
    });
    expect(result.current.generationStage).toBe(GenerationStage.COMPLETE);
  });

  it("should handle input value changes", () => {
    const { result } = renderHook(() => useTamboThread(), { wrapper });

    act(() => {
      result.current.setInputValue("New input");
    });

    expect(result.current.inputValue).toBe("New input");
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

    const { result } = renderHook(() => useTamboThread(), { wrapper });

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
      .mocked(mockThreadsApi.advanceById)
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

    const { result } = renderHook(() => useTamboThread(), { wrapper });

    await act(async () => {
      await result.current.sendThreadMessage("Use tool", {
        threadId: "test-thread-1",
        streamResponse: false,
      });
    });
    expect(result.current.generationStage).toBe(GenerationStage.COMPLETE);
    expect(mockRegistry[0]?.associatedTools?.[0]?.tool).toHaveBeenCalledWith(
      "test",
    );
  });

  describe("streaming behavior", () => {
    it("should call advanceStream when streamResponse=true", async () => {
      // Use wrapper with streaming=true to show that explicit streamResponse=true works
      const wrapperWithStreaming = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <TamboRegistryProvider components={mockRegistry}>
          <TamboThreadProvider streaming={true}>{children}</TamboThreadProvider>
        </TamboRegistryProvider>
      );

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
        wrapper: wrapperWithStreaming,
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
            additionalContext: mockCombinedContext,
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
      expect(mockThreadsApi.advanceById).not.toHaveBeenCalled();
    });

    it("should call advanceById when streamResponse=false for existing thread", async () => {
      // Use wrapper with streaming=true to show that explicit streamResponse=false overrides provider setting
      const wrapperWithStreaming = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <TamboRegistryProvider components={mockRegistry}>
          <TamboThreadProvider streaming={true}>{children}</TamboThreadProvider>
        </TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: wrapperWithStreaming,
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

      expect(mockThreadsApi.advanceById).toHaveBeenCalledWith("test-thread-1", {
        messageToAppend: {
          content: [{ type: "text", text: "Hello non-streaming" }],
          role: "user",
          additionalContext: mockCombinedContext,
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
      const wrapperWithoutStreaming = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <TamboRegistryProvider components={mockRegistry}>
          <TamboThreadProvider streaming={false}>
            {children}
          </TamboThreadProvider>
        </TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: wrapperWithoutStreaming,
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

      expect(mockThreadsApi.advanceById).toHaveBeenCalledWith("test-thread-1", {
        messageToAppend: {
          content: [{ type: "text", text: "Hello default" }],
          role: "user",
          additionalContext: mockCombinedContext,
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
      // Use wrapper with streaming=true (default) to test that undefined streamResponse respects provider setting
      const wrapperWithDefaultStreaming = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <TamboRegistryProvider components={mockRegistry}>
          <TamboThreadProvider>{children}</TamboThreadProvider>
        </TamboRegistryProvider>
      );

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
        wrapper: wrapperWithDefaultStreaming,
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
            additionalContext: mockCombinedContext,
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
      expect(mockThreadsApi.advanceById).not.toHaveBeenCalled();
    });

    it("should call advance when streamResponse=false for placeholder thread", async () => {
      // Use wrapper with streaming=true to show that explicit streamResponse=false overrides provider setting
      const wrapperWithStreaming = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <TamboRegistryProvider components={mockRegistry}>
          <TamboThreadProvider streaming={true}>{children}</TamboThreadProvider>
        </TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboThread(), {
        wrapper: wrapperWithStreaming,
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
          additionalContext: mockCombinedContext,
        },
        availableComponents: serializeRegistry(mockRegistry),
        contextKey: undefined,
        clientTools: [],
        forceToolChoice: undefined,
        toolCallCounts: {},
      });

      // Should not call advanceById or advanceStream
      expect(mockThreadsApi.advanceById).not.toHaveBeenCalled();
      expect(advanceStream).not.toHaveBeenCalled();
    });

    it("should call advanceStream when streamResponse=true for placeholder thread", async () => {
      // Use wrapper with streaming=false to show that explicit streamResponse=true overrides provider setting
      const wrapperWithoutStreaming = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <TamboRegistryProvider components={mockRegistry}>
          <TamboThreadProvider streaming={false}>
            {children}
          </TamboThreadProvider>
        </TamboRegistryProvider>
      );

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
        wrapper: wrapperWithoutStreaming,
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
            additionalContext: mockCombinedContext,
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
      expect(mockThreadsApi.advanceById).not.toHaveBeenCalled();
    });
  });
});
