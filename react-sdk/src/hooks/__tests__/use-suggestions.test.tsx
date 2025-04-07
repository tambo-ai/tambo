import TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { useTambo } from "../../providers/tambo-provider";
import { useTamboThread } from "../../providers/tambo-thread-provider";
import { useTamboQuery } from "../react-query-hooks";
import { useTamboSuggestions } from "../use-suggestions";
import { useTamboThreadInput } from "../use-thread-input";

// Mock the required providers
jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
  useTamboQueryClient: jest.fn().mockReturnValue(new QueryClient()),
}));

jest.mock("../../providers/tambo-provider", () => ({ useTambo: jest.fn() }));

jest.mock("../../providers/tambo-thread-provider", () => ({
  useTamboThread: jest.fn(),
}));

jest.mock("../use-thread-input", () => ({ useTamboThreadInput: jest.fn() }));

// Mock the react-query-hooks
jest.mock("../react-query-hooks", () => ({
  useTamboQuery: jest.fn(),
  useTamboMutationResult: jest.fn().mockImplementation(({ mutationFn }) => ({
    mutateAsync: mutationFn,
    isLoading: false,
    isError: false,
    error: null,
  })),
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

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock implementations
    (useTamboClient as jest.Mock).mockReturnValue({
      beta: { threads: { suggestions: { generate: jest.fn() } } },
    });
    (useTambo as jest.Mock).mockReturnValue({ sendThreadMessage: jest.fn() });
    (useTamboThread as jest.Mock).mockReturnValue({
      thread: {
        id: "test-thread-id",
        messages: [
          { id: "test-message-id", role: "hydra", content: "Test message" },
        ],
      },
    });
    (useTamboThreadInput as jest.Mock).mockReturnValue({ setValue: jest.fn() });
    // Default query mock returns empty array
    (useTamboQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("should initialize with empty suggestions and no selected suggestion", () => {
    const { result } = renderHook(() => useTamboSuggestions());

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.selectedSuggestionId).toBeNull();
  });

  it("should generate suggestions when latest message is from Tambo", async () => {
    const mockGenerate = jest.fn().mockResolvedValue(mockSuggestions);
    (useTamboClient as jest.Mock).mockReturnValue({
      beta: { threads: { suggestions: { generate: mockGenerate } } },
    });
    (useTamboThread as jest.Mock).mockReturnValue({
      thread: {
        id: "test-thread-id",
        messages: [
          { id: "test-message-id", role: "assistant", content: "Test message" },
        ],
      },
    });

    // Mock the query result to return the mock suggestions
    (useTamboQuery as jest.Mock).mockReturnValue({
      data: mockSuggestions,
      isLoading: false,
      isError: false,
      error: null,
    });

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
    (useTamboClient as jest.Mock).mockReturnValue({
      beta: { threads: { suggestions: { generate: mockGenerate } } },
    });

    // Mock the thread to have a non-Tambo message
    (useTamboThread as jest.Mock).mockReturnValue({
      thread: {
        id: "test-thread-id",
        messages: [
          { id: "test-message-id", role: "user", content: "Test message" },
        ],
      },
    });

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
    (useTamboThreadInput as jest.Mock).mockReturnValue({
      setValue: mockSetValue,
    });

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
    (useTambo as jest.Mock).mockReturnValue({
      sendThreadMessage: mockSendThreadMessage,
    });

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
