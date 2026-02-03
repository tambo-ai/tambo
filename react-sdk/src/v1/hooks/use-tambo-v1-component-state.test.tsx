import { act, renderHook } from "@testing-library/react";
import { useTamboV1ComponentState } from "./use-tambo-v1-component-state.js";

// Mock the required modules
jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
}));

jest.mock("../providers/tambo-v1-stream-context", () => ({
  useStreamState: jest.fn(),
}));

jest.mock("../utils/component-renderer", () => ({
  useV1ComponentContent: jest.fn(),
}));

// Create a mock debounced function with flush method
const createMockDebouncedFunction = (fn: (...args: unknown[]) => unknown) => {
  const debouncedFn = jest.fn((...args: unknown[]) =>
    fn(...args),
  ) as jest.Mock & {
    flush: jest.Mock;
    cancel: jest.Mock;
    isPending: () => boolean;
  };
  debouncedFn.flush = jest.fn();
  debouncedFn.cancel = jest.fn();
  debouncedFn.isPending = jest.fn(() => false);
  return debouncedFn;
};

// Mock use-debounce
jest.mock("use-debounce", () => ({
  useDebouncedCallback: jest.fn(),
}));

// Import the mocked modules
import { useTamboClient } from "../../providers/tambo-client-provider.js";
import { useStreamState } from "../providers/tambo-v1-stream-context.js";
import { useV1ComponentContent } from "../utils/component-renderer.js";
import { useDebouncedCallback } from "use-debounce";
import type { StreamState } from "../utils/event-accumulator.js";
import type { V1ComponentContent } from "../types/message.js";

describe("useTamboV1ComponentState", () => {
  const mockUpdateState = jest.fn();
  const mockComponentId = "comp_test123";
  const mockThreadId = "thread_abc";
  const mockMessageId = "msg_xyz";

  // Helper to create mock stream state
  const createMockStreamState = (
    componentState?: Record<string, unknown>,
  ): StreamState => ({
    threadMap: {
      [mockThreadId]: {
        thread: {
          id: mockThreadId,
          messages: [
            {
              id: mockMessageId,
              role: "assistant",
              content: [
                {
                  type: "component",
                  id: mockComponentId,
                  name: "TestComponent",
                  props: {},
                  state: componentState,
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
    currentThreadId: mockThreadId,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    jest.mocked(useTamboClient).mockReturnValue({
      threads: {
        state: {
          updateState: mockUpdateState,
        },
      },
    } as unknown as ReturnType<typeof useTamboClient>);

    jest.mocked(useV1ComponentContent).mockReturnValue({
      componentId: mockComponentId,
      threadId: mockThreadId,
      messageId: mockMessageId,
      componentName: "TestComponent",
    });

    jest.mocked(useStreamState).mockReturnValue(createMockStreamState());

    // Setup default mock for useDebouncedCallback
    jest
      .mocked(useDebouncedCallback)
      .mockImplementation((fn) => createMockDebouncedFunction(fn));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initial State Management", () => {
    it("should initialize with initialValue when no server state exists", () => {
      const initialValue = "test-initial";
      jest.mocked(useStreamState).mockReturnValue(createMockStreamState({}));

      const { result } = renderHook(() =>
        useTamboV1ComponentState("testKey", initialValue),
      );

      expect(result.current[0]).toBe(initialValue);
    });

    it("should use server state over initialValue", () => {
      const initialValue = "initial";
      const serverValue = "server-value";
      jest
        .mocked(useStreamState)
        .mockReturnValue(createMockStreamState({ testKey: serverValue }));

      const { result } = renderHook(() =>
        useTamboV1ComponentState("testKey", initialValue),
      );

      expect(result.current[0]).toBe(serverValue);
    });

    it("should handle undefined initialValue gracefully", () => {
      jest.mocked(useStreamState).mockReturnValue(createMockStreamState({}));

      const { result } = renderHook(() => useTamboV1ComponentState("testKey"));

      expect(result.current[0]).toBeUndefined();
    });

    it("should handle different data types correctly", () => {
      const testCases = [
        { value: "string" },
        { value: 42 },
        { value: true },
        { value: { name: "test" } },
        { value: [1, 2, 3] },
      ];

      testCases.forEach(({ value }) => {
        jest
          .mocked(useStreamState)
          .mockReturnValue(createMockStreamState({ testKey: value }));

        const { result } = renderHook(() =>
          useTamboV1ComponentState("testKey", value),
        );

        expect(result.current[0]).toEqual(value);
      });
    });
  });

  describe("State Updates", () => {
    it("should update local state immediately when setState is called", () => {
      const initialValue = "initial";
      jest
        .mocked(useStreamState)
        .mockReturnValue(createMockStreamState({ testKey: initialValue }));

      const { result } = renderHook(() =>
        useTamboV1ComponentState("testKey", initialValue),
      );

      const newValue = "updated";
      act(() => {
        result.current[1](newValue);
      });

      expect(result.current[0]).toBe(newValue);
    });

    it("should support functional updates", () => {
      const initialValue = 5;
      jest
        .mocked(useStreamState)
        .mockReturnValue(createMockStreamState({ counter: initialValue }));

      const { result } = renderHook(() =>
        useTamboV1ComponentState("counter", initialValue),
      );

      act(() => {
        result.current[1]((prev) => (prev ?? 0) + 1);
      });

      expect(result.current[0]).toBe(6);
    });

    it("should trigger debounced API call when setState is called", () => {
      const initialValue = "initial";
      jest
        .mocked(useStreamState)
        .mockReturnValue(createMockStreamState({ testKey: initialValue }));

      const { result } = renderHook(() =>
        useTamboV1ComponentState("testKey", initialValue),
      );

      const newValue = "updated";
      act(() => {
        result.current[1](newValue);
      });

      // The debounced function should be called
      expect(mockUpdateState).toHaveBeenCalledWith(mockComponentId, {
        threadId: mockThreadId,
        state: { testKey: newValue },
      });
    });

    it("should work with complex objects", () => {
      const initialValue = { name: "test", items: [1, 2, 3] };
      jest
        .mocked(useStreamState)
        .mockReturnValue(createMockStreamState({ data: initialValue }));

      const { result } = renderHook(() =>
        useTamboV1ComponentState("data", initialValue),
      );

      const newValue = { name: "updated", items: [4, 5, 6] };
      act(() => {
        result.current[1](newValue);
      });

      expect(result.current[0]).toEqual(newValue);
    });
  });

  describe("Metadata", () => {
    it("should return isPending and error in meta", () => {
      jest.mocked(useStreamState).mockReturnValue(createMockStreamState({}));

      const { result } = renderHook(() =>
        useTamboV1ComponentState("testKey", "initial"),
      );

      expect(result.current[2]).toEqual({
        isPending: false,
        error: null,
        flush: expect.any(Function),
      });
    });

    it("should provide a flush function", () => {
      const mockFlush = jest.fn();
      const mockDebouncedFn = createMockDebouncedFunction(jest.fn());
      mockDebouncedFn.flush = mockFlush;
      jest.mocked(useDebouncedCallback).mockReturnValue(mockDebouncedFn);

      jest.mocked(useStreamState).mockReturnValue(createMockStreamState({}));

      const { result } = renderHook(() =>
        useTamboV1ComponentState("testKey", "initial"),
      );

      act(() => {
        result.current[2].flush();
      });

      expect(mockFlush).toHaveBeenCalled();
    });
  });

  describe("Debouncing Behavior", () => {
    it("should use default debounce time of 500ms", () => {
      jest.mocked(useStreamState).mockReturnValue(createMockStreamState({}));

      renderHook(() => useTamboV1ComponentState("testKey", "initial"));

      expect(useDebouncedCallback).toHaveBeenCalledWith(
        expect.any(Function),
        500,
      );
    });

    it("should use custom debounce time when provided", () => {
      jest.mocked(useStreamState).mockReturnValue(createMockStreamState({}));
      const customDebounceTime = 1000;

      renderHook(() =>
        useTamboV1ComponentState("testKey", "initial", customDebounceTime),
      );

      expect(useDebouncedCallback).toHaveBeenCalledWith(
        expect.any(Function),
        customDebounceTime,
      );
    });

    it("should flush debounced callback on unmount", () => {
      const mockFlush = jest.fn();
      const mockDebouncedFn = createMockDebouncedFunction(jest.fn());
      mockDebouncedFn.flush = mockFlush;
      jest.mocked(useDebouncedCallback).mockReturnValue(mockDebouncedFn);

      jest.mocked(useStreamState).mockReturnValue(createMockStreamState({}));

      const { unmount } = renderHook(() =>
        useTamboV1ComponentState("testKey", "initial"),
      );

      unmount();

      expect(mockFlush).toHaveBeenCalled();
    });
  });

  describe("Server State Sync", () => {
    it("should sync with server state changes from streaming", () => {
      const streamState = createMockStreamState({ testKey: "initial" });
      jest.mocked(useStreamState).mockReturnValue(streamState);

      const { result, rerender } = renderHook(() =>
        useTamboV1ComponentState("testKey", "initial"),
      );

      expect(result.current[0]).toBe("initial");

      // Simulate server state change from streaming
      const updatedStreamState = createMockStreamState({
        testKey: "updated-from-server",
      });
      jest.mocked(useStreamState).mockReturnValue(updatedStreamState);

      rerender();

      expect(result.current[0]).toBe("updated-from-server");
    });

    it("should handle component not found in stream state", () => {
      // Empty stream state (no matching component)
      jest.mocked(useStreamState).mockReturnValue({
        threadMap: {},
        currentThreadId: "placeholder",
      });

      const { result } = renderHook(() =>
        useTamboV1ComponentState("testKey", "default"),
      );

      expect(result.current[0]).toBe("default");
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      const mockError = new Error("API Error");
      mockUpdateState.mockRejectedValue(mockError);

      // Create a sync mock that calls the function immediately
      jest.mocked(useDebouncedCallback).mockImplementation((fn) => {
        const debouncedFn = Object.assign(
          async (...args: unknown[]) => fn(...args),
          {
            flush: jest.fn(),
            cancel: jest.fn(),
            isPending: () => false,
          },
        ) as unknown as ReturnType<typeof useDebouncedCallback>;
        return debouncedFn;
      });

      jest.mocked(useStreamState).mockReturnValue(createMockStreamState({}));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() =>
        useTamboV1ComponentState("testKey", "initial"),
      );

      await act(async () => {
        result.current[1]("new-value");
        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to sync state"),
        mockError,
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Context Requirements", () => {
    it("should throw when used outside component content context", () => {
      jest.mocked(useV1ComponentContent).mockImplementation(() => {
        throw new Error(
          "useV1ComponentContent must be used within a rendered component",
        );
      });

      expect(() => {
        renderHook(() => useTamboV1ComponentState("testKey", "initial"));
      }).toThrow(
        "useV1ComponentContent must be used within a rendered component",
      );
    });
  });
});
