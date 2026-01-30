import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  TamboV1ThreadInputProvider,
  useTamboV1ThreadInput,
} from "../providers/tambo-v1-thread-input-provider";
import { TamboV1StreamProvider } from "../providers/tambo-v1-stream-context";
import { useTamboV1SendMessage } from "./use-tambo-v1-send-message";

// Mock useTamboV1SendMessage
jest.mock("./use-tambo-v1-send-message", () => ({
  useTamboV1SendMessage: jest.fn(),
}));

// Mock useTamboQueryClient to avoid TamboClientProvider dependency
jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboQueryClient: jest.fn(() => new QueryClient()),
  useTamboClient: jest.fn(),
}));

describe("useTamboV1ThreadInput", () => {
  const mockMutateAsync = jest.fn();
  let queryClient: QueryClient;

  function createWrapper() {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TamboV1StreamProvider>
            <TamboV1ThreadInputProvider>{children}</TamboV1ThreadInputProvider>
          </TamboV1StreamProvider>
        </QueryClientProvider>
      );
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
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
        debug: true,
      });
    });
  });

  describe("Thread ID Management", () => {
    it("initializes with undefined threadId", () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper(),
      });

      expect(result.current.threadId).toBeUndefined();
    });

    it("allows setting threadId via setThreadId", () => {
      const { result } = renderHook(() => useTamboV1ThreadInput(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setThreadId("custom_thread_id");
      });

      expect(result.current.threadId).toBe("custom_thread_id");
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
      }).toThrow("useTamboV1ThreadInput must be used within TamboV1Provider");

      consoleSpy.mockRestore();
    });
  });
});
