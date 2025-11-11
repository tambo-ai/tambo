import { useTambo } from "../providers/tambo-provider";

/**
 * Hook to access the current thread's messages and generation state.
 * @returns Object containing messages array, generation status, and current stage
 */
export function useTamboThreadMessages() {
  const { thread, generationStage, isIdle } = useTambo();

  return {
    messages: thread?.messages ?? [],
    isGenerating: !isIdle,
    generationStage,
  };
}
