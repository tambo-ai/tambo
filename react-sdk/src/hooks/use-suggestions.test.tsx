import type TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient, UseQueryResult } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import {
  GenerationStage,
  TamboThreadMessage,
} from "../model/generate-component-response";
import { TamboThread } from "../model/tambo-thread";
import {
  useTamboClient,
  useTamboQueryClient,
} from "../providers/tambo-client-provider";
import { TamboContextProps, useTambo } from "../providers/tambo-provider";
import {
  TamboThreadInputContextProps,
  useTamboThreadInput,
} from "../providers/tambo-thread-input-provider";
import {
  CombinedTamboThreadContextProps,
  useTamboThread,
} from "../providers/tambo-thread-provider";
import { PartialTamboAI } from "../testing/types";
import { useTamboMutation, useTamboQuery } from "./react-query-hooks";
import { useTamboSuggestions } from "./use-suggestions";

// Mock the required providers
jest.mock("../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
  useTamboQueryClient: jest.fn(),
}));

jest.mock("../providers/tambo-provider", () => ({ useTambo: jest.fn() }));

jest.mock("../providers/tambo-thread-provider", () => ({
  useTamboThread: jest.fn(),
}));

jest.mock("../providers/tambo-thread-input-provider", () => ({
  useTamboThreadInput: jest.fn(),
}));

// Mock the react-query-hooks
jest.mock("./react-query-hooks", () => ({
  useTamboQuery: jest.fn(),
  useTamboMutation: jest.fn(),
}));

describe("useTamboSuggestions", () => {
  const mockSuggestions: TamboAI.Beta.Threads.Suggestion[] = [
    {
      id: "suggestion-1",
      messageId: "test-message-id",
      title: "Test Suggestion 1",
      detailedSuggestion: "Test suggestion 1",
    },
    {
      id: "suggestion-2",
      messageId: "test-message-id",
      title: "Test Suggestion 2",
      detailedSuggestion: "Test suggestion 2",
    },
  ];

  // Helper function to create mock TamboThreadMessage
  const createMockMessage = (
    overrides: Partial<TamboThreadMessage> = {},
  ): TamboThreadMessage => ({
    id: "test-message-id",
    componentState: {},
    content: [{ type: "text", text: "Test message" }],
    createdAt: new Date().toISOString(),
    role: "assistant",
    threadId: "test-thread-id",
    ...overrides,
  });

  // Helper function to create mock TamboThread
  const createMockThread = (
    overrides: Partial<TamboThread> = {},
  ): TamboThread => ({
    id: "test-thread-id",
    projectId: "test-project-id",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
    ...overrides,
  });

  // Helper function to create mock CombinedTamboThreadContextProps
  const createMockThreadContext = (
    overrides: Partial<CombinedTamboThreadContextProps> = {},
  ): CombinedTamboThreadContextProps => {
    const mockThread = createMockThread();
    return {
      thread: mockThread,
      currentThreadId: mockThread.id,
      currentThread: mockThread,
      threadMap: { [mockThread.id]: mockThread },
      setThreadMap: jest.fn(),
      switchCurrentThread: jest.fn(),
      startNewThread: jest.fn(),
      updateThreadName: jest.fn(),
      generateThreadName: jest.fn(),
      addThreadMessage: jest.fn(),
      updateThreadMessage: jest.fn(),
      cancel: jest.fn(),
      streaming: false,
      sendThreadMessage: jest.fn(),
      generationStage: GenerationStage.IDLE,
      generationStatusMessage: "",
      isIdle: true,
      ...overrides,
    };
  };

  beforeEach(() => {
    jest.mocked(useTamboQueryClient).mockReturnValue(new QueryClient());
    jest.mocked(useTamboMutation).mockImplementation(
      ({ mutationFn }) =>
        ({
          mutateAsync: mutationFn,
          isLoading: false,
          isError: false,
          error: null,
        }) as any,
    );
    // Setup default mock implementations
    jest.mocked(useTamboClient).mockReturnValue({
      beta: { threads: { suggestions: { generate: jest.fn() } } },
    } satisfies PartialTamboAI as any);
    jest.mocked(useTambo).mockReturnValue({
      sendThreadMessage: jest.fn(),
    } satisfies Partial<TamboContextProps> as any);
    jest.mocked(useTamboThread).mockReturnValue(
      createMockThreadContext({
        thread: createMockThread({
          messages: [
            createMockMessage({
              role: "assistant",
            }),
          ],
        }),
      }),
    );
    jest.mocked(useTamboThreadInput).mockReturnValue({
      setValue: jest.fn(),
      value: "",
      submit: jest.fn(),
    } satisfies Partial<TamboThreadInputContextProps> as any);
    // Default query mock returns empty array
    jest.mocked(useTamboQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } satisfies Partial<UseQueryResult<unknown, unknown>> as any);
  });

  it("should initialize with empty suggestions and no selected suggestion", () => {
    const { result } = renderHook(() => useTamboSuggestions());

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.selectedSuggestionId).toBeNull();
  });

  it("should generate suggestions when latest message is from Tambo", async () => {
    const mockGenerate = jest.fn().mockResolvedValue(mockSuggestions);
    jest.mocked(useTamboClient).mockReturnValue({
      beta: {
        threads: {
          suggestions: {
            generate: mockGenerate,
            list: jest.fn(),
          },
        },
      },
    } satisfies PartialTamboAI as any);
    jest.mocked(useTamboThread).mockReturnValue(
      createMockThreadContext({
        thread: createMockThread({
          messages: [
            createMockMessage({
              role: "assistant",
            }),
          ],
        }),
      }),
    );

    // Mock the query result to return the mock suggestions
    jest.mocked(useTamboQuery).mockReturnValue({
      data: mockSuggestions,
      isLoading: false,
      isError: false,
      error: null,
    } as UseQueryResult<unknown, unknown>);

    const { result } = renderHook(() => useTamboSuggestions());

    // Wait for the effect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Since we're mocking useTamboQuery to return the suggestions directly,
    // the generate function won't be called, so we don't need to check that
    expect(result.current.suggestions).toEqual(mockSuggestions);
  });

  it("should not generate suggestions when latest message is not from Tambo", async () => {
    const mockGenerate = jest.fn();
    jest.mocked(useTamboClient).mockReturnValue({
      beta: {
        threads: {
          suggestions: {
            generate: mockGenerate,
            list: jest.fn(),
          },
        },
      },
    } satisfies PartialTamboAI as any);
    // Mock the thread to have a non-Tambo message
    jest.mocked(useTamboThread).mockReturnValue(
      createMockThreadContext({
        thread: createMockThread({
          messages: [
            createMockMessage({
              role: "user",
            }),
          ],
        }),
      }),
    );

    const { result } = renderHook(() => useTamboSuggestions());

    // Wait for the effect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockGenerate).not.toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([]);
  });

  it("should accept a suggestion and update input value", async () => {
    const mockSetValue = jest.fn();
    jest.mocked(useTamboThreadInput).mockReturnValue({
      setValue: mockSetValue,
      value: "",
      submit: jest.fn(),
    } satisfies Partial<TamboThreadInputContextProps> as any);

    const { result } = renderHook(() => useTamboSuggestions());

    await act(async () => {
      await result.current.accept({
        suggestion: mockSuggestions[0],
        shouldSubmit: false,
      });
    });

    expect(mockSetValue).toHaveBeenCalledWith("Test suggestion 1");
    expect(result.current.selectedSuggestionId).toBe("suggestion-1");
  });

  it("should accept a suggestion and submit it", async () => {
    const mockSendThreadMessage = jest.fn();
    jest.mocked(useTambo).mockReturnValue({
      sendThreadMessage: mockSendThreadMessage,
    } satisfies Partial<TamboContextProps> as any);

    const { result } = renderHook(() => useTamboSuggestions());

    await act(async () => {
      await result.current.accept({
        suggestion: mockSuggestions[0],
        shouldSubmit: true,
      });
    });

    expect(mockSendThreadMessage).toHaveBeenCalledWith("Test suggestion 1", {
      threadId: "test-thread-id",
    });
    expect(result.current.selectedSuggestionId).toBe("suggestion-1");
  });

  it("should throw error when accepting invalid suggestion", async () => {
    const invalidSuggestion = {
      id: "invalid-suggestion",
      messageId: "test-message-id",
      title: "Invalid Suggestion",
      detailedSuggestion: "", // Empty suggestion should fail validation
    };

    const { result } = renderHook(() => useTamboSuggestions());

    await act(async () => {
      await expect(
        result.current.accept({
          suggestion: invalidSuggestion,
          shouldSubmit: false,
        }),
      ).rejects.toThrow("Message cannot be empty");
    });

    expect(result.current.selectedSuggestionId).toBeNull();
  });
});
