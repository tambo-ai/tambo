import { renderHook, act } from "@testing-library/react";
import { useTamboV1ThreadInput } from "./use-tambo-v1-thread-input";

// Create mock functions
const mockMutateAsync = jest.fn();
const mockMutate = jest.fn();
const mockReset = jest.fn();

// Mock useTamboV1SendMessage module
jest.mock("./use-tambo-v1-send-message");

import { useTamboV1SendMessage } from "./use-tambo-v1-send-message";

// Helper to set up the mock with default values
function setupMock(overrides: Record<string, unknown> = {}) {
  const mockReturn = {
    mutateAsync: mockMutateAsync,
    mutate: mockMutate,
    isPending: false as const,
    isError: false as const,
    error: null,
    isSuccess: false as const,
    isIdle: true as const,
    isPaused: false as const,
    status: "idle" as const,
    data: undefined,
    variables: undefined,
    failureCount: 0,
    failureReason: null,
    reset: mockReset,
    context: undefined,
    submittedAt: 0,
    ...overrides,
  };
  jest.mocked(useTamboV1SendMessage).mockReturnValue(mockReturn);
  return mockReturn;
}

describe("useTamboV1ThreadInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ threadId: "thread_123" });
    setupMock();
  });

  describe("State Management", () => {
    it("initializes with empty value", () => {
      const { result } = renderHook(() => useTamboV1ThreadInput());

      expect(result.current.value).toBe("");
    });

    it("updates value via setValue", () => {
      const { result } = renderHook(() => useTamboV1ThreadInput());

      act(() => {
        result.current.setValue("Hello world");
      });

      expect(result.current.value).toBe("Hello world");
    });

    it("supports functional updates for setValue", () => {
      const { result } = renderHook(() => useTamboV1ThreadInput());

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
      const { result } = renderHook(() => useTamboV1ThreadInput("thread_123"));

      act(() => {
        result.current.setValue("Test message");
      });

      await act(async () => {
        const response = await result.current.submit();
        expect(response.threadId).toBe("thread_123");
      });

      // Input should be cleared
      expect(result.current.value).toBe("");

      // Should have called mutateAsync with correct message format
      expect(mockMutateAsync).toHaveBeenCalledWith({
        message: {
          role: "user",
          content: [{ type: "text", text: "Test message" }],
        },
        debug: undefined,
      });
    });

    it("throws error when submitting empty message", async () => {
      const { result } = renderHook(() => useTamboV1ThreadInput());

      await expect(result.current.submit()).rejects.toThrow(
        "Message cannot be empty",
      );

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("throws error when submitting whitespace-only message", async () => {
      const { result } = renderHook(() => useTamboV1ThreadInput());

      act(() => {
        result.current.setValue("   ");
      });

      await expect(result.current.submit()).rejects.toThrow(
        "Message cannot be empty",
      );

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("passes debug option to mutation", async () => {
      const { result } = renderHook(() => useTamboV1ThreadInput());

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
        debug: true,
      });
    });

    it("trims whitespace from message", async () => {
      const { result } = renderHook(() => useTamboV1ThreadInput());

      act(() => {
        result.current.setValue("  Trimmed message  ");
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        message: {
          role: "user",
          content: [{ type: "text", text: "Trimmed message" }],
        },
        debug: undefined,
      });
    });
  });

  describe("Thread ID Handling", () => {
    it("passes threadId to useTamboV1SendMessage", () => {
      renderHook(() => useTamboV1ThreadInput("custom_thread_id"));

      expect(useTamboV1SendMessage).toHaveBeenCalledWith("custom_thread_id");
    });

    it("passes undefined threadId when not provided", () => {
      renderHook(() => useTamboV1ThreadInput());

      expect(useTamboV1SendMessage).toHaveBeenCalledWith(undefined);
    });
  });

  describe("Mutation State", () => {
    it("exposes isPending state", () => {
      setupMock({ isPending: true });

      const { result } = renderHook(() => useTamboV1ThreadInput());

      expect(result.current.isPending).toBe(true);
    });

    it("exposes isError state", () => {
      setupMock({ isError: true, error: new Error("Test error") });

      const { result } = renderHook(() => useTamboV1ThreadInput());

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe("Test error");
    });

    it("exposes isSuccess state", () => {
      setupMock({ isSuccess: true });

      const { result } = renderHook(() => useTamboV1ThreadInput());

      expect(result.current.isSuccess).toBe(true);
    });

    it("exposes reset function", () => {
      const { result } = renderHook(() => useTamboV1ThreadInput());

      act(() => {
        result.current.reset();
      });

      expect(mockReset).toHaveBeenCalled();
    });
  });
});
