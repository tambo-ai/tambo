"use client";

/**
 * useTamboSuggestions - Suggestions Hook
 *
 * Manages AI-powered suggestions for thread messages.
 * Uses the API endpoints for listing and creating suggestions.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { UseQueryOptions } from "@tanstack/react-query";
import type {
  SuggestionCreateResponse,
  SuggestionListResponse,
} from "@tambo-ai/typescript-sdk/resources/threads/suggestions";
import type { Suggestion } from "@tambo-ai/typescript-sdk/resources/beta/threads/suggestions";
import {
  useTamboClient,
  useTamboQueryClient,
} from "../../providers/tambo-client-provider";
import { useTamboQuery, useTamboMutation } from "../../hooks/react-query-hooks";
import { useTamboRegistry } from "../../providers/tambo-registry-provider";
import { useTamboConfig } from "../providers/tambo-v1-provider";
import { useTambo } from "./use-tambo-v1";
import { useTamboThreadInput } from "./use-tambo-v1-thread-input";
import { toAvailableComponents } from "../utils/registry-conversion";

/**
 * Response type for suggestions queries (union of list and create responses)
 */
type SuggestionsQueryResponse =
  | SuggestionListResponse
  | SuggestionCreateResponse;

/**
 * Configuration options for the useTamboSuggestions hook
 */
export interface UseTamboSuggestionsOptions {
  /** Maximum number of suggestions to generate (1-10, default 3) */
  maxSuggestions?: number;
  /**
   * Whether to automatically generate suggestions when the latest message is from the assistant.
   * Default: true
   */
  autoGenerate?: boolean;
  /**
   * Additional React Query options for the suggestions query.
   * Allows customizing caching, refetching behavior, etc.
   */
  queryOptions?: Omit<
    UseQueryOptions<SuggestionsQueryResponse>,
    "queryKey" | "queryFn" | "enabled"
  >;
}

/**
 * Options for accepting a suggestion
 */
export interface AcceptSuggestionOptions {
  /** The suggestion to accept */
  suggestion: Suggestion;
  /** Whether to automatically submit the suggestion after accepting (default: false) */
  shouldSubmit?: boolean;
}

/**
 * Return type for useTamboSuggestions hook
 */
export interface UseTamboSuggestionsReturn {
  // ---------------------------------------------------------------------------
  // Data (mirrors react-query patterns)
  // ---------------------------------------------------------------------------

  /**
   * The raw response data from the suggestions query.
   * Use this for direct access to the API response shape.
   */
  data: SuggestionsQueryResponse | undefined;

  /** List of available suggestions for the current message (convenience accessor) */
  suggestions: Suggestion[];

  // ---------------------------------------------------------------------------
  // Query state (matches react-query UseQueryResult)
  // ---------------------------------------------------------------------------

  /** Whether the suggestions query is loading (first fetch) */
  isLoading: boolean;

  /** Whether suggestions have been successfully loaded */
  isSuccess: boolean;

  /** Whether there was an error loading suggestions */
  isError: boolean;

  /** Error from loading suggestions, if any */
  error: Error | null;

  /** Whether the query is currently fetching (includes background refetches) */
  isFetching: boolean;

  // ---------------------------------------------------------------------------
  // Generate mutation (for manual suggestion generation)
  // ---------------------------------------------------------------------------

  /**
   * Manually generate new suggestions for the current message.
   * Use this when autoGenerate is false or to refresh suggestions.
   */
  generate: () => Promise<SuggestionCreateResponse | undefined>;

  /** Whether suggestions are being generated (mutation pending) */
  isGenerating: boolean;

  /** Error from generating suggestions, if any */
  generateError: Error | null;

  // ---------------------------------------------------------------------------
  // Accept mutation (for applying a suggestion)
  // ---------------------------------------------------------------------------

  /**
   * Accept and apply a suggestion.
   * Sets the suggestion text as input value, optionally submitting it.
   */
  accept: (options: AcceptSuggestionOptions) => Promise<void>;

  /** Whether accepting a suggestion is in progress */
  isAccepting: boolean;

  /** Error from accepting a suggestion, if any */
  acceptError: Error | null;

  // ---------------------------------------------------------------------------
  // UI state
  // ---------------------------------------------------------------------------

  /** ID of the currently selected suggestion */
  selectedSuggestionId: string | null;
}

/**
 * Hook for managing AI-powered suggestions in a thread.
 *
 * Provides functionality to:
 * - Automatically generate suggestions when an assistant message arrives
 * - Manually generate suggestions on demand
 * - Accept suggestions by setting them as input or auto-submitting
 * @param options - Configuration options
 * @returns Suggestions state and control functions
 * @example
 * ```tsx
 * function SuggestionsPanel() {
 *   const {
 *     suggestions,
 *     accept,
 *     isLoading,
 *     selectedSuggestionId,
 *   } = useTamboSuggestions();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       {suggestions.map((suggestion) => (
 *         <button
 *           key={suggestion.id}
 *           onClick={() => accept({ suggestion })}
 *           className={selectedSuggestionId === suggestion.id ? 'selected' : ''}
 *         >
 *           {suggestion.title}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTamboSuggestions(
  options: UseTamboSuggestionsOptions = {},
): UseTamboSuggestionsReturn {
  const { maxSuggestions = 3, autoGenerate = true, queryOptions } = options;

  const client = useTamboClient();
  const { userKey } = useTamboConfig();
  const { componentList } = useTamboRegistry();
  const queryClient = useTamboQueryClient();

  const { messages, isIdle, currentThreadId } = useTambo();
  const { setValue: setInputValue, submit } = useTamboThreadInput();

  const [selectedSuggestionId, setSelectedSuggestionId] = useState<
    string | null
  >(null);

  // Get the latest message info
  const latestMessage = messages[messages.length - 1];
  const isLatestFromAssistant = latestMessage?.role === "assistant";
  const latestMessageId = latestMessage?.id;

  // Reset selected suggestion when the message changes
  useEffect(() => {
    setSelectedSuggestionId(null);
  }, [latestMessageId]);

  // Determine if we should fetch/generate suggestions
  const shouldFetchSuggestions =
    currentThreadId &&
    latestMessageId &&
    isLatestFromAssistant &&
    isIdle &&
    autoGenerate;

  const suggestionsQueryKey = [
    "v1-suggestions",
    currentThreadId ?? null,
    latestMessageId ?? null,
  ] as const;

  // Query to list existing suggestions
  const suggestionsQuery = useTamboQuery({
    queryKey: suggestionsQueryKey,
    queryFn: async (): Promise<SuggestionsQueryResponse> => {
      if (!shouldFetchSuggestions || !latestMessageId || !currentThreadId) {
        return { suggestions: [], hasMore: false };
      }

      return await client.threads.suggestions.list(latestMessageId, {
        threadId: currentThreadId,
        userKey,
      });
    },
    ...queryOptions,
    enabled: Boolean(shouldFetchSuggestions),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  // Mutation to manually generate suggestions
  const generateMutation = useTamboMutation({
    mutationFn: async () => {
      if (!currentThreadId || !latestMessageId || !isLatestFromAssistant) {
        return undefined;
      }

      const availableComponents = toAvailableComponents(componentList);

      return await client.threads.suggestions.create(latestMessageId, {
        threadId: currentThreadId,
        maxSuggestions,
        availableComponents,
        userKey,
      });
    },
    onSuccess: (data) => {
      if (data && currentThreadId && latestMessageId) {
        // Update the query cache with new suggestions
        queryClient.setQueryData(suggestionsQueryKey, data);
      }
    },
  });

  const lastAutoGenerateMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    lastAutoGenerateMessageIdRef.current = null;
  }, [latestMessageId]);

  const listSuggestionsCount = suggestionsQuery.data?.suggestions.length ?? 0;
  const generateMutate = generateMutation.mutate;
  const isGenerating = generateMutation.isPending;
  const isListError = suggestionsQuery.isError;
  const isListSuccess = suggestionsQuery.isSuccess;

  useEffect(() => {
    if (!shouldFetchSuggestions || !latestMessageId) {
      return;
    }

    if (listSuggestionsCount > 0) {
      return;
    }

    const shouldAutoGenerate =
      (isListSuccess && listSuggestionsCount === 0) || isListError;

    if (!shouldAutoGenerate) {
      return;
    }

    if (isGenerating) {
      return;
    }

    if (lastAutoGenerateMessageIdRef.current === latestMessageId) {
      return;
    }

    lastAutoGenerateMessageIdRef.current = latestMessageId;
    generateMutate();
  }, [
    generateMutate,
    isGenerating,
    isListError,
    isListSuccess,
    latestMessageId,
    listSuggestionsCount,
    shouldFetchSuggestions,
  ]);

  // Mutation to accept a suggestion
  const acceptMutation = useTamboMutation({
    mutationFn: async ({
      suggestion,
      shouldSubmit = false,
    }: AcceptSuggestionOptions) => {
      const text = suggestion.description?.trim();
      if (!text) {
        throw new Error("Suggestion has no content");
      }

      if (shouldSubmit) {
        // Set value and submit
        setInputValue(text);
        await submit();
      } else {
        // Just set the input value
        setInputValue(text);
      }

      setSelectedSuggestionId(suggestion.id);
    },
  });

  // Generate callback
  const generateMutateAsync = generateMutation.mutateAsync;
  const generate = useCallback(async () => {
    return await generateMutateAsync();
  }, [generateMutateAsync]);

  // Accept callback
  const accept = useCallback(
    async (acceptOptions: AcceptSuggestionOptions) => {
      await acceptMutation.mutateAsync(acceptOptions);
    },
    [acceptMutation],
  );

  // Get suggestions from query or mutation result
  const queryData = suggestionsQuery.data;
  const mutationData = generateMutation.data;

  // Use mutation data if available (more recent), otherwise query data
  const currentData = mutationData ?? queryData;
  const suggestions = isLatestFromAssistant
    ? (currentData?.suggestions ?? [])
    : [];

  return {
    // Data
    data: currentData,
    suggestions,

    // Query state (matches react-query patterns)
    isLoading: suggestionsQuery.isLoading,
    isSuccess: suggestionsQuery.isSuccess,
    isError: suggestionsQuery.isError,
    error: suggestionsQuery.error,
    isFetching: suggestionsQuery.isFetching,

    // Generate mutation
    generate,
    isGenerating: generateMutation.isPending,
    generateError: generateMutation.error,

    // Accept mutation
    accept,
    isAccepting: acceptMutation.isPending,
    acceptError: acceptMutation.error,

    // UI state
    selectedSuggestionId,
  };
}
