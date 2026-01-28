import TamboAI from "@tambo-ai/typescript-sdk";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { useTamboClient } from "../../providers/tambo-client-provider";
import {
  TamboRegistryContext,
  type TamboRegistryContext as TamboRegistryContextType,
} from "../../providers/tambo-registry-provider";
import { TamboV1StreamProvider } from "../providers/tambo-v1-stream-context";
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

  function TestWrapperWithThreadId({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <TamboRegistryContext.Provider value={mockRegistry}>
        <TamboV1StreamProvider threadId="thread_123">
          {children}
        </TamboV1StreamProvider>
      </TamboRegistryContext.Provider>
    );
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

  it("returns undefined thread when no threadId provided", () => {
    const { result } = renderHook(() => useTamboV1(), {
      wrapper: TestWrapper,
    });

    expect(result.current.thread).toBeUndefined();
    expect(result.current.messages).toEqual([]);
  });

  it("returns thread state when threadId provided", () => {
    const { result } = renderHook(() => useTamboV1("thread_123"), {
      wrapper: TestWrapperWithThreadId,
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
    const { result } = renderHook(() => useTamboV1("thread_123"), {
      wrapper: TestWrapperWithThreadId,
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

    // Initially no current thread
    expect(result.current.currentThreadId).toBeNull();
    expect(result.current.thread).toBeUndefined();

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

    expect(newThreadId!).toMatch(/^temp_/);
    expect(result.current.currentThreadId).toBe(newThreadId!);
    expect(result.current.thread).toBeDefined();
  });

  it("uses current thread when no threadId argument provided", () => {
    const { result } = renderHook(() => useTamboV1(), {
      wrapper: TestWrapperWithThreadId,
    });

    // Should use current thread from context (thread_123)
    expect(result.current.currentThreadId).toBe("thread_123");
    expect(result.current.thread?.thread.id).toBe("thread_123");
  });
});
