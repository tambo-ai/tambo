import { useTambo } from "../providers/tambo-provider";

/**
 * Hook to access thread messages and generation state.
 * Convenience wrapper around useTambo for message-specific data.
 * @returns Object containing messages array, isGenerating boolean, and generationStage
 */
export function useTamboThreadMessages() {
  const { thread, generationStage, isIdle } = useTambo();

  return {
    messages: thread?.messages ?? [],
    isGenerating: !isIdle,
    generationStage,
  };
}
