import { EventType, type RunStartedEvent } from "@ag-ui/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import {
  TamboV1StreamProvider,
  useStreamState,
  useStreamDispatch,
  useThreadManagement,
} from "./tambo-v1-stream-context";

// Mock useTamboClient and useTamboQueryClient to avoid TamboClientProvider dependency
jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(() => ({
    threads: {
      messages: {
        list: jest.fn().mockResolvedValue({ messages: [], hasMore: false }),
      },
      retrieve: jest.fn().mockResolvedValue({}),
    },
  })),
  useTamboQueryClient: jest.fn(),
}));

// Mock useTamboV1Config to avoid TamboV1Provider dependency
jest.mock("./tambo-v1-provider", () => {
  const actual = jest.requireActual("./tambo-v1-provider");
  return {
    ...actual,
    useTamboV1Config: () => ({ userKey: undefined }),
  };
});

// Import for mocking
import { useTamboQueryClient } from "../../providers/tambo-client-provider";

describe("TamboV1StreamProvider", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    // Configure mock to return the test's queryClient
    jest.mocked(useTamboQueryClient).mockReturnValue(queryClient);
  });

  const createWrapper = () => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TamboV1StreamProvider>{children}</TamboV1StreamProvider>
        </QueryClientProvider>
      );
    };
  };
  describe("useStreamState", () => {
    it("throws when used outside provider", () => {
      // Suppress console.error for expected error
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useStreamState());
      }).toThrow("useStreamState must be used within TamboV1StreamProvider");

      consoleSpy.mockRestore();
    });

    it("returns initial state with placeholder thread ready for new messages", () => {
      const { result } = renderHook(() => useStreamState(), {
        wrapper: createWrapper(),
      });

      // Initial state should have placeholder thread ready for optimistic UI
      expect(result.current.currentThreadId).toBe("placeholder");
      expect(result.current.threadMap.placeholder).toBeDefined();
      expect(result.current.threadMap.placeholder.thread.id).toBe(
        "placeholder",
      );
      expect(result.current.threadMap.placeholder.thread.messages).toEqual([]);
      expect(result.current.threadMap.placeholder.streaming.status).toBe(
        "idle",
      );
    });

    it("initializes thread via dispatch", () => {
      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          dispatch: useStreamDispatch(),
        }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.dispatch({
          type: "INIT_THREAD",
          threadId: "thread_123",
        });
      });

      expect(result.current.state.threadMap.thread_123).toBeDefined();
      expect(result.current.state.threadMap.thread_123.thread.id).toBe(
        "thread_123",
      );
      expect(result.current.state.threadMap.thread_123.thread.status).toBe(
        "idle",
      );
      expect(result.current.state.threadMap.thread_123.thread.messages).toEqual(
        [],
      );
    });

    it("initializes thread with initial data via dispatch", () => {
      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          dispatch: useStreamDispatch(),
        }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.dispatch({
          type: "INIT_THREAD",
          threadId: "thread_123",
          initialThread: {
            title: "Test Thread",
            metadata: { key: "value" },
          },
        });
      });

      expect(result.current.state.threadMap.thread_123.thread.title).toBe(
        "Test Thread",
      );
      expect(result.current.state.threadMap.thread_123.thread.metadata).toEqual(
        {
          key: "value",
        },
      );
      // Default values should still be set
      expect(result.current.state.threadMap.thread_123.thread.status).toBe(
        "idle",
      );
    });
  });

  describe("useStreamDispatch", () => {
    it("throws when used outside provider", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useStreamDispatch());
      }).toThrow("useStreamDispatch must be used within TamboV1StreamProvider");

      consoleSpy.mockRestore();
    });

    it("dispatches events to update state", () => {
      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          dispatch: useStreamDispatch(),
        }),
        { wrapper: createWrapper() },
      );

      // Initialize the thread first
      act(() => {
        result.current.dispatch({
          type: "INIT_THREAD",
          threadId: "thread_123",
        });
      });

      const runStartedEvent: RunStartedEvent = {
        type: EventType.RUN_STARTED,
        runId: "run_1",
        threadId: "thread_123",
      };

      act(() => {
        result.current.dispatch({
          type: "EVENT",
          event: runStartedEvent,
          threadId: "thread_123",
        });
      });

      expect(result.current.state.threadMap.thread_123.thread.status).toBe(
        "streaming",
      );
      expect(result.current.state.threadMap.thread_123.streaming.status).toBe(
        "streaming",
      );
      expect(result.current.state.threadMap.thread_123.streaming.runId).toBe(
        "run_1",
      );
    });
  });

  describe("useThreadManagement", () => {
    it("throws when used outside provider", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useThreadManagement());
      }).toThrow(
        "useThreadManagement must be used within TamboV1StreamProvider",
      );

      consoleSpy.mockRestore();
    });

    it("initThread creates a new thread", () => {
      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          management: useThreadManagement(),
        }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.management.initThread("thread_456");
      });

      expect(result.current.state.threadMap.thread_456).toBeDefined();
      expect(result.current.state.threadMap.thread_456.thread.id).toBe(
        "thread_456",
      );
    });

    it("switchThread changes currentThreadId", () => {
      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          management: useThreadManagement(),
        }),
        { wrapper: createWrapper() },
      );

      // Initialize and switch to a thread
      act(() => {
        result.current.management.initThread("thread_789");
        result.current.management.switchThread("thread_789");
      });

      expect(result.current.state.currentThreadId).toBe("thread_789");
    });

    it("startNewThread creates temp thread and switches to it", () => {
      const { result } = renderHook(
        () => ({
          state: useStreamState(),
          management: useThreadManagement(),
        }),
        { wrapper: createWrapper() },
      );

      let tempId: string;
      act(() => {
        tempId = result.current.management.startNewThread();
      });

      expect(tempId!).toBe("placeholder");
      expect(result.current.state.currentThreadId).toBe("placeholder");
      expect(result.current.state.threadMap.placeholder).toBeDefined();
    });
  });
});
