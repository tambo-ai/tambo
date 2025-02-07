import { ToolCallRequest } from "@use-hydra-ai/core";

export interface OpenAIResponse {
  message: string;
  toolCallRequest?: ToolCallRequest;
}
