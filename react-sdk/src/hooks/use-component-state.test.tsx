import { act, renderHook } from "@testing-library/react";
import React from "react";
import { TamboThreadMessage } from "../model/generate-component-response";
import { useTamboClient } from "../providers/tambo-client-provider";
import { useTamboInteractable } from "../providers/tambo-interactable-provider";
import { useTamboThread } from "../providers/tambo-thread-provider";
import { PartialTamboAI } from "../testing/types";
import { useTamboComponentState } from "./use-component-state";
import {
  TamboMessageContext,
  useTamboCurrentMessage,
} from "./use-current-message";

// Mock the required providers
jest.mock("../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
}));

jest.mock("../providers/tambo-thread-provider", () => ({
  useTamboThread: jest.fn(),
}));

jest.mock("./use-current-message", () => ({
  useTamboCurrentMessage: jest.fn(),
  TamboMessageContext: React.createContext<TamboThreadMessage | null>(null),
}));

jest.mock("../providers/tambo-interactable-provider", () => ({
  useTamboInteractable: jest.fn(),
}));

// Create a mock debounced function with flush method
const createMockDebouncedFunction = (fn: any) => {
  const debouncedFn = jest.fn((...args: any[]) => fn(...args)) as jest.Mock & {
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

// Import the mocked useDebouncedCallback
import { useDebouncedCallback } from "use-debounce";

describe("useTamboComponentState", () => {
  // Helper function to create mock TamboThreadMessage
  const createMockMessage = (
    overrides: Partial<TamboThreadMessage> = {},
  ): TamboThreadMessage => ({
    id: "test-message-id",
    threadId: "test-thread-id",
    componentState: {},
    content: [{ type: "text", text: "Test message" }],
    createdAt: new Date().toISOString(),
    role: "assistant",
    ...overrides,
  });

  const mockUpdateThreadMessage = jest.fn();
  const mockUpdateComponentState = jest.fn();
  const mockSetInteractableState = jest.fn();
  const mockGetInteractableComponentState = jest.fn();

  // Track context values for mocking
  let mockMessage: TamboThreadMessage | null = null;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset context values
    mockMessage = createMockMessage();

    // Mock useContext to return appropriate values based on context
    const originalUseContext = React.useContext;
    jest.spyOn(React, "useContext").mockImplementation((context) => {
      if (context === TamboMessageContext) {
        // Return the message from useTamboCurrentMessage mock if available
        try {
          const currentMessageMock = jest.mocked(useTamboCurrentMessage);
          const mockImpl = currentMessageMock.getMockImplementation();
          if (mockImpl) {
            return mockImpl();
          }
        } catch {
          // Fallback to mockMessage
        }
        return mockMessage;
      }
      // For other contexts, use the original implementation
      return originalUseContext(context);
    });

    // Setup default mock for useDebouncedCallback
    jest
      .mocked(useDebouncedCallback)
      .mockImplementation((fn) => createMockDebouncedFunction(fn));

    // Setup default mocks
    jest.mocked(useTamboClient).mockReturnValue({
      beta: {
        threads: {
          messages: {
            updateComponentState: mockUpdateComponentState,
          },
        },
      },
    } satisfies PartialTamboAI as any);

    jest.mocked(useTamboThread).mockReturnValue({
      updateThreadMessage: mockUpdateThreadMessage,
    } as any);

    jest.mocked(useTamboCurrentMessage).mockReturnValue(createMockMessage());

    jest.mocked(useTamboInteractable).mockReturnValue({
      setInteractableState: mockSetInteractableState,
      getInteractableComponentState: mockGetInteractableComponentState,
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initial State Management", () => {
    it("should initialize with initialValue when no componentState exists", () => {
      const initialValue = "test-initial";
      jest
        .mocked(useTamboCurrentMessage)
        .mockReturnValue(createMockMessage({ componentState: {} }));

      const { result } = renderHook(() =>
        useTamboComponentState("testKey", initialValue),
      );

      expect(result.current[0]).toBe(initialValue);
    });

    it("should use existing componentState value over initialValue", () => {
      const initialValue = "initial";
      const existingValue = "existing";
      jest.mocked(useTamboCurrentMessage).mockReturnValue(
        createMockMessage({
          componentState: { testKey: existingValue },
        }),
      );

      const { result } = renderHook(() =>
        useTamboComponentState("testKey", initialValue),
      );

      expect(result.current[0]).toBe(existingValue);
    });

    it("should handle undefined initialValue gracefully", () => {
      jest
        .mocked(useTamboCurrentMessage)
        .mockReturnValue(createMockMessage({ componentState: {} }));

      const { result } = renderHook(() => useTamboComponentState("testKey"));

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
        jest.mocked(useTamboCurrentMessage).mockReturnValue(
          createMockMessage({
            componentState: { testKey: value },
          }),
        );

        const { result } = renderHook(() =>
          useTamboComponentState("testKey", value),
        );

        expect(result.current[0]).toEqual(value);
      });
    });
  });

  describe("State Updates", () => {
    it("should update local state immediately when setValue is called", () => {
      const initialValue = "initial";
      jest
        .mocked(useTamboCurrentMessage)
        .mockReturnValue(
          createMockMessage({ componentState: { testKey: initialValue } }),
        );

      const { result } = renderHook(() =>
        useTamboComponentState("testKey", initialValue),
      );

      const newValue = "updated";
      act(() => {
        result.current[1](newValue);
      });

      expect(result.current[0]).toBe(newValue);
    });

    it("should trigger local thread message update when setValue is called", () => {
      const message = createMockMessage({
        componentState: { testKey: "initial" },
      });
      jest.mocked(useTamboCurrentMessage).mockReturnValue(message);

      const { result } = renderHook(() =>
        useTamboComponentState("testKey", "initial"),
      );

      const newValue = "updated";
      act(() => {
        result.current[1](newValue);
      });

      expect(mockUpdateThreadMessage).toHaveBeenCalledWith(
        message.id,
        {
          threadId: message.threadId,
          componentState: {
            testKey: newValue,
          },
        },
        false,
      );
    });

    it("should trigger debounced remote API call when setValue is called", () => {
      const message = createMockMessage({
        componentState: { testKey: "initial" },
      });
      jest.mocked(useTamboCurrentMessage).mockReturnValue(message);

      const { result } = renderHook(() =>
        useTamboComponentState("testKey", "initial"),
      );

      const newValue = "updated";
      act(() => {
        result.current[1](newValue);
      });

      // The debounced function should be called
      expect(mockUpdateComponentState).toHaveBeenCalledWith(message.id, {
        id: message.threadId,
        state: { testKey: newValue },
      });
    });

    it("should work with complex objects and arrays", () => {
      const initialValue = { name: "test", items: [1, 2, 3] };
      jest
        .mocked(useTamboCurrentMessage)
        .mockReturnValue(
          createMockMessage({ componentState: { testKey: initialValue } }),
        );

      const { result } = renderHook(() =>
        useTamboComponentState("testKey", initialValue),
      );

      const newValue = { name: "updated", items: [4, 5, 6] };
      act(() => {
        result.current[1](newValue);
      });

      expect(result.current[0]).toEqual(newValue);
      expect(mockUpdateThreadMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          componentState: {
            testKey: newValue,
          },
        }),
        false,
      );
    });
  });

  describe("Debouncing Behavior", () => {
    it("should use default debounce time of 500ms", () => {
      renderHook(() => useTamboComponentState("testKey", "initial"));

      expect(useDebouncedCallback).toHaveBeenCalledWith(
        expect.any(Function),
        500,
      );
    });

    it("should use custom debounce time when provided", () => {
      const customDebounceTime = 1000;

      renderHook(() =>
        useTamboComponentState(
          "testKey",
          "initial",
          undefined,
          customDebounceTime,
        ),
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

      // Mock the debounced callback to return our specific mock
      jest.mocked(useDebouncedCallback).mockReturnValue(mockDebouncedFn);

      const { unmount } = renderHook(() =>
        useTamboComponentState("testKey", "initial"),
      );

      unmount();

      expect(mockFlush).toHaveBeenCalled();
    });
  });

  describe("Multi-Hook Scenarios", () => {
    it("should handle multiple hooks with different keyNames independently", () => {
      const message = createMockMessage({
        componentState: {
          key1: "value1",
          key2: "value2",
        },
      });
      jest.mocked(useTamboCurrentMessage).mockReturnValue(message);

      const { result: result1 } = renderHook(() =>
        useTamboComponentState("key1", "default1"),
      );
      const { result: result2 } = renderHook(() =>
        useTamboComponentState("key2", "default2"),
      );

      expect(result1.current[0]).toBe("value1");
      expect(result2.current[0]).toBe("value2");

      // Update first hook
      act(() => {
        result1.current[1]("updated1");
      });

      expect(result1.current[0]).toBe("updated1");
      expect(result2.current[0]).toBe("value2"); // Should remain unchanged
    });

    it("should preserve existing componentState when updating another key", () => {
      const message = createMockMessage({
        componentState: {
          existingKey: "existing",
          testKey: "initial",
        },
      });
      jest.mocked(useTamboCurrentMessage).mockReturnValue(message);

      const { result } = renderHook(() =>
        useTamboComponentState("testKey", "initial"),
      );

      act(() => {
        result.current[1]("updated");
      });

      expect(mockUpdateThreadMessage).toHaveBeenCalledWith(
        message.id,
        {
          threadId: message.threadId,
          componentState: {
            existingKey: "existing", // Should preserve existing keys
            testKey: "updated",
          },
        },
        false,
      );
    });
  });

  describe("SetFromProp Feature", () => {
    it("should set value from prop when hasSetFromMessage is false", () => {
      jest
        .mocked(useTamboCurrentMessage)
        .mockReturnValue(createMockMessage({ componentState: {} }));

      const propValue = "from-prop";
      const { result } = renderHook(() =>
        useTamboComponentState("testKey", "initial", propValue),
      );

      // Initially, hasSetFromMessage should be false, so prop value should be used
      expect(result.current[0]).toBe(propValue);
    });

    it("should ignore setFromProp when initialized from message state", async () => {
      const existingValue = "existing";
      jest.mocked(useTamboCurrentMessage).mockReturnValue(
        createMockMessage({
          componentState: { testKey: existingValue },
        }),
      );

      const propValue = "from-prop";
      const { result } = renderHook(() =>
        useTamboComponentState("testKey", "initial", propValue),
      );

      // Should use existing value from message, not prop value
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current[0]).toBe(existingValue);
    });

    it("should update state from setFromProp changes when no message state exists", () => {
      jest
        .mocked(useTamboCurrentMessage)
        .mockReturnValue(createMockMessage({ componentState: {} }));

      const { result, rerender } = renderHook(
        ({ propValue }) =>
          useTamboComponentState("testKey", "initial", propValue),
        { initialProps: { propValue: "prop1" } },
      );

      expect(result.current[0]).toBe("prop1");

      // Change prop value
      rerender({ propValue: "prop2" });

      // Since hasSetFromMessage is still false (no message state),
      // it should update to new prop value
      expect(result.current[0]).toBe("prop2");
    });

    it("should handle undefined setFromProp gracefully", () => {
      jest
        .mocked(useTamboCurrentMessage)
        .mockReturnValue(createMockMessage({ componentState: {} }));

      const { result } = renderHook(() =>
        useTamboComponentState("testKey", "initial", undefined),
      );

      expect(result.current[0]).toBe("initial");
    });
  });

  describe("Interactable State Sync", () => {
    it("should sync local state when interactable state changes externally", () => {
      // Setup: Component is in interactable context with an ID
      const message = createMockMessage({
        componentState: {},
        interactableMetadata: {
          id: "test-interactable-id",
          componentName: "TestComponent",
          description: "Test",
        },
      });
      jest.mocked(useTamboCurrentMessage).mockReturnValue(message);

      // Start with initial state
      mockGetInteractableComponentState.mockReturnValue({ testKey: "initial" });

      const { result, rerender } = renderHook(() =>
        useTamboComponentState("testKey", "initial"),
      );

      expect(result.current[0]).toBe("initial");

      // Simulate external state update (e.g., from Tambo tool call)
      mockGetInteractableComponentState.mockReturnValue({
        testKey: "updated-by-tambo",
      });

      // Trigger rerender to pick up new interactable state
      rerender();

      // Local state should sync with the external update
      expect(result.current[0]).toBe("updated-by-tambo");
    });

    it("should not sync when not in interactable context", () => {
      // Setup: Component is NOT in interactable context (no interactableMetadata.id)
      const message = createMockMessage({
        componentState: { testKey: "initial" },
      });
      jest.mocked(useTamboCurrentMessage).mockReturnValue(message);

      mockGetInteractableComponentState.mockReturnValue({ testKey: "ignored" });

      const { result } = renderHook(() =>
        useTamboComponentState("testKey", "initial"),
      );

      // Should use message state, not interactable state
      expect(result.current[0]).toBe("initial");
    });
  });

  describe("Message State Sync", () => {
    it("should sync with message.componentState changes", () => {
      const { result, rerender } = renderHook(
        ({ message }) => {
          jest.mocked(useTamboCurrentMessage).mockReturnValue(message);
          return useTamboComponentState("testKey", "initial");
        },
        {
          initialProps: {
            message: createMockMessage({
              componentState: { testKey: "value1" },
            }),
          },
        },
      );

      // Change the message
      const newMessage = createMockMessage({
        componentState: { testKey: "value2" },
      });

      rerender({ message: newMessage });

      // The hook should sync with the new message state
      expect(result.current[0]).toBe("value2");
      expect(mockUpdateThreadMessage).not.toHaveBeenCalled();
    });

    it("should handle message without componentState gracefully", () => {
      jest
        .mocked(useTamboCurrentMessage)
        .mockReturnValue(
          createMockMessage({ componentState: undefined as any }),
        );

      const { result } = renderHook(() =>
        useTamboComponentState("testKey", "initial"),
      );

      expect(result.current[0]).toBe("initial");
    });

    it("should preserve state when message updates but componentState[keyName] unchanged", () => {
      const message1 = createMockMessage({
        id: "message1",
        componentState: { testKey: "unchanged" },
      });
      const message2 = createMockMessage({
        id: "message2",
        componentState: { testKey: "unchanged" },
      });

      const { result, rerender } = renderHook(
        ({ message }) => {
          jest.mocked(useTamboCurrentMessage).mockReturnValue(message);
          return useTamboComponentState("testKey", "initial");
        },
        { initialProps: { message: message1 } },
      );

      // Clear previous calls
      mockUpdateThreadMessage.mockClear();

      // Change message but keep same componentState value
      rerender({ message: message2 });

      // Should preserve the "unchanged" value
      expect(result.current[0]).toBe("unchanged");
    });
  });
});
