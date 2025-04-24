import { OpenAIToolSet } from "composio-core";
import OpenAI from "openai";
import { MCPClient } from "./MCPClient";

export interface SystemTools {
  tools: OpenAI.Chat.Completions.ChatCompletionTool[];
  mcpToolSources: Record<string, MCPClient>;
  composioToolNames: string[];
  composioClient?: OpenAIToolSet;
}
