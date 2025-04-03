import { ToolCallRequest } from "@tambo-ai-cloud/core";

export interface OpenAIResponse {
  message: string;
  toolCallRequest?: ToolCallRequest;
  toolCallId?: string;
}
