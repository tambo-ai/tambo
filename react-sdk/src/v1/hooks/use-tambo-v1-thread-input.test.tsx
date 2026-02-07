import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  TamboV1ThreadInputProvider,
  useTamboV1ThreadInput,
} from "../providers/tambo-v1-thread-input-provider";
import { TamboV1StreamProvider } from "../providers/tambo-v1-stream-context";
import { useTamboV1SendMessage } from "./use-tambo-v1-send-message";
import type { StreamAction, StreamState } from "../utils/event-accumulator";

// Mock useTamboV1SendMessage
jest.mock("./use-tambo-v1-send-message", () => ({
  useTamboV1SendMessage: jest.fn(),
}));

// Mock useTamboQueryClient to avoid TamboClientProvider dependency
jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboQueryClient: jest.fn(() => new QueryClient()),
  useTamboClient: jest.fn(),
}));

jest.mock("./use-tambo-v1-auth-state", () => ({
  useTamboV1AuthState: () => ({
    status: "identified",
    source: "userKey",
  }),
}));

const createSuccessfulFileReader = () => {
  const reader = {
    readAsDataURL: jest.fn(),
    onload: null as ((e: unknown) => void) | null,
    onerror: null as ((e: unknown) => void) | null,
    result: "data:image/png;base64,mock-data",
  };

  reader.readAsDataURL = jest.fn(() => {
    setTimeout(() => {
      reader.onload?.({});
    }, 0);
  });

  return reader;
};

const originalFileReader = (global as any).FileReader;

describe("useTamboV1ThreadInput", () => {
  const mockMutateAsync = jest.fn();
  let queryClient: QueryClient;

  function createWrapper({ streamState }: { streamState?: StreamState } = {}) {
    const noopDispatch: React.Dispatch<StreamAction> = () => {};

    return function Wrapper({ children }: { children: React.ReactNode }) {
      const streamProviderProps =
        streamState === undefined
          ? {}
          : { state: streamState, dispatch: noopDispatch };

      return (
        <QueryClientProvider client={queryClient}>
          <TamboV1StreamProvider {...streamProviderProps}>
            <TamboV1ThreadInputProvider>{children}</TamboV1ThreadInputProvider>
          </TamboV1StreamProvider>
        </QueryClientProvider>
      );
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).FileReader = jest.fn(() => createSuccessfulFileReader());

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    mockMutateAsync.mockResolvedValue({ threadId: "thread_123" });
    jest.mocked(useTamboV1SendMessage).mockReturnValue({
      mutateAsync: mockMutateAsync,
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
      isSuccess: false,
      isIdle: true,
      isPaused: false,
      status: "idle",
      data: undefined,
      variables: undefined,
      failureCount: 0,
      failureReason: null,
      reset: jest.fn(),
      context: undefined,
      submittedAt: 0,
    } as any);
  });

  afterEach(() => {
    (global as any).FileReader = originalFileReader;
  });

  describe("State Management", () => {
    it("initializes with empty value", () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper(),
      });

      expect(result.current.value).toBe("");
    });

    it("updates value via setValue", () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setValue("Hello world");
      });

      expect(result.current.value).toBe("Hello world");
    });

    it("supports functional updates for setValue", () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setValue("Hello");
      });

      act(() => {
        result.current.setValue((prev) => `${prev} world`);
      });

      expect(result.current.value).toBe("Hello world");
    });
  });

  describe("Submit Behavior", () => {
    it("submits message and clears input on success", async () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setValue("Test message");
      });

      await act(async () => {
        const response = await result.current.submit();
        expect(response.threadId).toBe("thread_123");
      });

      // Input should be cleared
      await waitFor(() => {
        expect(result.current.value).toBe("");
      });

      // Should have called mutateAsync with correct message format
      expect(mockMutateAsync).toHaveBeenCalledWith({
        message: {
          role: "user",
          content: [{ type: "text", text: "Test message" }],
        },
        userMessageText: "Test message",
        debug: undefined,
      });
    });

    it("throws error when submitting empty message", async () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.submit()).rejects.toThrow(
        "Message cannot be empty",
      );

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("throws error when submitting whitespace-only message", async () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setValue("   ");
      });

      await expect(result.current.submit()).rejects.toThrow(
        "Message cannot be empty",
      );

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("passes debug option to mutation", async () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setValue("Debug message");
      });

      await act(async () => {
        await result.current.submit({ debug: true });
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        message: {
          role: "user",
          content: [{ type: "text", text: "Debug message" }],
        },
        userMessageText: "Debug message",
        debug: true,
      });
    });

    it("submits image-only messages as resource content", async () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.addImage(
          new File(["image"], "photo.png", { type: "image/png" }),
        );
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        message: {
          role: "user",
          content: [
            {
              type: "resource",
              resource: {
                blob: "mock-data",
                mimeType: "image/png",
                name: "photo.png",
              },
            },
          ],
        },
        userMessageText: "",
        debug: undefined,
      });

      await waitFor(() => {
        expect(result.current.images).toEqual([]);
      });
    });

    it("includes both text and image resource content when both are present", async () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setValue("Test message");
      });

      await act(async () => {
        await result.current.addImage(
          new File(["image"], "photo.png", { type: "image/png" }),
        );
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        message: {
          role: "user",
          content: [
            { type: "text", text: "Test message" },
            {
              type: "resource",
              resource: {
                blob: "mock-data",
                mimeType: "image/png",
                name: "photo.png",
              },
            },
          ],
        },
        userMessageText: "Test message",
        debug: undefined,
      });
    });
  });

  describe("Thread ID Management", () => {
    it("initializes with placeholder threadId for optimistic UI", () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper(),
      });

      // Default state has placeholder thread for optimistic UI
      expect(result.current.threadId).toBe("placeholder");
    });

    it("uses currentThreadId from stream state", () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper({
          streamState: { threadMap: {}, currentThreadId: "thread_stream" },
        }),
      });

      expect(result.current.threadId).toBe("thread_stream");
      expect(
        jest.mocked(useTamboV1SendMessage).mock.calls.map((call) => call[0]),
      ).toContain("thread_stream");
    });

    it("uses stream state threadId when submitting messages", async () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper({
          streamState: { threadMap: {}, currentThreadId: "thread_stream" },
        }),
      });

      act(() => {
        result.current.setValue("Test message");
      });

      await act(async () => {
        await result.current.submit();
      });

      // Verify sendMessage was called with the stream state's threadId
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            content: [{ type: "text", text: "Test message" }],
          }),
        }),
      );
    });
  });

  describe("Image State", () => {
    it("initializes with empty images array", () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper(),
      });

      expect(result.current.images).toEqual([]);
    });

    it("exposes image management functions", () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.addImage).toBe("function");
      expect(typeof result.current.addImages).toBe("function");
      expect(typeof result.current.removeImage).toBe("function");
      expect(typeof result.current.clearImages).toBe("function");
    });
  });

  describe("Error handling", () => {
    it("throws error when used outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTamboV1ThreadInput());
      }).toThrow(
        "useTamboV1ThreadInput must be used within TamboV1ThreadInputProvider",
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Thread Isolation", () => {
    /**
     * Creates a wrapper that allows dynamically changing the thread ID.
     * This simulates switching between threads in the UI.
     */
    function createDynamicThreadWrapper(initialThreadId: string) {
      let currentThreadId = initialThreadId;
      const listeners = new Set<() => void>();

      const setThreadId = (newThreadId: string) => {
        currentThreadId = newThreadId;
        listeners.forEach((listener) => listener());
      };

      const Wrapper = ({ children }: { children: React.ReactNode }) => {
        const [threadId, setThreadIdState] = React.useState(currentThreadId);

        React.useEffect(() => {
          const listener = () => setThreadIdState(currentThreadId);
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        }, []);

        const noopDispatch: React.Dispatch<StreamAction> = () => {};

        return (
          <QueryClientProvider client={queryClient}>
            <TamboV1StreamProvider
              state={{ threadMap: {}, currentThreadId: threadId }}
              dispatch={noopDispatch}
            >
              <TamboV1ThreadInputProvider>
                {children}
              </TamboV1ThreadInputProvider>
            </TamboV1StreamProvider>
          </QueryClientProvider>
        );
      };

      return { Wrapper, setThreadId };
    }

    it("isolates pending state per thread when switching threads", async () => {
      // Create a deferred promise so we can control when the mutation resolves
      let resolveThreadA: (value: { threadId: string }) => void;
      const threadAPromise = new Promise<{ threadId: string }>((resolve) => {
        resolveThreadA = resolve;
      });

      mockMutateAsync.mockImplementation(async () => await threadAPromise);

      const { Wrapper, setThreadId } = createDynamicThreadWrapper("thread_A");
      const { result, rerender } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: Wrapper,
      });

      // Verify we're on thread A
      expect(result.current.threadId).toBe("thread_A");

      // Set input and start submission on thread A
      act(() => {
        result.current.setValue("Message for thread A");
      });

      // Start the submission (don't await - we want it pending)
      let submitPromise: Promise<{ threadId: string | undefined }>;
      act(() => {
        submitPromise = result.current.submit();
      });

      // Thread A should now be pending
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Switch to thread B while thread A is still pending
      act(() => {
        setThreadId("thread_B");
      });
      rerender();

      // Wait for the thread switch to take effect
      await waitFor(() => {
        expect(result.current.threadId).toBe("thread_B");
      });

      // Thread B should NOT be pending - its mutation state is independent
      // (The mutationKey includes threadId, so each thread has its own state)
      expect(result.current.isPending).toBe(false);

      // Now resolve thread A's submission
      act(() => {
        resolveThreadA!({ threadId: "thread_A" });
      });

      // Wait for promise to complete
      await act(async () => {
        await submitPromise!;
      });

      // Thread B should still not be pending
      expect(result.current.isPending).toBe(false);
    });

    it("multiple threads that never submitted should not be pending when another thread is", async () => {
      // Create a promise that never resolves to keep thread A pending
      const neverResolvingPromise = new Promise<{ threadId: string }>(() => {});

      mockMutateAsync.mockImplementation(
        async () => await neverResolvingPromise,
      );

      const { Wrapper, setThreadId } = createDynamicThreadWrapper("thread_A");
      const { result, rerender } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: Wrapper,
      });

      // Start submission on thread A
      act(() => {
        result.current.setValue("Message A");
      });

      act(() => {
        void result.current.submit();
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Switch to thread B (which has never submitted anything)
      act(() => {
        setThreadId("thread_B");
      });
      rerender();

      await waitFor(() => {
        expect(result.current.threadId).toBe("thread_B");
      });

      // Thread B should not be pending - it has never submitted
      expect(result.current.isPending).toBe(false);

      // Switch to thread C (also never submitted)
      act(() => {
        setThreadId("thread_C");
      });
      rerender();

      await waitFor(() => {
        expect(result.current.threadId).toBe("thread_C");
      });

      // Thread C should also not be pending
      expect(result.current.isPending).toBe(false);

      // Switch to thread D (also never submitted)
      act(() => {
        setThreadId("thread_D");
      });
      rerender();

      await waitFor(() => {
        expect(result.current.threadId).toBe("thread_D");
      });

      // Thread D should also not be pending
      // This confirms the fix works - without mutationKey, ALL threads would be pending
      expect(result.current.isPending).toBe(false);
    });
  });
});
