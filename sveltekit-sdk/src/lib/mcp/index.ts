/**
 * MCP (Model Context Protocol) support for Svelte SDK.
 *
 * Note: Full MCP support requires @modelcontextprotocol/sdk to be installed.
 * This module provides types and hooks for MCP integration.
 */

export {
  useTamboMcpServers,
  useTamboMcpPrompt,
  useTamboMcpResource,
} from "../hooks/useTamboMcp.js";

export type {
  TamboMcpContext,
  McpTool,
  McpResource,
  McpPrompt,
  McpServer,
  ConnectedMcpServer,
  FailedMcpServer,
} from "../providers/TamboMcpProvider.svelte";

export type { McpServerInfo, McpTransport } from "../types.js";
