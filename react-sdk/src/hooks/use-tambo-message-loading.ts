import { useTamboThreadMessages } from "./use-tambo-thread-messages";

/**
 * Hook to check if a specific message is currently loading.
 * If no messageId provided, returns true if any message is generating.
 * @param messageId - Optional message ID to check if it's currently loading
 * @returns True if the message is loading, false otherwise
 */
export function useTamboMessageLoading(messageId?: string): boolean {
  const { messages, isGenerating } = useTamboThreadMessages();

  if (!isGenerating) return false;
  if (!messageId) return isGenerating;

  // Check if the provided messageId matches the last message
  const lastMessage = messages[messages.length - 1];
  return lastMessage?.id === messageId;
}
