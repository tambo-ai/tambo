import type { TamboThreadMessage } from "../model/generate-component-response";
import { useTamboThreadMessages } from "./use-tambo-thread-messages";

/**
 * Hook to check if a specific message is currently loading (being generated).
 * Returns true if the message is the last message in the thread and generation is in progress.
 * @param message - The message to check loading status for
 * @returns Object containing isLoading boolean and current generationStage
 */
export function useTamboMessageLoading(message: TamboThreadMessage) {
  const { messages, isGenerating, generationStage } = useTamboThreadMessages();

  // Check if this is the last message and generation is in progress
  const lastMessage = messages[messages.length - 1];
  const isLoading = isGenerating && message.id === lastMessage?.id;

  return {
    isLoading,
    generationStage,
  };
}
