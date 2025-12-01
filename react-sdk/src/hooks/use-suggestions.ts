"use client";
import TamboAI from "@tambo-ai/typescript-sdk";
import { useEffect, useState } from "react";
import { isIdleStage } from "../model/generate-component-response";
import { validateInput } from "../model/validate-input";
import { useTamboClient } from "../providers/tambo-client-provider";
import { useTambo } from "../providers/tambo-provider";
import { useTamboRegistry } from "../providers/tambo-registry-provider";
import {
  INPUT_ERROR_MESSAGES,
  useTamboThreadInput,
} from "../providers/tambo-thread-input-provider";
import { useTamboThread } from "../providers/tambo-thread-provider";
import {
  CombinedMutationResult,
  combineMutationResults,
} from "../util/query-utils";
import { getAvailableComponents } from "../util/registry";
import {
  UseTamboMutationResult,
  UseTamboQueryResult,
  useTamboMutation,
  useTamboQuery,
} from "./react-query-hooks";

/**
 * Configuration options for the useTamboSuggestions hook
 */
export interface useTamboSuggestionsOptions {
  /** Maximum number of suggestions to generate (1-10, default 3) */
  maxSuggestions?: number;
}

/**
 * Return value interface for useTamboSuggestions hook
 */
export interface useTamboSuggestionsResultInternal {
  /** List of available suggestions (also available in generateResult.data) */
  suggestions: TamboAI.Beta.Threads.Suggestion[];
  /** ID of the currently selected suggestion */
  selectedSuggestionId: string | null;
  /**
   * Accept and apply a suggestion (also available in acceptResult.mutateAsync)
   * @param suggestion - The suggestion to accept
   * @param shouldSubmit - Whether to automatically submit after accepting (default: false)
   */
  accept: (acceptOptions: {
    suggestion: TamboAI.Beta.Threads.Suggestion;
    shouldSubmit?: boolean;
  }) => Promise<void>;

  /** Result and network state for accepting a suggestion */
  acceptResult: UseTamboMutationResult<
    void,
    Error,
    { suggestion: TamboAI.Beta.Threads.Suggestion; shouldSubmit?: boolean }
  >;

  /** Result and network state for generating suggestions */
  generateResult: UseTamboMutationResult<
    TamboAI.Beta.Threads.Suggestions.SuggestionGenerateResponse | undefined,
    Error,
    AbortController
  >;

  /** The full suggestions query object from React Query */
  suggestionsResult: UseTamboQueryResult<
    TamboAI.Beta.Threads.Suggestions.SuggestionGenerateResponse | undefined
  >;
}

type useTamboSuggestionsResult = CombinedMutationResult<any, Error> &
  useTamboSuggestionsResultInternal;

/**
 * Hook for managing Tambo AI suggestions in a thread
 * @param options - Configuration options for suggestion generation
 * @returns Object containing suggestions state and control functions
 */
export function useTamboSuggestions(
  options: useTamboSuggestionsOptions = {},
): useTamboSuggestionsResult {
  const { maxSuggestions = 3 } = options;
  const { thread, generationStage } = useTamboThread();
  const { sendThreadMessage } = useTambo();
  const tamboClient = useTamboClient();
  const { componentList, toolRegistry, componentToolAssociations } =
    useTamboRegistry();

  const [selectedSuggestionId, setSelectedSuggestionId] = useState<
    string | null
  >(null);
  const { setValue: setInputValue } = useTamboThreadInput();

  const latestMessage = thread.messages[thread.messages.length - 1];
  const isLatestFromTambo = latestMessage?.role === "assistant";
  const latestMessageId = latestMessage?.id;

  // Reset selected suggestion when the message changes
  useEffect(() => {
    setSelectedSuggestionId(null);
  }, [latestMessageId]);

  const shouldGenerateSuggestions =
    latestMessageId && isLatestFromTambo && isIdleStage(generationStage);
  // Use React Query to fetch suggestions when a new hydra message is received
  const suggestionsResult = useTamboQuery({
    // Make sure the query key changes when the message changes, so that we are
    // always generating suggestions when there is a new message
    queryKey: [
      "suggestions",
      shouldGenerateSuggestions ? latestMessageId : null,
    ],
    queryFn: async () => {
      if (!shouldGenerateSuggestions) {
        return [];
      }

      // Get registered components from the registry
      const components = getAvailableComponents(
        componentList,
        toolRegistry,
        componentToolAssociations,
      );

      return await tamboClient.beta.threads.suggestions.generate(
        latestMessageId,
        {
          id: thread.id,
          maxSuggestions,
          availableComponents: components,
        },
      );
    },
    // Only run the query if we have a valid message from hydra
    enabled: Boolean(latestMessageId && isLatestFromTambo),
    // Don't refetch on window focus or reconnect
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Don't retry on failure
    retry: false,
  });

  // Accept suggestion mutation
  const acceptMutationState = useTamboMutation<
    void,
    Error,
    { suggestion: TamboAI.Beta.Threads.Suggestion; shouldSubmit?: boolean }
  >({
    mutationFn: async ({ suggestion, shouldSubmit = false }) => {
      const validation = validateInput(suggestion.detailedSuggestion);
      if (!validation.isValid) {
        if (validation.error) {
          throw validation.error;
        }
        throw new Error(INPUT_ERROR_MESSAGES.VALIDATION);
      }

      if (shouldSubmit) {
        await sendThreadMessage(validation.sanitizedInput, {
          threadId: thread.id,
        });
      } else {
        setInputValue(validation.sanitizedInput);
      }
      setSelectedSuggestionId(suggestion.id);
    },
  });

  // Generate suggestions mutation
  const generateMutationState = useTamboMutation<
    TamboAI.Beta.Threads.Suggestions.SuggestionGenerateResponse | undefined,
    Error,
    AbortController
  >({
    mutationFn: async (abortController: AbortController) => {
      if (!shouldGenerateSuggestions) {
        return undefined;
      }

      // Get registered components from the registry
      const components = getAvailableComponents(
        componentList,
        toolRegistry,
        componentToolAssociations,
      );
      return await tamboClient.beta.threads.suggestions.generate(
        latestMessageId,
        {
          id: thread.id,
          maxSuggestions,
          availableComponents: components,
        },
        { signal: abortController.signal },
      );
    },
    // Don't retry on failure
    retry: false,
  });

  // Use the query data if available, otherwise use the mutation data
  // Only return suggestions if the latest message is from hydra
  const suggestions = isLatestFromTambo
    ? (suggestionsResult.data ?? generateMutationState.data ?? [])
    : [];

  return {
    suggestions,
    accept: acceptMutationState.mutateAsync,
    selectedSuggestionId,
    acceptResult: acceptMutationState,
    generateResult: generateMutationState,
    suggestionsResult,
    ...combineMutationResults(acceptMutationState, generateMutationState),
  };
}
