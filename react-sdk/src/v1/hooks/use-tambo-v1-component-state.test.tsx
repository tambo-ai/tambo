import { act, renderHook } from "@testing-library/react";
import { useTamboV1ComponentState } from "./use-tambo-v1-component-state";

// Mock the required modules
jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
}));

jest.mock("../providers/tambo-v1-stream-context", () => ({
  useStreamState: jest.fn(),
}));

jest.mock("../utils/component-renderer", () => ({
  useV1ComponentContentOptional: jest.fn(),
}));

const mockSetInteractableState = jest.fn();
const mockGetInteractableComponentState = jest.fn<
  Record<string, unknown> | undefined,
  [string]
>(() => undefined);

jest.mock("../../providers/tambo-interactable-provider", () => ({
  useTamboInteractable: () => ({
    interactableComponents: [],
    addInteractableComponent: jest.fn(),
    removeInteractableComponent: jest.fn(),
    updateInteractableComponentProps: jest.fn(),
    getInteractableComponent: jest.fn(),
    getInteractableComponentsByName: jest.fn(),
    clearAllInteractableComponents: jest.fn(),
    setInteractableState: mockSetInteractableState,
    getInteractableComponentState: mockGetInteractableComponentState,
    setInteractableSelected: jest.fn(),
    clearInteractableSelections: jest.fn(),
  }),
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
import { useTamboClient } from "../../providers/tambo-client-provider";
import { useStreamState } from "../providers/tambo-v1-stream-context";
import { useV1ComponentContentOptional } from "../utils/component-renderer";
import { useDebouncedCallback } from "use-debounce";
import type { StreamState } from "../utils/event-accumulator";
import type { V1ComponentContent } from "../types/message";

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
          lastRunCancelled: false,
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

    jest.mocked(useV1ComponentContentOptional).mockReturnValue({
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

    // Reset interactable mocks to default (no interactable state)
    mockSetInteractableState.mockClear();
    mockGetInteractableComponentState.mockReset();
    mockGetInteractableComponentState.mockReturnValue(undefined);
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
    it("should act as plain useState when component content context is missing", () => {
      jest.mocked(useV1ComponentContentOptional).mockReturnValue(null);
      jest.mocked(useStreamState).mockReturnValue({
        threadMap: {},
        currentThreadId: "",
      });

      const { result } = renderHook(() =>
        useTamboV1ComponentState("testKey", "initial"),
      );

      expect(result.current[0]).toBe("initial");

      // No side effects when context is missing
      expect(mockSetInteractableState).not.toHaveBeenCalled();
      expect(mockUpdateState).not.toHaveBeenCalled();
    });

    it("should not trigger side effects on setState when context is missing", () => {
      jest.mocked(useV1ComponentContentOptional).mockReturnValue(null);
      jest.mocked(useStreamState).mockReturnValue({
        threadMap: {},
        currentThreadId: "",
      });

      const { result } = renderHook(() =>
        useTamboV1ComponentState("testKey", "initial"),
      );

      act(() => {
        result.current[1]("updated");
      });

      // Local state updates, but no server sync or interactable writes
      expect(result.current[0]).toBe("updated");
      expect(mockSetInteractableState).not.toHaveBeenCalled();
      expect(mockUpdateState).not.toHaveBeenCalled();
    });
  });

  describe("Interactable Component Support", () => {
    const interactableComponentId = "MyWidget-abc";

    beforeEach(() => {
      // Simulate interactable context: threadId="" signals interactable
      jest.mocked(useV1ComponentContentOptional).mockReturnValue({
        componentId: interactableComponentId,
        threadId: "",
        messageId: "",
        componentName: "MyWidget",
      });

      // Empty stream state - interactable components don't use it
      jest.mocked(useStreamState).mockReturnValue({
        threadMap: {},
        currentThreadId: "",
      });
    });

    it("should initialize with initialValue when no interactable state exists", () => {
      mockGetInteractableComponentState.mockReturnValue(undefined);

      const { result } = renderHook(() =>
        useTamboV1ComponentState("count", 42),
      );

      expect(result.current[0]).toBe(42);
    });

    it("should initialize from interactable state when it exists", () => {
      mockGetInteractableComponentState.mockReturnValue({ count: 99 });

      const { result } = renderHook(() => useTamboV1ComponentState("count", 0));

      expect(result.current[0]).toBe(99);
    });

    it("should call setInteractableState when setState is called", () => {
      mockGetInteractableComponentState.mockReturnValue(undefined);

      const { result } = renderHook(() => useTamboV1ComponentState("count", 0));

      act(() => {
        result.current[1](10);
      });

      expect(mockSetInteractableState).toHaveBeenCalledWith(
        interactableComponentId,
        "count",
        10,
      );
    });

    it("should NOT call client.threads.state.updateState for interactable components", () => {
      mockGetInteractableComponentState.mockReturnValue(undefined);

      const { result } = renderHook(() => useTamboV1ComponentState("count", 0));

      act(() => {
        result.current[1](10);
      });

      expect(mockUpdateState).not.toHaveBeenCalled();
    });

    it("should sync from interactable provider when state changes externally", () => {
      mockGetInteractableComponentState.mockReturnValue({ count: 0 });

      const { result, rerender } = renderHook(() =>
        useTamboV1ComponentState("count", 0),
      );

      expect(result.current[0]).toBe(0);

      // Simulate external state change (e.g., AI tool call)
      mockGetInteractableComponentState.mockReturnValue({ count: 77 });

      rerender();

      expect(result.current[0]).toBe(77);
    });

    it("should have isPending as false in interactable context", () => {
      mockGetInteractableComponentState.mockReturnValue(undefined);

      const { result } = renderHook(() => useTamboV1ComponentState("count", 0));

      expect(result.current[2].isPending).toBe(false);
      expect(result.current[2].error).toBeNull();
    });

    it("should set initial value in interactable state on mount when no existing state", () => {
      mockGetInteractableComponentState.mockReturnValue(undefined);

      renderHook(() => useTamboV1ComponentState("count", 42));

      expect(mockSetInteractableState).toHaveBeenCalledWith(
        interactableComponentId,
        "count",
        42,
      );
    });

    it("should NOT set initial value in interactable state when state already exists", () => {
      mockGetInteractableComponentState.mockReturnValue({ count: 99 });

      renderHook(() => useTamboV1ComponentState("count", 42));

      // Should not be called because state already exists
      expect(mockSetInteractableState).not.toHaveBeenCalled();
    });

    it("should not flush on unmount for interactable components", () => {
      const mockFlush = jest.fn();
      const mockDebouncedFn = createMockDebouncedFunction(jest.fn());
      mockDebouncedFn.flush = mockFlush;
      jest.mocked(useDebouncedCallback).mockReturnValue(mockDebouncedFn);

      mockGetInteractableComponentState.mockReturnValue(undefined);

      const { unmount } = renderHook(() =>
        useTamboV1ComponentState("count", 0),
      );

      unmount();

      expect(mockFlush).not.toHaveBeenCalled();
    });
  });
});
