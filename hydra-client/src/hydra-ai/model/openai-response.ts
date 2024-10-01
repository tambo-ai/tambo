import { ToolCallRequest } from "./component-choice";

export interface OpenAIResponse {
  message: string;
  toolCallRequest?: ToolCallRequest;
}
