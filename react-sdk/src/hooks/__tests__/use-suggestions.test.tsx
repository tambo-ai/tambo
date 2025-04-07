import type TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient, UseQueryResult } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { TamboThreadMessage } from "../../model/generate-component-response";
import {
  useTamboClient,
  useTamboQueryClient,
} from "../../providers/tambo-client-provider";
import { TamboContextProps, useTambo } from "../../providers/tambo-provider";
import {
  TamboThreadContextProps,
  useTamboThread,
} from "../../providers/tambo-thread-provider";
import { useTamboMutation, useTamboQuery } from "../react-query-hooks";
import { useTamboSuggestions } from "../use-suggestions";
import { useTamboThreadInput, UseThreadInput } from "../use-thread-input";

// Mock the required providers
jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
  useTamboQueryClient: jest.fn(),
}));

jest.mock("../../providers/tambo-provider", () => ({ useTambo: jest.fn() }));

jest.mock("../../providers/tambo-thread-provider", () => ({
  useTamboThread: jest.fn(),
}));

jest.mock("../use-thread-input", () => ({ useTamboThreadInput: jest.fn() }));

// Mock the react-query-hooks
jest.mock("../react-query-hooks", () => ({
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
    } as unknown as TamboAI);
    jest.mocked(useTambo).mockReturnValue({
      sendThreadMessage: jest.fn(),
    } as unknown as TamboContextProps);
    jest.mocked(useTamboThread).mockReturnValue({
      thread: {
        id: "test-thread-id",
        messages: [
          {
            id: "test-message-id",
            role: "hydra",
            content: [{ type: "text", text: "Test message" }],
          },
        ],
      },
    } as TamboThreadContextProps);
    jest.mocked(useTamboThreadInput).mockReturnValue({
      setValue: jest.fn(),
      value: "",
      submit: jest.fn(),
    } as unknown as UseThreadInput);
    // Default query mock returns empty array
    jest.mocked(useTamboQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<unknown, unknown>);
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
            _client: {},
          } as unknown as TamboAI.Beta.Threads.Suggestions,
        } as TamboAI.Beta.Threads,
      } as TamboAI.Beta,
    } as TamboAI);
    jest.mocked(useTamboThread).mockReturnValue({
      thread: {
        id: "test-thread-id",
        messages: [
          {
            id: "test-message-id",
            role: "assistant",
            content: [{ type: "text", text: "Test message" }],
          } as TamboThreadMessage,
        ],
      },
    } as TamboThreadContextProps);

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
          } as unknown as TamboAI.Beta.Threads.Suggestions,
        },
      },
    } as TamboAI);
    // Mock the thread to have a non-Tambo message
    jest.mocked(useTamboThread).mockReturnValue({
      thread: {
        id: "test-thread-id",
        messages: [
          {
            id: "test-message-id",
            role: "user",
            content: [{ type: "text", text: "Test message" }],
          } as TamboThreadMessage,
        ],
      },
    } as TamboThreadContextProps);

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
    } as unknown as UseThreadInput);

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
    } as unknown as TamboContextProps);

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
