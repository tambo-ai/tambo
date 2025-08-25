import { act, renderHook } from "@testing-library/react";
import { useDebouncedCallback } from "use-debounce";
import { TamboThreadMessage } from "../../model/generate-component-response";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { useTamboThread } from "../../providers/tambo-thread-provider";
import { PartialTamboAI } from "../../testing/types";
import { useTamboComponentState } from "../use-component-state";
import { useTamboCurrentMessage } from "../use-current-message";

// Mock the required providers
jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
}));

jest.mock("../../providers/tambo-thread-provider", () => ({
  useTamboThread: jest.fn(),
}));

jest.mock("../use-current-message", () => ({
  useTamboCurrentMessage: jest.fn(),
}));

// Mock use-debounce
jest.mock("use-debounce", () => ({
  useDebouncedCallback: jest.fn((_fn, _delay) => {
    const debouncedFn = jest.fn((...args: any[]) => _fn(...args));
    (debouncedFn as any).flush = jest.fn();
    return debouncedFn;
  }),
}));

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

  beforeEach(() => {
    jest.clearAllMocks();

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
      expect(mockUpdateComponentState).toHaveBeenCalledWith(
        message.threadId,
        message.id,
        { state: { testKey: newValue } },
      );
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

    it("should return correct meta object with isPending status", () => {
      const { result } = renderHook(() =>
        useTamboComponentState("testKey", "initial"),
      );

      expect(result.current[2]).toEqual({ isPending: false });
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
        useTamboComponentState("testKey", "initial", customDebounceTime),
      );

      expect(useDebouncedCallback).toHaveBeenCalledWith(
        expect.any(Function),
        customDebounceTime,
      );
    });

    // it("should flush debounced callback on unmount", () => {
    //   const mockFlush = jest.fn();

    //   // Mock the debounced callback to return our mock flush function
    //   jest
    //     .mocked(useDebouncedCallback)
    //     .mockReturnValue(Object.assign(jest.fn(), { flush: mockFlush }));

    //   const { unmount } = renderHook(() =>
    //     useTamboComponentState("testKey", "initial"),
    //   );

    //   unmount();

    //   expect(mockFlush).toHaveBeenCalled();
    // });
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

    it("should handle multiple hooks with same keyName sharing state", () => {
      const message = createMockMessage({
        componentState: { sharedKey: "shared" },
      });
      jest.mocked(useTamboCurrentMessage).mockReturnValue(message);

      const { result: result1 } = renderHook(() =>
        useTamboComponentState("sharedKey", "default"),
      );
      const { result: result2 } = renderHook(() =>
        useTamboComponentState("sharedKey", "default"),
      );

      expect(result1.current[0]).toBe("shared");
      expect(result2.current[0]).toBe("shared");

      // When we update via one hook, both should reflect the change in the next render
      // Note: In real usage, this would happen through the message update mechanism
    });

    it("should preserve existing componentState when updating", () => {
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
        useTamboComponentState("testKey", "initial", 500, propValue),
      );

      // Initially, hasSetFromMessage should be false, so prop value should be used
      expect(result.current[0]).toBe(propValue);
    });

    it("should ignore setFromProp when hasSetFromMessage is true", async () => {
      const existingValue = "existing";
      jest.mocked(useTamboCurrentMessage).mockReturnValue(
        createMockMessage({
          componentState: { testKey: existingValue },
        }),
      );

      const propValue = "from-prop";
      const { result } = renderHook(() =>
        useTamboComponentState("testKey", "initial", 500, propValue),
      );

      // Should use existing value from message, not prop value
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current[0]).toBe(existingValue);
    });

    it("should update hasSetFromMessage flag correctly", async () => {
      const message = createMockMessage({
        componentState: { testKey: "messageValue" },
      });
      jest.mocked(useTamboCurrentMessage).mockReturnValue(message);

      const { result, rerender } = renderHook(
        ({ propValue }) =>
          useTamboComponentState("testKey", "initial", 500, propValue),
        { initialProps: { propValue: "prop1" } },
      );

      // After initial render and useEffect, hasSetFromMessage should be true
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Now change the prop - it should be ignored
      rerender({ propValue: "prop2" });

      expect(result.current[0]).toBe("messageValue"); // Should still be message value
    });

    it("should handle setFromProp changes when no message state exists", () => {
      jest
        .mocked(useTamboCurrentMessage)
        .mockReturnValue(createMockMessage({ componentState: {} }));

      const { result, rerender } = renderHook(
        ({ propValue }) =>
          useTamboComponentState("testKey", "initial", 500, propValue),
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
        useTamboComponentState("testKey", "initial", 500, undefined),
      );

      expect(result.current[0]).toBe("initial");
    });
  });

  describe("Message State Sync", () => {
    it("should sync with message.componentState changes", () => {
      const { rerender } = renderHook(
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
      expect(mockUpdateThreadMessage).toHaveBeenCalledWith(
        newMessage.id,
        expect.objectContaining({
          componentState: { testKey: "value2" },
        }),
        false,
      );
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

      const { rerender } = renderHook(
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

      // Should still call updateLocalThreadMessage due to useEffect dependency on message
      expect(mockUpdateThreadMessage).toHaveBeenCalled();
    });
  });

  describe("Error Scenarios", () => {
    it("should handle API call failures gracefully", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      mockUpdateComponentState.mockRejectedValue(new Error("API Error"));

      const { result } = renderHook(() =>
        useTamboComponentState("testKey", "initial"),
      );

      await act(async () => {
        result.current[1]("updated");
      });

      // Should not crash and state should still be updated locally
      expect(result.current[0]).toBe("updated");

      consoleErrorSpy.mockRestore();
    });

    it("should handle malformed message object", () => {
      jest.mocked(useTamboCurrentMessage).mockReturnValue({
        id: "test",
        threadId: "test",
      } as any);

      const { result } = renderHook(() =>
        useTamboComponentState("testKey", "initial"),
      );

      expect(result.current[0]).toBe("initial");
    });
  });

  describe("TypeScript Overloads", () => {
    it("should work with required initialValue overload", () => {
      const { result } = renderHook(() =>
        useTamboComponentState("testKey", "required"),
      );

      // TypeScript should infer the type as string, not string | undefined
      const [state] = result.current;
      expect(typeof state).toBe("string");
    });

    it("should work with optional initialValue overload", () => {
      const { result } = renderHook(() => useTamboComponentState("testKey"));

      // TypeScript should allow undefined
      const [state] = result.current;
      expect(state).toBeUndefined();
    });
  });
});
