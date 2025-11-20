import { MCPClient, MCPHandlers } from "@tambo-ai-cloud/core";
import OpenAI from "openai";

/**
 * Separator used when prefixing MCP tool names with a serverKey.
 * Keep this constant as the single source of truth across packages.
 */
export const MCP_TOOL_PREFIX_SEPARATOR = "__" as const;

/**
 * Build a prefixed tool name in the form `${serverKey}${SEP}${toolName}`.
 * If `serverKey` is empty/falsy, returns `toolName` unchanged.
 */
export function prefixToolName(
  serverKey: string | undefined | null,
  toolName: string,
): string {
  return serverKey
    ? `${serverKey}${MCP_TOOL_PREFIX_SEPARATOR}${toolName}`
    : toolName;
}

/**
 * Remove a serverKey prefix from a tool name when present.
 * If `serverKey` is empty/falsy, or the name doesn't start with the expected
 * prefix, the original `toolName` is returned.
 */
export function unprefixToolName(
  toolName: string,
  serverKey?: string | null,
): string {
  if (!serverKey) return toolName;
  const prefix = `${serverKey}${MCP_TOOL_PREFIX_SEPARATOR}`;
  return toolName.startsWith(prefix) ? toolName.slice(prefix.length) : toolName;
}

/** Information about an MCP tool source */
export interface McpToolSource {
  /** The MCP client for calling the tool */
  client: MCPClient;
  /** The serverKey prefix for this tool */
  serverKey: string;
}

/** Registry of available MCP tools during a request */
export interface McpToolRegistry {
  /** Schemas for all MCP tools */
  mcpToolsSchema: OpenAI.Chat.Completions.ChatCompletionTool[];
  /** A mapping of MCP tool name to MCP tool source info */
  mcpToolSources: Record<string, McpToolSource>;

  mcpHandlers: MCPHandlers;
}

/** Registry of all browser-side client tools */
export interface ClientToolRegistry {
  /** Schemas for all client tools */
  clientToolsSchema: OpenAI.Chat.Completions.ChatCompletionTool[];
}

/** Registry of all available tools during a request, including both MCP Tools and client tools */
export interface ToolRegistry extends ClientToolRegistry, McpToolRegistry {}
