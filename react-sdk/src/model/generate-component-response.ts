import TamboAI from "@tambo-ai/typescript-sdk";
import { ReactElement } from "react";

/**
 * An extension of the TamboAI.Beta.Threads.ThreadMessage type that includes a
 * renderedComponent
 */
export interface TamboThreadMessage extends TamboAI.Beta.Threads.ThreadMessage {
  renderedComponent?: ReactElement | null;
}

export enum GenerationStage {
  IDLE = "IDLE",
  CHOOSING_COMPONENT = "CHOOSING_COMPONENT",
  FETCHING_CONTEXT = "FETCHING_CONTEXT",
  HYDRATING_COMPONENT = "HYDRATING_COMPONENT",
  STREAMING_RESPONSE = "STREAMING_RESPONSE",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR",
}
/**
 *
 */
export function isIdleStage(generationStage: GenerationStage) {
  return [
    GenerationStage.IDLE,
    GenerationStage.COMPLETE,
    GenerationStage.ERROR,
  ].includes(generationStage);
}
