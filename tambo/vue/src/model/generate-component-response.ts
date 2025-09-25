import TamboAI from "@tambo-ai/typescript-sdk";
import type { VNode } from "vue";

export interface TamboThreadMessage extends TamboAI.Beta.Threads.ThreadMessage {
  renderedComponent?: VNode | null;
}

export enum GenerationStage {
  IDLE = "IDLE",
  CHOOSING_COMPONENT = "CHOOSING_COMPONENT",
  FETCHING_CONTEXT = "FETCHING_CONTEXT",
  HYDRATING_COMPONENT = "HYDRATING_COMPONENT",
  STREAMING_RESPONSE = "STREAMING_RESPONSE",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR",
  CANCELLED = "CANCELLED",
}

export function isIdleStage(generationStage: GenerationStage) {
  return [
    GenerationStage.IDLE,
    GenerationStage.COMPLETE,
    GenerationStage.ERROR,
    GenerationStage.CANCELLED,
  ].includes(generationStage);
}

