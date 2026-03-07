"use client";

import * as React from "react";

export interface GenerationStageContextValue {
  isStreaming: boolean;
  isWaiting: boolean;
  isIdle: boolean;
}

export const GenerationStageContext =
  React.createContext<GenerationStageContextValue | null>(null);

/**
 * Hook to access the generation stage context.
 * @internal This hook is for internal use by base components only.
 * Consumers should use component `render` props instead.
 * @returns The generation stage context value
 * @throws Error if used outside of GenerationStage.Root
 */
export function useGenerationStageContext(): GenerationStageContextValue {
  const context = React.useContext(GenerationStageContext);
  if (!context) {
    throw new Error(
      "React UI Base: GenerationStageContext is missing. GenerationStage parts must be used within <GenerationStage.Root>",
    );
  }
  return context;
}
