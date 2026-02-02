import TamboAI from "@tambo-ai/typescript-sdk";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { useTamboClient } from "../../providers/tambo-client-provider";
import {
  TamboRegistryContext,
  type TamboRegistryContext as TamboRegistryContextType,
} from "../../providers/tambo-registry-provider";
import { TamboV1StreamProvider } from "../providers/tambo-v1-stream-context";
import type { StreamState, StreamAction } from "../utils/event-accumulator";
import type { V1ComponentContent } from "../types/message";
import { useTamboV1 } from "./use-tambo-v1";

jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
}));

describe("useTamboV1", () => {
  const mockTamboClient = {
    apiKey: "",
    threads: {},
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
      <TamboRegistryContext.Provider value={mockRegistry}>
        <TamboV1StreamProvider>{children}</TamboV1StreamProvider>
      </TamboRegistryContext.Provider>
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
        <TamboRegistryContext.Provider value={registry}>
          <TamboV1StreamProvider state={state} dispatch={noopDispatch}>
            {children}
          </TamboV1StreamProvider>
        </TamboRegistryContext.Provider>
      );
    };
  }

  beforeEach(() => {
    jest.mocked(useTamboClient).mockReturnValue(mockTamboClient);
    jest.clearAllMocks();
  });

  it("returns client from useTamboClient", () => {
    const { result } = renderHook(() => useTamboV1(), {
      wrapper: TestWrapper,
    });

    expect(result.current.client).toBe(mockTamboClient);
  });

  it("returns registry functions", () => {
    const { result } = renderHook(() => useTamboV1(), {
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
    const { result } = renderHook(() => useTamboV1(), {
      wrapper: TestWrapper,
    });

    // Default state has placeholder thread for optimistic UI
    expect(result.current.thread).toBeDefined();
    expect(result.current.thread?.thread.id).toBe("placeholder");
    expect(result.current.messages).toEqual([]);
  });

  it("returns thread state when switched to a thread", () => {
    const { result } = renderHook(() => useTamboV1(), {
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
    const { result } = renderHook(() => useTamboV1(), {
      wrapper: TestWrapper,
    });

    expect(result.current.streamingState).toEqual({ status: "idle" });
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isWaiting).toBe(false);
  });

  it("returns thread streaming state when thread loaded", () => {
    const { result } = renderHook(() => useTamboV1(), {
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
    const { result } = renderHook(() => useTamboV1(), {
      wrapper: TestWrapper,
    });

    expect(typeof result.current.dispatch).toBe("function");
  });

  it("provides thread management functions", () => {
    const { result } = renderHook(() => useTamboV1(), {
      wrapper: TestWrapper,
    });

    expect(typeof result.current.initThread).toBe("function");
    expect(typeof result.current.switchThread).toBe("function");
    expect(typeof result.current.startNewThread).toBe("function");
  });

  it("initializes and switches threads", () => {
    const { result } = renderHook(() => useTamboV1(), {
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
    const { result } = renderHook(() => useTamboV1(), {
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
    const { result } = renderHook(() => useTamboV1(), {
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
    ): V1ComponentContent => ({
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
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTamboV1(), {
        wrapper: createWrapperWithState(state),
      });

      expect(result.current.messages).toHaveLength(1);
      const content = result.current.messages[0].content[0];
      expect(content.type).toBe("component");
      expect((content as V1ComponentContent).renderedComponent).toBeDefined();
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
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTamboV1(), {
        wrapper: createWrapperWithState(state),
      });

      expect(result.current.messages).toHaveLength(1);
      const textContent = result.current.messages[0].content[0];
      expect(textContent.type).toBe("text");
      expect(textContent).toEqual({ type: "text", text: "Hello world" });

      const componentContent = result.current.messages[0].content[1];
      expect(componentContent.type).toBe("component");
      expect(
        (componentContent as V1ComponentContent).renderedComponent,
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
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result, rerender } = renderHook(() => useTamboV1(), {
        wrapper: createWrapperWithState(state),
      });

      const firstRender = (
        result.current.messages[0].content[0] as V1ComponentContent
      ).renderedComponent;

      // Re-render with same state
      rerender();

      const secondRender = (
        result.current.messages[0].content[0] as V1ComponentContent
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
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTamboV1(), {
        wrapper: createWrapperWithState(state),
      });

      const content = result.current.messages[0].content[0];
      expect(content.type).toBe("component");
      expect((content as V1ComponentContent).renderedComponent).toBeDefined();
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
                    } as V1ComponentContent,
                  ],
                  createdAt: new Date().toISOString(),
                },
              ],
              status: "idle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTamboV1(), {
        wrapper: createWrapperWithState(state),
      });

      const content = result.current.messages[0].content[0];
      expect(content.type).toBe("component");
      expect((content as V1ComponentContent).renderedComponent).toBeDefined();
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
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "thread_123",
      };

      const { result } = renderHook(() => useTamboV1(), {
        wrapper: createWrapperWithState(state),
      });

      expect(result.current.messages[0].content).toHaveLength(3);
      result.current.messages[0].content.forEach((content) => {
        expect(content.type).toBe("component");
        expect((content as V1ComponentContent).renderedComponent).toBeDefined();
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
            },
            streaming: { status: "idle" },
            accumulatingToolArgs: new Map(),
          },
        },
        currentThreadId: "placeholder",
      };

      // No explicit threadId - uses currentThreadId from state
      const { result } = renderHook(() => useTamboV1(), {
        wrapper: createWrapperWithState(state),
      });

      // Component should render using the placeholder thread
      const content = result.current.messages[0].content[0];
      expect(content.type).toBe("component");
      expect((content as V1ComponentContent).renderedComponent).toBeDefined();
    });
  });
});
