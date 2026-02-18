import TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import React, { useReducer } from "react";
import { useTamboClient } from "../../providers/tambo-client-provider";
import {
  TamboRegistryContext,
  type TamboRegistryContext as TamboRegistryContextType,
} from "../../providers/tambo-registry-provider";
import { TamboStreamProvider } from "../providers/tambo-v1-stream-context";
import {
  streamReducer,
  type StreamState,
  type StreamAction,
} from "../utils/event-accumulator";
import type {
  TamboComponentContent,
  TamboToolUseContent,
} from "../types/message";
import { useTambo } from "./use-tambo-v1";

jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
  useTamboQueryClient: jest.fn(),
}));

jest.mock("../providers/tambo-v1-provider", () => {
  const actual = jest.requireActual("../providers/tambo-v1-provider");
  return {
    ...actual,
    useTamboConfig: () => ({ userKey: undefined }),
  };
});

jest.mock("./use-tambo-v1-auth-state", () => ({
  useTamboAuthState: () => ({
    status: "identified",
    source: "userKey",
  }),
}));

import { useTamboQueryClient } from "../../providers/tambo-client-provider";

describe("useTambo", () => {
  let queryClient: QueryClient;

  const mockTamboClient = {
    apiKey: "",
    threads: {
      messages: {
        list: jest.fn().mockResolvedValue({ messages: [], hasMore: false }),
      },
      runs: {
        delete: jest.fn().mockResolvedValue({}),
      },
    },
  } as unknown as TamboAI;

  const mockRegistry: TamboRegistryContextType = {
    componentList: {},
    toolRegistry: {},
    componentToolAssociations: {},
    mcpServerInfos: [],
    resources: [],
    resourceSource: null,
    registerComponent: jest.fn(),
    registerTool: jest.fn(),
    registerTools: jest.fn(),
    addToolAssociation: jest.fn(),
    registerMcpServer: jest.fn(),
    registerMcpServers: jest.fn(),
    registerResource: jest.fn(),
    registerResources: jest.fn(),
    registerResourceSource: jest.fn(),
  };

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TamboRegistryContext.Provider value={mockRegistry}>
          <TamboStreamProvider>{children}</TamboStreamProvider>
        </TamboRegistryContext.Provider>
      </QueryClientProvider>
    );
  }

  function createWrapperWithState(
    state: StreamState,
    registry: TamboRegistryContextType = mockRegistry,
  ) {
    const noopDispatch: React.Dispatch<StreamAction> = () => {};
    return function WrapperWithState({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TamboRegistryContext.Provider value={registry}>
            <TamboStreamProvider state={state} dispatch={noopDispatch}>
              {children}
            </TamboStreamProvider>
          </TamboRegistryContext.Provider>
        </QueryClientProvider>
      );
    };
  }

  // Wrapper that uses the real reducer so state updates properly
  function createWrapperWithRealReducer(
    initialState: StreamState,
    stateRef?: React.MutableRefObject<StreamState | undefined>,
  ) {
    return function WrapperWithRealReducer({
      children,
    }: {
      children: React.ReactNode;
    }) {
      const [state, dispatch] = useReducer(streamReducer, initialState);
      if (stateRef) {
        stateRef.current = state;
      }
      return (
        <QueryClientProvider client={queryClient}>
          <TamboRegistryContext.Provider value={mockRegistry}>
            <TamboStreamProvider state={state} dispatch={dispatch}>
              {children}
            </TamboStreamProvider>
          </TamboRegistryContext.Provider>
        </QueryClientProvider>
      );
    };
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.mocked(useTamboClient).mockReturnValue(mockTamboClient);
    jest.mocked(useTamboQueryClient).mockReturnValue(queryClient);
    jest.clearAllMocks();
    delete (mockTamboClient.threads as any).update;
  });

  it("returns client from useTamboClient", () => {
    const { result } = renderHook(() => useTambo(), {
      wrapper: TestWrapper,
    });

    expect(result.current.client).toBe(mockTamboClient);
  });

  it("returns registry functions", () => {
    const { result } = renderHook(() => useTambo(), {
      wrapper: TestWrapper,
    });

    expect(result.current.registerComponent).toBe(
      mockRegistry.registerComponent,
    );
    expect(result.current.registerTool).toBe(mockRegistry.registerTool);
    expect(result.current.registerTools).toBe(mockRegistry.registerTools);
    expect(result.current.componentList).toBe(mockRegistry.componentList);
    expect(result.current.toolRegistry).toBe(mockRegistry.toolRegistry);
  });

  it("returns placeholder thread when no threadId provided", () => {
    const { result } = renderHook(() => useTambo(), {
      wrapper: TestWrapper,
    });

    // Default state has placeholder thread for optimistic UI
    expect(result.current.thread).toBeDefined();
    expect(result.current.thread?.thread.id).toBe("placeholder");
    expect(result.current.messages).toEqual([]);
  });

  it("returns thread state when switched to a thread", () => {
    const { result } = renderHook(() => useTambo(), {
      wrapper: TestWrapper,
    });

    // Initialize and switch to thread
    act(() => {
      result.current.initThread("thread_123");
      result.current.switchThread("thread_123");
    });

    expect(result.current.thread).toBeDefined();
    expect(result.current.thread?.thread.id).toBe("thread_123");
    expect(result.current.messages).toEqual([]);
  });

  it("returns default streaming state when thread not loaded", () => {
    const { result } = renderHook(() => useTambo(), {
      wrapper: TestWrapper,
    });

    expect(result.current.streamingState).toEqual({ status: "idle" });
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isWaiting).toBe(false);
  });

  it("returns thread streaming state when thread loaded", () => {
    const { result } = renderHook(() => useTambo(), {
      wrapper: TestWrapper,
    });

    // Initialize and switch to thread
    act(() => {
      result.current.initThread("thread_123");
      result.current.switchThread("thread_123");
    });

    expect(result.current.streamingState.status).toBe("idle");
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isWaiting).toBe(false);
  });

  it("provides dispatch function for advanced usage", () => {
    const { result } = renderHook(() => useTambo(), {
      wrapper: TestWrapper,
    });

    expect(typeof result.current.dispatch).toBe("function");
  });

  it("provides thread management functions", () => {
    const { result } = renderHook(() => useTambo(), {
      wrapper: TestWrapper,
    });

    expect(typeof result.current.initThread).toBe("function");
    expect(typeof result.current.switchThread).toBe("function");
    expect(typeof result.current.startNewThread).toBe("function");
  });

  it("initializes and switches threads", () => {
    const { result } = renderHook(() => useTambo(), {
      wrapper: TestWrapper,
    });

    // Initially has placeholder thread for optimistic UI
    expect(result.current.currentThreadId).toBe("placeholder");
    expect(result.current.thread).toBeDefined();
    expect(result.current.thread?.thread.id).toBe("placeholder");

    // Initialize a new thread
    act(() => {
      result.current.initThread("new_thread_1");
    });

    // Switch to the new thread
    act(() => {
      result.current.switchThread("new_thread_1");
    });

    expect(result.current.currentThreadId).toBe("new_thread_1");
  });

  it("starts new thread with generated ID", () => {
    const { result } = renderHook(() => useTambo(), {
      wrapper: TestWrapper,
    });

    let newThreadId: string;
    act(() => {
      newThreadId = result.current.startNewThread();
    });

    expect(newThreadId!).toBe("placeholder");
    expect(result.current.currentThreadId).toBe(newThreadId!);
    expect(result.current.thread).toBeDefined();
  });

  it("uses current thread when no threadId argument provided", () => {
    const { result } = renderHook(() => useTambo(), {
      wrapper: TestWrapper,
    });

    // Initialize and switch to a thread
    act(() => {
      result.current.initThread("thread_123");
      result.current.switchThread("thread_123");
    });

    // Should use current thread from context (thread_123)
    expect(result.current.currentThreadId).toBe("thread_123");
    expect(result.current.thread?.thread.id).toBe("thread_123");
  });

  describe("component content transformation", () => {
    const createComponentContent = (
      id: string,
      name: string,
      props: Record<string, unknown>,
    ): TamboComponentContent => ({
      type: "component",
      id,
      name,
      props,
      streamingState: "done",
    });

    it("adds renderedComponent to component content blocks", () => {
      const state: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [
                {
                  id: "msg_1",
                  role: "assistant",
                  content: [
                    createComponentContent("comp_1", "TestComponent", {
                      title: "Hello",
                    }),
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithState(state),
      });

      expect(result.current.messages).toHaveLength(1);
      const content = result.current.messages[0].content[0];
      expect(content.type).toBe("component");
      expect(
        (content as TamboComponentContent).renderedComponent,
      ).toBeDefined();
    });

    it("preserves non-component content blocks unchanged", () => {
      const state: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [
                {
                  id: "msg_1",
                  role: "assistant",
                  content: [
                    { type: "text", text: "Hello world" },
                    createComponentContent("comp_1", "TestComponent", {
                      title: "Hi",
                    }),
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithState(state),
      });

      expect(result.current.messages).toHaveLength(1);
      const textContent = result.current.messages[0].content[0];
      expect(textContent.type).toBe("text");
      expect(textContent).toEqual({ type: "text", text: "Hello world" });

      const componentContent = result.current.messages[0].content[1];
      expect(componentContent.type).toBe("component");
      expect(
        (componentContent as TamboComponentContent).renderedComponent,
      ).toBeDefined();
    });

    it("caches rendered components and returns same reference when props unchanged", () => {
      const state: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [
                {
                  id: "msg_1",
                  role: "assistant",
                  content: [
                    createComponentContent("comp_1", "TestComponent", {
                      title: "Hello",
                    }),
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result, rerender } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithState(state),
      });

      const firstRender = (
        result.current.messages[0].content[0] as TamboComponentContent
      ).renderedComponent;

      // Re-render with same state
      rerender();

      const secondRender = (
        result.current.messages[0].content[0] as TamboComponentContent
      ).renderedComponent;

      // Should return the same cached element reference
      expect(secondRender).toBe(firstRender);
    });

    it("handles empty props on components", () => {
      const state: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [
                {
                  id: "msg_1",
                  role: "assistant",
                  content: [
                    createComponentContent("comp_1", "TestComponent", {}),
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithState(state),
      });

      const content = result.current.messages[0].content[0];
      expect(content.type).toBe("component");
      expect(
        (content as TamboComponentContent).renderedComponent,
      ).toBeDefined();
    });

    it("handles undefined props on components", () => {
      const state: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [
                {
                  id: "msg_1",
                  role: "assistant",
                  content: [
                    {
                      type: "component",
                      id: "comp_1",
                      name: "TestComponent",
                      props: undefined,
                      streamingState: "done",
                    } as TamboComponentContent,
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithState(state),
      });

      const content = result.current.messages[0].content[0];
      expect(content.type).toBe("component");
      expect(
        (content as TamboComponentContent).renderedComponent,
      ).toBeDefined();
    });

    it("handles multiple component content blocks in same message", () => {
      const state: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [
                {
                  id: "msg_1",
                  role: "assistant",
                  content: [
                    createComponentContent("comp_1", "ComponentA", {
                      value: 1,
                    }),
                    createComponentContent("comp_2", "ComponentB", {
                      value: 2,
                    }),
                    createComponentContent("comp_3", "ComponentC", {
                      value: 3,
                    }),
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithState(state),
      });

      expect(result.current.messages[0].content).toHaveLength(3);
      result.current.messages[0].content.forEach((content) => {
        expect(content.type).toBe("component");
        expect(
          (content as TamboComponentContent).renderedComponent,
        ).toBeDefined();
      });
    });

    it("uses currentThreadId from stream state", () => {
      const state: StreamState = {
        threadMap: {
          placeholder: {
            thread: {
              id: "placeholder",
              messages: [
                {
                  id: "msg_1",
                  role: "assistant",
                  content: [
                    createComponentContent("comp_1", "TestComponent", {
                      title: "Hello",
                    }),
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "placeholder",
      };

      // No explicit threadId - uses currentThreadId from state
      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithState(state),
      });

      // Component should render using the placeholder thread
      const content = result.current.messages[0].content[0];
      expect(content.type).toBe("component");
      expect(
        (content as TamboComponentContent).renderedComponent,
      ).toBeDefined();
    });
  });

  describe("tool_use content transformation", () => {
    it("adds computed properties to tool_use content", () => {
      const state: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [
                {
                  id: "msg_1",
                  role: "assistant",
                  content: [
                    {
                      type: "tool_use",
                      id: "tool_1",
                      name: "getWeather",
                      input: { location: "NYC" },
                    },
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithState(state),
      });

      const content = result.current.messages[0]
        .content[0] as TamboToolUseContent;
      expect(content.type).toBe("tool_use");
      expect(content.hasCompleted).toBe(false);
      expect(content.statusMessage).toBe("Calling getWeather");
      expect(content.tamboDisplayProps).toBeDefined();
    });

    it("sets hasCompleted to true when matching tool_result exists", () => {
      const state: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [
                {
                  id: "msg_1",
                  role: "assistant",
                  content: [
                    {
                      type: "tool_use",
                      id: "tool_1",
                      name: "getWeather",
                      input: { location: "NYC" },
                    },
                  ],
                  createdAt: new Date().toISOString(),
                },
                {
                  id: "msg_2",
                  role: "user",
                  content: [
                    {
                      type: "tool_result",
                      toolUseId: "tool_1",
                      content: [{ type: "text", text: "Sunny" }],
                    },
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithState(state),
      });

      const content = result.current.messages[0]
        .content[0] as TamboToolUseContent;
      expect(content.hasCompleted).toBe(true);
      expect(content.statusMessage).toBe("Called getWeather");
    });

    it("uses _tambo_statusMessage when tool is in progress", () => {
      const state: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [
                {
                  id: "msg_1",
                  role: "assistant",
                  content: [
                    {
                      type: "tool_use",
                      id: "tool_1",
                      name: "getWeather",
                      input: {
                        location: "NYC",
                        _tambo_statusMessage: "Fetching weather for NYC...",
                      },
                    },
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithState(state),
      });

      const content = result.current.messages[0]
        .content[0] as TamboToolUseContent;
      expect(content.statusMessage).toBe("Fetching weather for NYC...");
      expect(content.tamboDisplayProps?._tambo_statusMessage).toBe(
        "Fetching weather for NYC...",
      );
    });

    it("uses _tambo_completionStatusMessage when tool is completed", () => {
      const state: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [
                {
                  id: "msg_1",
                  role: "assistant",
                  content: [
                    {
                      type: "tool_use",
                      id: "tool_1",
                      name: "getWeather",
                      input: {
                        location: "NYC",
                        _tambo_statusMessage: "Fetching weather...",
                        _tambo_completionStatusMessage: "Got weather for NYC",
                      },
                    },
                  ],
                  createdAt: new Date().toISOString(),
                },
                {
                  id: "msg_2",
                  role: "user",
                  content: [
                    {
                      type: "tool_result",
                      toolUseId: "tool_1",
                      content: [{ type: "text", text: "Sunny" }],
                    },
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithState(state),
      });

      const content = result.current.messages[0]
        .content[0] as TamboToolUseContent;
      expect(content.hasCompleted).toBe(true);
      expect(content.statusMessage).toBe("Got weather for NYC");
    });

    it("filters _tambo_* properties from input", () => {
      const state: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [
                {
                  id: "msg_1",
                  role: "assistant",
                  content: [
                    {
                      type: "tool_use",
                      id: "tool_1",
                      name: "getWeather",
                      input: {
                        location: "NYC",
                        units: "celsius",
                        _tambo_statusMessage: "Fetching...",
                        _tambo_completionStatusMessage: "Done",
                      },
                    },
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithState(state),
      });

      const content = result.current.messages[0]
        .content[0] as TamboToolUseContent;
      // Input should only have non-_tambo_ properties
      expect(content.input).toEqual({ location: "NYC", units: "celsius" });
      expect(content.input._tambo_statusMessage).toBeUndefined();
      expect(content.input._tambo_completionStatusMessage).toBeUndefined();
    });

    it("handles tool_use with empty input", () => {
      const state: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [
                {
                  id: "msg_1",
                  role: "assistant",
                  content: [
                    {
                      type: "tool_use",
                      id: "tool_1",
                      name: "getCurrentTime",
                      input: {},
                    },
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithState(state),
      });

      const content = result.current.messages[0]
        .content[0] as TamboToolUseContent;
      expect(content.input).toEqual({});
      expect(content.hasCompleted).toBe(false);
      expect(content.statusMessage).toBe("Calling getCurrentTime");
    });

    it("handles tool_use with undefined input", () => {
      const state: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [
                {
                  id: "msg_1",
                  role: "assistant",
                  content: [
                    {
                      type: "tool_use",
                      id: "tool_1",
                      name: "getCurrentTime",
                      input: undefined,
                    } as unknown as TamboToolUseContent,
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithState(state),
      });

      const content = result.current.messages[0]
        .content[0] as TamboToolUseContent;
      expect(content.input).toEqual({});
      expect(content.hasCompleted).toBe(false);
    });

    it("handles multiple tool_use blocks with different completion states", () => {
      const state: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [
                {
                  id: "msg_1",
                  role: "assistant",
                  content: [
                    {
                      type: "tool_use",
                      id: "tool_1",
                      name: "getWeather",
                      input: { location: "NYC" },
                    },
                    {
                      type: "tool_use",
                      id: "tool_2",
                      name: "getTime",
                      input: { timezone: "EST" },
                    },
                  ],
                  createdAt: new Date().toISOString(),
                },
                {
                  id: "msg_2",
                  role: "user",
                  content: [
                    {
                      type: "tool_result",
                      toolUseId: "tool_1",
                      content: [{ type: "text", text: "Sunny" }],
                    },
                    // tool_2 has no result yet
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithState(state),
      });

      const tool1 = result.current.messages[0]
        .content[0] as TamboToolUseContent;
      const tool2 = result.current.messages[0]
        .content[1] as TamboToolUseContent;

      expect(tool1.hasCompleted).toBe(true);
      expect(tool1.statusMessage).toBe("Called getWeather");

      expect(tool2.hasCompleted).toBe(false);
      expect(tool2.statusMessage).toBe("Calling getTime");
    });
  });

  describe("cancelRun", () => {
    it("sets thread to idle and lastRunCancelled to true when cancelled", async () => {
      const initialState: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [],
              status: "streaming",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "streaming", runId: "run_456" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithRealReducer(initialState),
      });

      // Before cancel: streaming and lastRunCancelled is false
      expect(result.current.isStreaming).toBe(true);
      expect(result.current.isIdle).toBe(false);
      expect(result.current.thread?.thread.lastRunCancelled).toBe(false);

      await act(async () => {
        await result.current.cancelRun();
      });

      // After cancel: idle and lastRunCancelled is true
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.isIdle).toBe(true);
      expect(result.current.thread?.thread.lastRunCancelled).toBe(true);

      // Verify API was called to cancel the run
      expect(mockTamboClient.threads.runs.delete).toHaveBeenCalledWith(
        "run_456",
        { threadId: "thread_123" },
      );
    });

    it("is a no-op when there is no active run", async () => {
      const initialState: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "idle" }, // No runId
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithRealReducer(initialState),
      });

      // Idle before
      expect(result.current.isIdle).toBe(true);
      expect(result.current.thread?.thread.lastRunCancelled).toBe(false);

      await act(async () => {
        await result.current.cancelRun();
      });

      // Still idle, lastRunCancelled unchanged
      expect(result.current.isIdle).toBe(true);
      expect(result.current.thread?.thread.lastRunCancelled).toBe(false);

      // API should not have been called
      expect(mockTamboClient.threads.runs.delete).not.toHaveBeenCalled();
    });

    it("is a no-op when on a placeholder thread", async () => {
      const initialState: StreamState = {
        threadMap: {
          placeholder: {
            thread: {
              id: "placeholder",
              messages: [],
              status: "streaming",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "streaming", runId: "run_123" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "placeholder",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithRealReducer(initialState),
      });

      // Before: streaming on placeholder
      expect(result.current.isStreaming).toBe(true);
      expect(result.current.thread?.thread.lastRunCancelled).toBe(false);

      await act(async () => {
        await result.current.cancelRun();
      });

      // After: state should be unchanged (placeholder threads are skipped)
      expect(result.current.isStreaming).toBe(true);
      expect(result.current.thread?.thread.lastRunCancelled).toBe(false);

      // API should not have been called for placeholder threads
      expect(mockTamboClient.threads.runs.delete).not.toHaveBeenCalled();
    });

    it("still updates local state even if API call fails", async () => {
      const consoleWarnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      // Make the API call fail
      jest
        .mocked(mockTamboClient.threads.runs.delete)
        .mockRejectedValueOnce(new Error("Network error"));

      const initialState: StreamState = {
        threadMap: {
          thread_123: {
            thread: {
              id: "thread_123",
              messages: [],
              status: "streaming",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
            },
            streaming: { status: "streaming", runId: "run_456" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithRealReducer(initialState),
      });

      await act(async () => {
        await result.current.cancelRun();
      });

      // Local state should still be updated (optimistic update)
      expect(result.current.isIdle).toBe(true);
      expect(result.current.thread?.thread.lastRunCancelled).toBe(true);

      // Warning should have been logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to cancel run on server:",
        expect.any(Error),
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("updateThreadName", () => {
    it("updates local thread name and invalidates caches on success", async () => {
      const mockUpdate = jest.fn().mockResolvedValue({});
      // TypeScript SDK will be updated to include this method
      (mockTamboClient.threads as any).update = mockUpdate;

      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const initialState: StreamState = {
        threadMap: {
          thread_456: {
            thread: {
              id: "thread_456",
              messages: [],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
              name: "Old Name",
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_456",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithRealReducer(initialState),
      });

      await act(async () => {
        await result.current.updateThreadName("thread_456", "My New Thread");
      });

      expect(mockUpdate).toHaveBeenCalledWith("thread_456", {
        name: "My New Thread",
        userKey: undefined,
      });

      expect(result.current.thread?.thread.name).toBe("My New Thread");
      const invalidatedKeys = invalidateQueriesSpy.mock.calls
        .map(([arg]) => (arg as any).queryKey)
        .filter(Boolean);
      expect(invalidatedKeys).toContainEqual(["v1-threads", "list"]);
      expect(invalidatedKeys).toContainEqual(["v1-threads", "thread_456"]);
    });

    it("does not create local thread state when thread isn't loaded", async () => {
      const mockUpdate = jest.fn().mockResolvedValue({});
      // TypeScript SDK will be updated to include this method
      (mockTamboClient.threads as any).update = mockUpdate;

      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      // Track the internal StreamState from the real reducer so we can assert we
      // don't create a local thread entry for threads that haven't been loaded.
      const stateRef: React.MutableRefObject<StreamState | undefined> = {
        current: undefined,
      };
      const initialState: StreamState = {
        threadMap: {},
        currentThreadId: "placeholder",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithRealReducer(initialState, stateRef),
      });

      await act(async () => {
        await result.current.updateThreadName("thread_789", "New Title");
      });

      expect(mockUpdate).toHaveBeenCalledWith("thread_789", {
        name: "New Title",
        userKey: undefined,
      });
      const invalidatedKeys = invalidateQueriesSpy.mock.calls
        .map(([arg]) => (arg as any).queryKey)
        .filter(Boolean);
      expect(invalidatedKeys).toContainEqual(["v1-threads", "list"]);
      expect(invalidatedKeys).toContainEqual(["v1-threads", "thread_789"]);

      expect(stateRef.current?.threadMap.thread_789).toBeUndefined();

      act(() => {
        result.current.switchThread("thread_789");
      });

      expect(result.current.thread).toBeUndefined();
    });

    it("propagates errors and does not update local state", async () => {
      const mockUpdate = jest
        .fn()
        .mockRejectedValue(new Error("Network error"));
      // TypeScript SDK will be updated to include this method
      (mockTamboClient.threads as any).update = mockUpdate;

      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const initialState: StreamState = {
        threadMap: {
          thread_456: {
            thread: {
              id: "thread_456",
              messages: [],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastRunCancelled: false,
              name: "Old Name",
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_456",
      };

      const { result } = renderHook(() => useTambo(), {
        wrapper: createWrapperWithRealReducer(initialState),
      });

      let caughtError: unknown;
      await act(async () => {
        try {
          await result.current.updateThreadName("thread_456", "My New Thread");
        } catch (error) {
          caughtError = error;
        }
      });

      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toBe("Network error");
      expect(result.current.thread?.thread.name).toBe("Old Name");
      expect(invalidateQueriesSpy).not.toHaveBeenCalled();
    });
  });
});
