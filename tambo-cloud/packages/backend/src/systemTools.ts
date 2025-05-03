import { MCPClient } from "@tambo-ai-cloud/core";
import { OpenAIToolSet } from "composio-core";
import OpenAI from "openai";

export interface SystemTools {
  tools: OpenAI.Chat.Completions.ChatCompletionTool[];
  mcpToolSources: Record<string, MCPClient>;
  composioToolNames: string[];
  composioClient?: OpenAIToolSet;
}
