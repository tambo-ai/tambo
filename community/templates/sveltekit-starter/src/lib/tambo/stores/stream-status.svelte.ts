import type { GenerationStage } from "../types.js";

/**
 * Stream status store for tracking generation state
 */
export function createStreamStatusStore() {
  let stage = $state<GenerationStage>("idle");
  let error = $state<Error | null>(null);

  const isIdle = $derived(stage === "idle" || stage === "completed");
  const isGenerating = $derived(
    stage === "generating" || stage === "thinking" || stage === "tool_calling",
  );
  const isStarting = $derived(stage === "starting");
  const hasError = $derived(stage === "error" || error !== null);

  return {
    get stage() {
      return stage;
    },
    get error() {
      return error;
    },
    get isIdle() {
      return isIdle;
    },
    get isGenerating() {
      return isGenerating;
    },
    get isStarting() {
      return isStarting;
    },
    get hasError() {
      return hasError;
    },

    setStage(newStage: GenerationStage) {
      stage = newStage;
      if (newStage !== "error") {
        error = null;
      }
    },

    setError(err: Error) {
      error = err;
      stage = "error";
    },

    reset() {
      stage = "idle";
      error = null;
    },
  };
}

export type StreamStatusStore = ReturnType<typeof createStreamStatusStore>;
