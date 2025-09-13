import TamboAI from "@tambo-ai/typescript-sdk";
import { ref, watch } from "vue";
import { isIdleStage } from "../model/generate-component-response";
import { validateInput } from "../model/validate-input";
import { useTamboClient } from "../providers/tambo-client-provider";
import { useTambo } from "../providers/tambo-provider";
import { useTamboRegistry } from "../providers/tambo-registry-provider";
import { INPUT_ERROR_MESSAGES, useTamboThreadInput } from "../providers/tambo-thread-input-provider";
import { useTamboThread } from "../providers/tambo-thread-provider";
import { combineMutationResults } from "../util/query-utils";
import { getAvailableComponents } from "../util/registry";
import { useTamboMutation, useTamboQuery } from "./vue-query-hooks";

export interface useTamboSuggestionsOptions { maxSuggestions?: number }

export function useTamboSuggestions(options: useTamboSuggestionsOptions = {}) {
  const { maxSuggestions = 3 } = options;
  const { thread, generationStage } = useTamboThread();
  const { sendThreadMessage } = useTambo();
  const tamboClient = useTamboClient();
  const { componentList, toolRegistry, componentToolAssociations } = useTamboRegistry();
  const selectedSuggestionId = ref<string | null>(null);
  const { setValue: setInputValue } = useTamboThreadInput();

  const latestMessage = () => thread.messages[thread.messages.length - 1];
  const isLatestFromTambo = () => latestMessage()?.role === "assistant";
  const latestMessageId = () => latestMessage()?.id;

  watch(latestMessageId, () => { selectedSuggestionId.value = null; });

  const shouldGenerateSuggestions = () => latestMessageId() && isLatestFromTambo() && isIdleStage(generationStage);
  const suggestionsResult = useTamboQuery({
    queryKey: ["suggestions", shouldGenerateSuggestions() ? latestMessageId() : null],
    queryFn: async () => {
      if (!shouldGenerateSuggestions()) return [] as any[];
      const components = getAvailableComponents(componentList, toolRegistry, componentToolAssociations);
      return await tamboClient.beta.threads.suggestions.generate(
        thread.id,
        latestMessageId()!,
        { maxSuggestions, availableComponents: components },
      );
    },
    enabled: Boolean(latestMessageId() && isLatestFromTambo()),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const acceptMutationState = useTamboMutation({
    mutationFn: async ({ suggestion, shouldSubmit = false }: { suggestion: TamboAI.Beta.Threads.Suggestion; shouldSubmit?: boolean }) => {
      const validation = validateInput(suggestion.detailedSuggestion);
      if (!validation.isValid) {
        if (validation.error) throw validation.error;
        throw new Error(INPUT_ERROR_MESSAGES.VALIDATION);
      }
      if (shouldSubmit) {
        await sendThreadMessage(validation.sanitizedInput, { threadId: thread.id });
      } else {
        setInputValue(validation.sanitizedInput);
      }
      selectedSuggestionId.value = suggestion.id;
    },
  });

  const generateMutationState = useTamboMutation({
    mutationFn: async (abortController: AbortController) => {
      if (!shouldGenerateSuggestions()) return undefined;
      const components = getAvailableComponents(componentList, toolRegistry, componentToolAssociations);
      return await tamboClient.beta.threads.suggestions.generate(
        thread.id,
        latestMessageId()!,
        { maxSuggestions, availableComponents: components },
        { signal: abortController.signal },
      );
    },
    retry: false,
  });

  const suggestions = isLatestFromTambo()
    ? (suggestionsResult.data ?? generateMutationState.data ?? [])
    : [];

  return {
    suggestions,
    accept: acceptMutationState.mutateAsync,
    selectedSuggestionId: selectedSuggestionId.value,
    acceptResult: acceptMutationState,
    generateResult: generateMutationState,
    suggestionsResult,
    ...combineMutationResults(acceptMutationState, generateMutationState),
  };
}

