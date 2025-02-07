import { ToolCallRequest } from "../../../../core/src/ComponentDecision";

export interface OpenAIResponse {
  message: string;
  toolCallRequest?: ToolCallRequest;
}
