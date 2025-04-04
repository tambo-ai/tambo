import { ActionType, ComponentDecisionV2 } from "@tambo-ai-cloud/core";

export interface ChatMessage {
  sender: "hydra" | "user" | "tool";
  message: string;
  additionalContext?: string;
  component?: ComponentDecisionV2;
  componentState?: Record<string, unknown>;
  actionType?: ActionType;
}
