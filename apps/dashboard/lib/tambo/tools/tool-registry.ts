import { registerAgentTools } from "./agent-tools";
import { registerApiKeyTools } from "./api-key-tools";
import { registerDashboardTools } from "./dashboard-tools";
import { registerLlmTools } from "./llm-tools";
import { registerMcpTools } from "./mcp-tools";
import { registerProjectTools } from "./project-tools";
import type { RegisterToolFn, ToolContext } from "./types";
import { registerUserTools } from "./user-tools";

/**
 * Central registry that registers all tools in an organized manner.
 * This function calls all individual tool registration functions.
 *
 * @param registerTool - Function to register a single tool
 * @param ctx - Tool context containing TRPC client and utilities
 */
export function registerAllTools(
  registerTool: RegisterToolFn,
  ctx: ToolContext,
) {
  // User management
  registerUserTools(registerTool, ctx);

  // Project management
  registerProjectTools(registerTool, ctx);

  // API key management
  registerApiKeyTools(registerTool, ctx);

  // Dashboard statistics
  registerDashboardTools(registerTool, ctx);

  // LLM provider settings
  registerLlmTools(registerTool, ctx);

  // MCP server management
  registerMcpTools(registerTool, ctx);

  // Agent-specific settings
  registerAgentTools(registerTool, ctx);
}
