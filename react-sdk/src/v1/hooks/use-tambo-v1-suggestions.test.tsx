import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTamboV1Suggestions } from "./use-tambo-v1-suggestions";
import { useTamboV1ThreadInput } from "./use-tambo-v1-thread-input";
import { useTamboV1 } from "./use-tambo-v1";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { useTamboRegistry } from "../../providers/tambo-registry-provider";

// Mock dependencies
jest.mock("./use-tambo-v1-thread-input", () => ({
  useTamboV1ThreadInput: jest.fn(),
}));

jest.mock("./use-tambo-v1", () => ({
  useTamboV1: jest.fn(),
}));

jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
  useTamboQueryClient: jest.fn(() => new QueryClient()),
}));

jest.mock("../../providers/tambo-registry-provider", () => ({
  useTamboRegistry: jest.fn(),
}));

describe("useTamboV1Suggestions", () => {
  let queryClient: QueryClient;
  const mockSetValue = jest.fn();
  const mockSubmit = jest.fn();
  const mockGenerateSuggestions = jest.fn();

  function createWrapper() {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
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

    // Default mock for thread input
    jest.mocked(useTamboV1ThreadInput).mockReturnValue({
      value: "",
      setValue: mockSetValue,
      submit: mockSubmit,
      threadId: "thread_123",
      setThreadId: jest.fn(),
      images: [],
      addImage: jest.fn(),
      addImages: jest.fn(),
      removeImage: jest.fn(),
      clearImages: jest.fn(),
      isPending: false,
      isError: false,
      error: undefined,
    } as any);

    // Default mock for useTamboV1
    jest.mocked(useTamboV1).mockReturnValue({
      messages: [],
      thread: undefined,
      isIdle: true,
      isStreaming: false,
      startNewThread: jest.fn(),
      switchThread: jest.fn(),
      initThread: jest.fn(),
      streamingState: {
        status: "idle",
      },
    } as any);

    // Default mock for registry
    jest.mocked(useTamboRegistry).mockReturnValue({
      componentList: {},
      toolRegistry: {},
      componentToolAssociations: {},
      mcpServerInfos: [],
      resources: [],
      resourceSource: null,
      onCallUnregisteredTool: undefined,
      registerComponent: jest.fn(),
      unregisterComponent: jest.fn(),
      registerTool: jest.fn(),
      unregisterTool: jest.fn(),
      registerMcpServer: jest.fn(),
      unregisterMcpServer: jest.fn(),
      registerResource: jest.fn(),
      unregisterResource: jest.fn(),
      setResourceSource: jest.fn(),
    } as any);

    // Default mock for client
    mockGenerateSuggestions.mockResolvedValue([
      {
        id: "suggestion_1",
        suggestion: "What's the weather?",
        detailedSuggestion: "What's the weather like today?",
      },
      {
        id: "suggestion_2",
        suggestion: "Tell me a joke",
        detailedSuggestion: "Can you tell me a funny joke?",
      },
    ]);

    jest.mocked(useTamboClient).mockReturnValue({
      beta: {
        threads: {
          suggestions: {
            generate: mockGenerateSuggestions,
          },
        },
      },
    } as any);
  });

  describe("Initial State", () => {
    it("returns empty suggestions when no messages", () => {
      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      expect(result.current.suggestions).toEqual([]);
      expect(result.current.selectedSuggestionId).toBeNull();
    });

    it("returns empty suggestions when latest message is from user", () => {
      jest.mocked(useTamboV1).mockReturnValue({
        messages: [
          {
            id: "msg_1",
            role: "user",
            content: [],
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        thread: undefined,
        isIdle: true,
        isStreaming: false,
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: {
          status: "idle",
        },
      } as any);

      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      expect(result.current.suggestions).toEqual([]);
    });
  });

  describe("Suggestion Generation", () => {
    it("generates suggestions when latest message is from assistant and thread is idle", async () => {
      jest.mocked(useTamboV1).mockReturnValue({
        messages: [
          {
            id: "msg_1",
            role: "assistant",
            content: [],
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        thread: undefined,
        isIdle: true,
        isStreaming: false,
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: {
          status: "idle",
        },
      } as any);

      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.suggestions).toHaveLength(2);
      });

      expect(mockGenerateSuggestions).toHaveBeenCalledWith(
        "msg_1",
        expect.objectContaining({
          id: "thread_123",
          maxSuggestions: 3,
        }),
      );
    });

    it("does not generate suggestions when thread is streaming", () => {
      jest.mocked(useTamboV1).mockReturnValue({
        messages: [
          {
            id: "msg_1",
            role: "assistant",
            content: [],
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        thread: undefined,
        isIdle: false,
        isStreaming: true,
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: {
          status: "streaming",
          runId: "run_1",
        },
      } as any);

      renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      expect(mockGenerateSuggestions).not.toHaveBeenCalled();
    });

    it("does not generate suggestions when no threadId", () => {
      jest.mocked(useTamboV1ThreadInput).mockReturnValue({
        value: "",
        setValue: mockSetValue,
        submit: mockSubmit,
        threadId: undefined,
        setThreadId: jest.fn(),
        images: [],
        addImage: jest.fn(),
        addImages: jest.fn(),
        removeImage: jest.fn(),
        clearImages: jest.fn(),
        isPending: false,
        isError: false,
        error: undefined,
      } as any);

      jest.mocked(useTamboV1).mockReturnValue({
        messages: [
          {
            id: "msg_1",
            role: "assistant",
            content: [],
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        thread: undefined,
        isIdle: true,
        isStreaming: false,
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: {
          status: "idle",
        },
      } as any);

      renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      expect(mockGenerateSuggestions).not.toHaveBeenCalled();
    });

    it("uses custom maxSuggestions option", async () => {
      jest.mocked(useTamboV1).mockReturnValue({
        messages: [
          {
            id: "msg_1",
            role: "assistant",
            content: [],
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        thread: undefined,
        isIdle: true,
        isStreaming: false,
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: {
          status: "idle",
        },
      } as any);

      const { result } = renderHook(
        () => useTamboV1Suggestions({ maxSuggestions: 5 }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.suggestions).toHaveLength(2);
      });

      expect(mockGenerateSuggestions).toHaveBeenCalledWith(
        "msg_1",
        expect.objectContaining({
          maxSuggestions: 5,
        }),
      );
    });
  });

  describe("Accepting Suggestions", () => {
    it("updates shared input value when accepting without submit", async () => {
      jest.mocked(useTamboV1).mockReturnValue({
        messages: [
          {
            id: "msg_1",
            role: "assistant",
            content: [],
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        thread: undefined,
        isIdle: true,
        isStreaming: false,
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: {
          status: "idle",
        },
      } as any);

      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.suggestions).toHaveLength(2);
      });

      const suggestion = result.current.suggestions[0];

      await act(async () => {
        await result.current.accept({ suggestion });
      });

      expect(mockSetValue).toHaveBeenCalledWith(
        "What's the weather like today?",
      );
      expect(mockSubmit).not.toHaveBeenCalled();
      expect(result.current.selectedSuggestionId).toBe("suggestion_1");
    });

    it("submits when accepting with shouldSubmit=true", async () => {
      mockSubmit.mockResolvedValue({ threadId: "thread_123" });

      jest.mocked(useTamboV1).mockReturnValue({
        messages: [
          {
            id: "msg_1",
            role: "assistant",
            content: [],
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        thread: undefined,
        isIdle: true,
        isStreaming: false,
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: {
          status: "idle",
        },
      } as any);

      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.suggestions).toHaveLength(2);
      });

      const suggestion = result.current.suggestions[0];

      await act(async () => {
        await result.current.accept({ suggestion, shouldSubmit: true });
      });

      expect(mockSetValue).toHaveBeenCalledWith(
        "What's the weather like today?",
      );
      expect(mockSubmit).toHaveBeenCalled();
    });

    it("throws error when suggestion has no detailed content", async () => {
      jest.mocked(useTamboV1).mockReturnValue({
        messages: [
          {
            id: "msg_1",
            role: "assistant",
            content: [],
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        thread: undefined,
        isIdle: true,
        isStreaming: false,
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: {
          status: "idle",
        },
      } as any);

      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      const emptySuggestion = {
        id: "empty_suggestion",
        suggestion: "Empty",
        detailedSuggestion: "",
      };

      await expect(
        result.current.accept({ suggestion: emptySuggestion as any }),
      ).rejects.toThrow("Suggestion has no detailed content");
    });

    it("throws error when detailedSuggestion is only whitespace", async () => {
      jest.mocked(useTamboV1).mockReturnValue({
        messages: [
          {
            id: "msg_1",
            role: "assistant",
            content: [],
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        thread: undefined,
        isIdle: true,
        isStreaming: false,
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: {
          status: "idle",
        },
      } as any);

      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      const whitespaceSuggestion = {
        id: "whitespace_suggestion",
        suggestion: "Whitespace",
        detailedSuggestion: "   ",
      };

      await expect(
        result.current.accept({ suggestion: whitespaceSuggestion as any }),
      ).rejects.toThrow("Suggestion has no detailed content");
    });
  });

  describe("State Management", () => {
    it("resets selectedSuggestionId when message changes", async () => {
      const mockUseTamboV1 = jest.mocked(useTamboV1);

      mockUseTamboV1.mockReturnValue({
        messages: [
          {
            id: "msg_1",
            role: "assistant",
            content: [],
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        thread: undefined,
        isIdle: true,
        isStreaming: false,
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: {
          status: "idle",
        },
      } as any);

      const { result, rerender } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.suggestions).toHaveLength(2);
      });

      // Accept a suggestion
      await act(async () => {
        await result.current.accept({
          suggestion: result.current.suggestions[0],
        });
      });

      expect(result.current.selectedSuggestionId).toBe("suggestion_1");

      // Change the latest message
      mockUseTamboV1.mockReturnValue({
        messages: [
          {
            id: "msg_1",
            role: "assistant",
            content: [],
            createdAt: "2024-01-01T00:00:00Z",
          },
          {
            id: "msg_2",
            role: "assistant",
            content: [],
            createdAt: "2024-01-01T00:00:01Z",
          },
        ],
        thread: undefined,
        isIdle: true,
        isStreaming: false,
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: {
          status: "idle",
        },
      } as any);

      rerender();

      await waitFor(() => {
        expect(result.current.selectedSuggestionId).toBeNull();
      });
    });

    it("exposes mutation and query results", async () => {
      jest.mocked(useTamboV1).mockReturnValue({
        messages: [
          {
            id: "msg_1",
            role: "assistant",
            content: [],
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        thread: undefined,
        isIdle: true,
        isStreaming: false,
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: {
          status: "idle",
        },
      } as any);

      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      expect(result.current.acceptResult).toBeDefined();
      expect(result.current.generateResult).toBeDefined();
      expect(result.current.suggestionsResult).toBeDefined();
    });

    it("exposes combined mutation results (isPending, isError, error)", () => {
      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
