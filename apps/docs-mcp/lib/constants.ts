/**
 * @fileoverview Constants used across the MCP server
 * @module mcp/constants
 */

/**
 * MCP handler configuration options
 */
export const MCP_HANDLER_OPTIONS = {
  basePath: "",
  verboseLogs: true,
  maxDuration: 300,
} as const;

/**
 * Health check response metadata
 */
export const HEALTH_CHECK_RESPONSE = {
  name: "tambo MCP Server",
  version: "1.0.0",
  description: "MCP server for tambo documentation and support",
  supportedMethods: ["POST", "DELETE"],
  mcpProtocolVersion: "2025-03-26",
} as const;

/**
 * Tool hint configurations
 */
export const TOOL_HINTS = {
  readOnlyHint: true,
  openWorldHint: true,
} as const;
