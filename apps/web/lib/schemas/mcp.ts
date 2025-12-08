import { MCPTransport, isValidServerKey } from "@tambo-ai-cloud/core";
import { z } from "zod/v3";

/**
 * Shared schemas for MCP (Model Context Protocol) server operations.
 * Used by both tRPC routers and tool definitions.
 */

// Input schemas
export const listMcpServersInput = z.object({
  projectId: z.string().describe("The project ID to fetch MCP servers for"),
});

export const addMcpServerInput = z.object({
  projectId: z.string().describe("The project ID"),
  url: z.string().url().describe("The URL of the MCP server"),
  serverKey: z
    .string()
    .trim()
    .refine(
      isValidServerKey,
      "Server key must be at least 2 characters and contain only alphanumeric characters and underscores",
    )
    .describe(
      "The unique key for this server (used to namespace tools, resources, and prompts)",
    ),
  customHeaders: z
    .record(z.string(), z.string())
    .describe("Custom headers for the MCP server"),
  mcpTransport: z
    .nativeEnum(MCPTransport)
    .describe(
      "Transport mechanism for MCP communication (SSE or stdio), default is HTTP",
    ),
});

export const updateMcpServerInput = z.object({
  projectId: z.string().describe("The project ID"),
  serverId: z.string().describe("The ID of the MCP server to update"),
  url: z.string().url().describe("The URL of the MCP server"),
  serverKey: z
    .string()
    .trim()
    .refine(
      isValidServerKey,
      "Server key must be at least 2 characters and contain only alphanumeric characters and underscores",
    )
    .describe(
      "The unique key for this server (used to namespace tools, resources, and prompts)",
    ),
  customHeaders: z
    .record(z.string(), z.string())
    .describe("Custom headers for the MCP server"),
  mcpTransport: z
    .nativeEnum(MCPTransport)
    .describe("Transport mechanism for MCP communication, default is HTTP"),
});

export const deleteMcpServerInput = z.object({
  projectId: z.string().describe("The project ID"),
  serverId: z.string().describe("The ID of the MCP server to delete"),
});

export const inspectMcpServerInput = z.object({
  projectId: z.string().describe("The project ID"),
  serverId: z.string().describe("The ID of the MCP server to inspect"),
});

// Output schemas
export const mcpServerSchema = z.object({
  id: z.string().describe("The unique identifier for the MCP server"),
  url: z.string().nullable().describe("The URL of the MCP server"),
  serverKey: z.string().describe("The unique key for this server"),
  customHeaders: z
    .record(z.string(), z.string())
    .nullable()
    .describe("Custom headers for the MCP server"),
  mcpRequiresAuth: z
    .boolean()
    .describe("Whether the MCP server requires authentication"),
  mcpIsAuthed: z.boolean().describe("Whether the MCP server is authenticated"),
  mcpTransport: z
    .nativeEnum(MCPTransport)
    .describe("Transport mechanism for MCP communication, default is HTTP"),
});

export const mcpServerDetailSchema = z.object({
  id: z.string().describe("The unique identifier for the MCP server"),
  url: z.string().describe("The URL of the MCP server"),
  serverKey: z.string().describe("The unique key for this server"),
  customHeaders: z
    .record(z.string(), z.string())
    .describe("Custom headers for the MCP server"),
  mcpTransport: z
    .nativeEnum(MCPTransport)
    .describe("Transport mechanism for MCP communication, default is HTTP"),
  mcpRequiresAuth: z
    .boolean()
    .describe("Whether the MCP server requires authentication"),
  mcpCapabilities: z
    .record(z.string(), z.any())
    .optional()
    .describe("Server capabilities"),
  mcpVersion: z
    .record(z.string(), z.any())
    .optional()
    .describe("Server version information"),
  mcpInstructions: z
    .string()
    .optional()
    .describe("Instructions from the MCP server"),
});

export const mcpToolSchema = z.object({
  name: z.string().describe("The name of the tool"),
  description: z
    .string()
    .optional()
    .describe("Description of what the tool does"),
  inputSchema: z
    .any()
    .optional()
    .describe("JSON schema for the tool's input parameters"),
});

export const mcpServerInfoSchema = z.object({
  version: z
    .record(z.string(), z.any())
    .optional()
    .describe("Server version information"),
  instructions: z
    .string()
    .optional()
    .describe("Instructions provided by the server"),
  capabilities: z
    .record(z.string(), z.any())
    .optional()
    .describe("Server capabilities"),
});

export const inspectMcpServerOutputSchema = z.object({
  tools: z
    .array(mcpToolSchema)
    .describe("List of tools available from the MCP server"),
  serverInfo: mcpServerInfoSchema.describe("Information about the MCP server"),
});
