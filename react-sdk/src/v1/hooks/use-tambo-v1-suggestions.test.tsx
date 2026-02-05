import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Suggestion } from "@tambo-ai/typescript-sdk/resources/beta/threads/suggestions";
import { useTamboV1Suggestions } from "./use-tambo-v1-suggestions";
import { useTamboV1ThreadInput } from "./use-tambo-v1-thread-input";
import { useTamboV1 } from "./use-tambo-v1";
import {
  useTamboClient,
  useTamboQueryClient,
} from "../../providers/tambo-client-provider";
import { useTamboRegistry } from "../../providers/tambo-registry-provider";
import { useTamboV1Config } from "../providers/tambo-v1-provider";

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

jest.mock("../providers/tambo-v1-provider", () => ({
  useTamboV1Config: jest.fn(),
}));

describe("useTamboV1Suggestions", () => {
  let queryClient: QueryClient;
  const mockSetValue = jest.fn();
  const mockSubmit = jest.fn();
  const mockListSuggestions = jest.fn();
  const mockCreateSuggestions = jest.fn();

  const mockSuggestions: Suggestion[] = [
    {
      id: "suggestion_1",
      messageId: "msg_1",
      title: "What's the weather?",
      detailedSuggestion: "What's the weather like today?",
    },
    {
      id: "suggestion_2",
      messageId: "msg_1",
      title: "Tell me a joke",
      detailedSuggestion: "Can you tell me a funny joke?",
    },
  ];

  const mockSuggestionsResponse = {
    suggestions: mockSuggestions,
    hasMore: false,
    nextCursor: undefined,
  };

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

    // Mock useTamboQueryClient to return the test's queryClient
    jest.mocked(useTamboQueryClient).mockReturnValue(queryClient);

    // Default mock for v1 config
    jest.mocked(useTamboV1Config).mockReturnValue({ userKey: "user_123" });

    // Default mock for thread input
    jest.mocked(useTamboV1ThreadInput).mockReturnValue({
      value: "",
      setValue: mockSetValue,
      submit: mockSubmit,
      isPending: false,
      isError: false,
      error: null,
      isSuccess: false,
      reset: jest.fn(),
    } as any);

    // Default mock for useTamboV1
    jest.mocked(useTamboV1).mockReturnValue({
      messages: [],
      thread: undefined,
      isIdle: true,
      isStreaming: false,
      currentThreadId: "thread_123",
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

    // Default mock for client - using v1 API structure
    mockListSuggestions.mockResolvedValue({ suggestions: [], hasMore: false });
    mockCreateSuggestions.mockResolvedValue(mockSuggestionsResponse);

    jest.mocked(useTamboClient).mockReturnValue({
      threads: {
        suggestions: {
          list: mockListSuggestions,
          create: mockCreateSuggestions,
        },
      },
    } as any);
  });

  describe("Initial State", () => {
    it("returns empty suggestions when thread has placeholder ID", () => {
      // Mock useTamboV1 to return placeholder thread ID
      jest.mocked(useTamboV1).mockReturnValue({
        messages: [],
        thread: undefined,
        isIdle: true,
        isStreaming: false,
        currentThreadId: "placeholder",
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: { status: "idle" },
      } as any);

      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      expect(result.current.suggestions).toEqual([]);
      expect(result.current.selectedSuggestionId).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

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
        currentThreadId: "thread_123",
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: { status: "idle" },
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
        currentThreadId: "thread_123",
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: { status: "idle" },
      } as any);

      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.suggestions).toHaveLength(2);
      });

      // Should first call list, then create since list returns empty
      expect(mockListSuggestions).toHaveBeenCalledWith("msg_1", {
        threadId: "thread_123",
        userKey: "user_123",
      });
      expect(mockCreateSuggestions).toHaveBeenCalledWith(
        "msg_1",
        expect.objectContaining({
          threadId: "thread_123",
          maxSuggestions: 3,
          userKey: "user_123",
        }),
      );
    });

    it("returns existing suggestions from list without calling create", async () => {
      mockListSuggestions.mockResolvedValue(mockSuggestionsResponse);

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
        currentThreadId: "thread_123",
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: { status: "idle" },
      } as any);

      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.suggestions).toHaveLength(2);
      });

      expect(mockListSuggestions).toHaveBeenCalled();
      expect(mockCreateSuggestions).not.toHaveBeenCalled();
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
        currentThreadId: "thread_123",
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: { status: "streaming", runId: "run_1" },
      } as any);

      renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      expect(mockListSuggestions).not.toHaveBeenCalled();
      expect(mockCreateSuggestions).not.toHaveBeenCalled();
    });

    it("does not generate suggestions when autoGenerate is false", () => {
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
        currentThreadId: "thread_123",
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: { status: "idle" },
      } as any);

      renderHook(() => useTamboV1Suggestions({ autoGenerate: false }), {
        wrapper: createWrapper(),
      });

      expect(mockListSuggestions).not.toHaveBeenCalled();
      expect(mockCreateSuggestions).not.toHaveBeenCalled();
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
        currentThreadId: "thread_123",
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: { status: "idle" },
      } as any);

      const { result } = renderHook(
        () => useTamboV1Suggestions({ maxSuggestions: 5 }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.suggestions).toHaveLength(2);
      });

      expect(mockCreateSuggestions).toHaveBeenCalledWith(
        "msg_1",
        expect.objectContaining({ maxSuggestions: 5 }),
      );
    });
  });

  describe("Accepting Suggestions", () => {
    it("updates input value when accepting without submit", async () => {
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
        currentThreadId: "thread_123",
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: { status: "idle" },
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
        currentThreadId: "thread_123",
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: { status: "idle" },
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

    it("throws error when suggestion has no content", async () => {
      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      const emptySuggestion = {
        id: "empty_suggestion",
        messageId: "msg_1",
        title: "Empty",
        detailedSuggestion: "",
      };

      await expect(
        result.current.accept({ suggestion: emptySuggestion as any }),
      ).rejects.toThrow("Suggestion has no content");
    });

    it("throws error when detailedSuggestion is only whitespace", async () => {
      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      const whitespaceSuggestion = {
        id: "whitespace_suggestion",
        messageId: "msg_1",
        title: "Whitespace",
        detailedSuggestion: "   ",
      };

      await expect(
        result.current.accept({ suggestion: whitespaceSuggestion as any }),
      ).rejects.toThrow("Suggestion has no content");
    });

    it("throws error when detailedSuggestion is undefined", async () => {
      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      const undefinedSuggestion = {
        id: "undefined_suggestion",
        messageId: "msg_1",
        title: "Undefined",
      };

      await expect(
        result.current.accept({ suggestion: undefinedSuggestion as any }),
      ).rejects.toThrow("Suggestion has no content");
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
        currentThreadId: "thread_123",
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: { status: "idle" },
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
        currentThreadId: "thread_123",
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: { status: "idle" },
      } as any);

      rerender();

      await waitFor(() => {
        expect(result.current.selectedSuggestionId).toBeNull();
      });
    });

    it("includes pagination info on raw data", async () => {
      mockListSuggestions.mockResolvedValue({
        suggestions: mockSuggestions,
        hasMore: true,
        nextCursor: "cursor_abc",
      });

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
        currentThreadId: "thread_123",
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: { status: "idle" },
      } as any);

      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data?.hasMore).toBe(true);
        expect(result.current.data?.nextCursor).toBe("cursor_abc");
      });
    });

    it("exposes loading and error states", () => {
      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBeDefined();
      expect(result.current.isSuccess).toBeDefined();
      expect(result.current.isError).toBeDefined();
      expect(result.current.error).toBeDefined();
      expect(result.current.isAccepting).toBe(false);
      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe("Manual Generation", () => {
    it("allows manual generation via generate function", async () => {
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
        currentThreadId: "thread_123",
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: { status: "idle" },
      } as any);

      const { result } = renderHook(
        () => useTamboV1Suggestions({ autoGenerate: false }),
        { wrapper: createWrapper() },
      );

      // No auto-generation
      expect(mockCreateSuggestions).not.toHaveBeenCalled();

      // Manual generation
      await act(async () => {
        await result.current.generate();
      });

      expect(mockCreateSuggestions).toHaveBeenCalledWith(
        "msg_1",
        expect.objectContaining({
          threadId: "thread_123",
        }),
      );
    });

    it("returns undefined from generate when no assistant message", async () => {
      jest.mocked(useTamboV1).mockReturnValue({
        messages: [],
        thread: undefined,
        isIdle: true,
        isStreaming: false,
        currentThreadId: "thread_123",
        startNewThread: jest.fn(),
        switchThread: jest.fn(),
        initThread: jest.fn(),
        streamingState: { status: "idle" },
      } as any);

      const { result } = renderHook(() => useTamboV1Suggestions(), {
        wrapper: createWrapper(),
      });

      let generateResult: any;
      await act(async () => {
        generateResult = await result.current.generate();
      });

      expect(generateResult).toBeUndefined();
    });
  });
});
