import TamboAI from "@tambo-ai/typescript-sdk";
import { ReactElement } from "react";
import type { InteractableConfig } from "../hoc/with-tambo-interactable";

/**
 * Metadata for interactable components.
 * Used when a component is wrapped with withInteractable.
 */
export interface InteractableMetadata extends InteractableConfig {
  /** Unique identifier for this interactable instance */
  id: string;
}

/**
 * An extension of the TamboAI.Beta.Threads.ThreadMessage type that includes a
 * renderedComponent and optional interactable metadata
 */
export interface TamboThreadMessage extends TamboAI.Beta.Threads.ThreadMessage {
  renderedComponent?: ReactElement | null;
  /** Optional metadata for interactable components */
  interactableMetadata?: InteractableMetadata;
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
/**
 * Checks if the generation stage is in a state where it can accept user input.
 * @param generationStage - The generation stage to check
 * @returns True if the generation stage is idle, false otherwise
 */
export function isIdleStage(generationStage: GenerationStage) {
  return [
    GenerationStage.IDLE,
    GenerationStage.COMPLETE,
    GenerationStage.ERROR,
    GenerationStage.CANCELLED,
  ].includes(generationStage);
}
