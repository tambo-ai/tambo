"use client";

import { GenerationStageContent } from "./generation-stage-content";
import { GenerationStageRoot } from "./generation-stage-root";
import { GenerationStageStreaming } from "./generation-stage-streaming";
import { GenerationStageWaiting } from "./generation-stage-waiting";

/**
 * GenerationStage namespace containing all generation stage base components.
 */
const GenerationStage = {
  Root: GenerationStageRoot,
  Content: GenerationStageContent,
  Waiting: GenerationStageWaiting,
  Streaming: GenerationStageStreaming,
};

export type { GenerationStageContextValue } from "./generation-stage-context";
export { useGenerationStageContext } from "./generation-stage-context";
export type {
  GenerationStageRootProps,
  GenerationStageRootState,
} from "./generation-stage-root";
export type {
  GenerationStageContentProps,
  GenerationStageContentState,
} from "./generation-stage-content";
export type {
  GenerationStageWaitingProps,
  GenerationStageWaitingState,
} from "./generation-stage-waiting";
export type {
  GenerationStageStreamingProps,
  GenerationStageStreamingState,
} from "./generation-stage-streaming";

export type { useRender } from "@base-ui/react/use-render";

export { GenerationStage };
