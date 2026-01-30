"use client";

/**
 * useTamboV1Suggestions - Suggestions Hook for v1 API
 *
 * Provides AI-generated suggestions based on the current thread state.
 * Uses the shared thread input context so accepting a suggestion
 * automatically updates the input field.
 */

import TamboAI from "@tambo-ai/typescript-sdk";
import { useCallback, useEffect, useState } from "react";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { useTamboRegistry } from "../../providers/tambo-registry-provider";
import { getAvailableComponents } from "../../util/registry";
import {
  useTamboMutation,
  useTamboQuery,
  type UseTamboMutationResult,
  type UseTamboQueryResult,
} from "../../hooks/react-query-hooks";
import {
  CombinedMutationResult,
  combineMutationResults,
} from "../../util/query-utils";
import { useTamboV1 } from "./use-tambo-v1";
import { useTamboV1ThreadInput } from "./use-tambo-v1-thread-input";

type Suggestion = TamboAI.Beta.Threads.Suggestion;

// The SDK defines this as an alias of `Suggestion[]`.
type SuggestionGenerateResponse =
  TamboAI.Beta.Threads.Suggestions.SuggestionGenerateResponse;

type SuggestionsMutationData = void | SuggestionGenerateResponse;

function normalizeSuggestionGenerateResponse(
  response: unknown,
): SuggestionGenerateResponse {
  if (response === undefined) {
    return [];
  }

  if (Array.isArray(response)) {
    return response as SuggestionGenerateResponse;
  }

  throw new Error(
    "Unexpected suggestions.generate response shape; expected an array",
  );
}

/**
 * Configuration options for the useTamboV1Suggestions hook
 */
export interface UseTamboV1SuggestionsOptions {
  /** Maximum number of suggestions to generate (1-10, default 3) */
  maxSuggestions?: number;
}

/**
 * Return value interface for useTamboV1Suggestions hook
 */
export interface UseTamboV1SuggestionsResultInternal {
  /** List of available suggestions */
  suggestions: Suggestion[];

  /** ID of the currently selected suggestion */
  selectedSuggestionId: string | null;

  /**
   * Accept and apply a suggestion.
   * If shouldSubmit is false, updates the shared input context value.
   * If shouldSubmit is true, submits the suggestion directly.
   * @param suggestion - The suggestion to accept
   * @param shouldSubmit - Whether to automatically submit after accepting (default: false)
   */
  accept: (acceptOptions: {
    suggestion: Suggestion;
    shouldSubmit?: boolean;
  }) => Promise<void>;

  /** Result and network state for accepting a suggestion */
  acceptResult: UseTamboMutationResult<
    void,
    Error,
    { suggestion: Suggestion; shouldSubmit?: boolean }
  >;

  /** Result and network state for generating suggestions */
  generateResult: UseTamboMutationResult<
    SuggestionGenerateResponse,
    Error,
    AbortController
  >;

  /** The full suggestions query object from React Query */
  suggestionsResult: UseTamboQueryResult<SuggestionGenerateResponse>;
}

type UseTamboV1SuggestionsResult = CombinedMutationResult<
  SuggestionsMutationData,
  Error
> &
  UseTamboV1SuggestionsResultInternal;

/**
 * Hook for managing Tambo AI suggestions in a v1 thread.
 *
 * Automatically generates suggestions when the latest message is from the assistant
 * and the thread is idle (not streaming).
 *
 * Uses the shared thread input context, so accepting a suggestion without submitting
 * will automatically update the input field value for any component using
 * useTamboV1ThreadInput.
 * @param options - Configuration options for suggestion generation
 * @returns Object containing suggestions state and control functions
 * @example
 * ```tsx
 * function SuggestionsPanel() {
 *   const { suggestions, accept, isPending } = useTamboV1Suggestions();
 *
 *   return (
 *     <div>
 *       {suggestions.map(suggestion => (
 *         <button
 *           key={suggestion.id}
 *           onClick={() => accept({ suggestion })}
 *           disabled={isPending}
 *         >
 *           {suggestion.suggestion}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 *
 * function ChatInput() {
 *   // This input will automatically show the accepted suggestion
 *   const { value, setValue, submit } = useTamboV1ThreadInput();
 *   return <input value={value} onChange={e => setValue(e.target.value)} />;
 * }
 * ```
 */
export function useTamboV1Suggestions(
  options: UseTamboV1SuggestionsOptions = {},
): UseTamboV1SuggestionsResult {
  const { maxSuggestions = 3 } = options;

  // Use shared thread input context
  const { setValue, submit, threadId } = useTamboV1ThreadInput();

  const { messages, isIdle } = useTamboV1(threadId);
  const tamboClient = useTamboClient();
  const { componentList, toolRegistry, componentToolAssociations } =
    useTamboRegistry();

  const [selectedSuggestionId, setSelectedSuggestionId] = useState<
    string | null
  >(null);

  const latestMessage = messages[messages.length - 1];
  const isLatestFromAssistant = latestMessage?.role === "assistant";
  const latestMessageId = latestMessage?.id;

  // Reset selected suggestion when the message changes
  useEffect(() => {
    setSelectedSuggestionId(null);
  }, [latestMessageId]);

  const shouldGenerateSuggestions =
    latestMessageId && isLatestFromAssistant && isIdle && threadId;

  // Use React Query to fetch suggestions when conditions are met
  const suggestionsResult = useTamboQuery<SuggestionGenerateResponse>({
    queryKey: [
      "v1-suggestions",
      shouldGenerateSuggestions ? latestMessageId : null,
    ],
    queryFn: async () => {
      if (!shouldGenerateSuggestions || !threadId || !latestMessageId) {
        return [];
      }

      // Get registered components from the registry
      const components = getAvailableComponents(
        componentList,
        toolRegistry,
        componentToolAssociations,
      );

      const response = await tamboClient.beta.threads.suggestions.generate(
        latestMessageId,
        {
          id: threadId,
          maxSuggestions,
          availableComponents: components,
        },
      );

      return normalizeSuggestionGenerateResponse(response);
    },
    enabled: Boolean(shouldGenerateSuggestions),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  // Accept suggestion mutation
  const acceptMutationState = useTamboMutation<
    void,
    Error,
    { suggestion: Suggestion; shouldSubmit?: boolean }
  >({
    mutationFn: async ({ suggestion, shouldSubmit = false }) => {
      const text = suggestion.detailedSuggestion?.trim();
      if (!text) {
        throw new Error("Suggestion has no detailed content");
      }

      if (shouldSubmit) {
        // Set the value first, then submit
        setValue(text);
        await submit();
      } else {
        // Just update the shared input value
        setValue(text);
      }
      setSelectedSuggestionId(suggestion.id);
    },
  });

  // Generate suggestions mutation (for manual refresh)
  const generateMutationState = useTamboMutation<
    SuggestionGenerateResponse,
    Error,
    AbortController
  >({
    mutationFn: async (abortController: AbortController) => {
      if (!shouldGenerateSuggestions || !threadId || !latestMessageId) {
        return [];
      }

      const components = getAvailableComponents(
        componentList,
        toolRegistry,
        componentToolAssociations,
      );

      const response = await tamboClient.beta.threads.suggestions.generate(
        latestMessageId,
        {
          id: threadId,
          maxSuggestions,
          availableComponents: components,
        },
        { signal: abortController.signal },
      );

      return normalizeSuggestionGenerateResponse(response);
    },
    retry: false,
  });

  // Use query data if available, otherwise use mutation data
  const suggestions = isLatestFromAssistant
    ? (suggestionsResult.data ?? generateMutationState.data ?? [])
    : [];

  const accept = useCallback(
    async (acceptOptions: {
      suggestion: Suggestion;
      shouldSubmit?: boolean;
    }) => {
      await acceptMutationState.mutateAsync(acceptOptions);
    },
    [acceptMutationState],
  );

  return {
    suggestions,
    accept,
    selectedSuggestionId,
    acceptResult: acceptMutationState,
    generateResult: generateMutationState,
    suggestionsResult,
    ...combineMutationResults(acceptMutationState, generateMutationState),
  };
}
