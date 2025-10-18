import TamboAI from "@tambo-ai/typescript-sdk";
import { ref, watch } from "vue";
import { isIdleStage } from "../model/generate-component-response";
import { validateInput } from "../model/validate-input";
import { useTamboClient } from "../providers/tambo-client-provider";
import { useTambo } from "../providers/tambo-provider";
import { useTamboRegistry } from "../providers/tambo-registry-provider";
import { INPUT_ERROR_MESSAGES, useTamboThreadInput } from "../providers/tambo-thread-input-provider";
import { useTamboThread } from "../providers/tambo-thread-provider";
import { getAvailableComponents } from "../util/registry";
import { useTamboMutation, useTamboQuery } from "./vue-query-hooks";

export interface useTamboSuggestionsOptions { maxSuggestions?: number }

export interface useTamboSuggestionsResultInternal {
  suggestions: TamboAI.Beta.Threads.Suggestion[];
  selectedSuggestionId: string | null;
  accept: (acceptOptions: { suggestion: TamboAI.Beta.Threads.Suggestion; shouldSubmit?: boolean }) => Promise<void>;
  acceptResult: ReturnType<typeof useTamboMutation>;
  generateResult: ReturnType<typeof useTamboMutation>;
  suggestionsResult: ReturnType<typeof useTamboQuery>;
}

export function useTamboSuggestions(options: useTamboSuggestionsOptions = {}) {
  const { maxSuggestions = 3 } = options;
  const { thread, generationStage } = useTamboThread();
  const { sendThreadMessage } = useTambo();
  const tamboClient = useTamboClient();
  const { componentList, toolRegistry, componentToolAssociations } = useTamboRegistry();

  const selectedSuggestionId = ref<string | null>(null);
  const { setValue: setInputValue } = useTamboThreadInput();

  const latestMessage = (thread as any).messages[(thread as any).messages.length - 1];
  const isLatestFromTambo = latestMessage?.role === "assistant";
  const latestMessageId = latestMessage?.id;

  watch(
    () => latestMessageId,
    () => {
      selectedSuggestionId.value = null;
    },
  );

  const shouldGenerateSuggestions = latestMessageId && isLatestFromTambo && isIdleStage(generationStage as any);
  const suggestionsResult = useTamboQuery({
    queryKey: ["suggestions", shouldGenerateSuggestions ? latestMessageId : null],
    queryFn: async () => {
      if (!shouldGenerateSuggestions) return [] as any;
      const components = getAvailableComponents(componentList as any, toolRegistry as any, componentToolAssociations as any);
      return await (tamboClient as any).beta.threads.suggestions.generate((thread as any).id, latestMessageId, {
        maxSuggestions,
        availableComponents: components,
      });
    },
    enabled: Boolean(latestMessageId && isLatestFromTambo) as any,
    refetchOnWindowFocus: false as any,
    refetchOnReconnect: false as any,
    retry: false as any,
  } as any);

  const acceptMutationState = useTamboMutation<any, Error, { suggestion: TamboAI.Beta.Threads.Suggestion; shouldSubmit?: boolean }>({
    mutationFn: async ({ suggestion, shouldSubmit = false }) => {
      const validation = validateInput(suggestion.detailedSuggestion);
      if (!validation.isValid) {
        if (validation.error) throw validation.error;
        throw new Error(INPUT_ERROR_MESSAGES.VALIDATION);
      }
      if (shouldSubmit) {
        await sendThreadMessage(validation.sanitizedInput, { threadId: (thread as any).id });
      } else {
        setInputValue(validation.sanitizedInput);
      }
      selectedSuggestionId.value = suggestion.id;
    },
  } as any);

  const generateMutationState = useTamboMutation<any, Error, AbortController>({
    mutationFn: async (abortController: AbortController) => {
      if (!shouldGenerateSuggestions) return undefined;
      const components = getAvailableComponents(componentList as any, toolRegistry as any, componentToolAssociations as any);
      return await (tamboClient as any).beta.threads.suggestions.generate((thread as any).id, latestMessageId, {
        maxSuggestions,
        availableComponents: components,
      }, { signal: abortController.signal } as any);
    },
    retry: false as any,
  } as any);

  const suggestions = isLatestFromTambo ? ((suggestionsResult as any).data ?? (generateMutationState as any).data ?? []) : [];

  return {
    suggestions,
    accept: (acceptMutationState as any).mutateAsync,
    selectedSuggestionId: selectedSuggestionId.value,
    acceptResult: acceptMutationState,
    generateResult: generateMutationState,
    suggestionsResult,
  } as useTamboSuggestionsResultInternal;
}

