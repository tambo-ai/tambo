import {
  inspectMcpServerInput,
  inspectMcpServerOutputSchema,
  listMcpServersInput,
  mcpServerDetailSchema,
  mcpServerSchema,
  updateMcpServerInput,
} from "@/lib/schemas/mcp";
import { z } from "zod/v3";
import { invalidateMcpServersCache } from "./helpers";
import type { RegisterToolFn, ToolContext } from "./types";

/**
 * Tool-specific output schema for MCP server.
 * Uses z.any() for customHeaders instead of z.record() because
 * z.record() is not supported in Vercel AI SDK tool schemas.
 */
const mcpServerToolSchema = mcpServerSchema.extend({
  customHeaders: z
    .any()
    .nullable()
    .describe("Custom headers for the MCP server"),
});

/**
 * Input schema for the `fetchProjectMcpServers` function.
 * Requires a project ID string.
 */
export const fetchProjectMcpServersInputSchema = listMcpServersInput;

/**
 * Output schema for the `fetchProjectMcpServers` function.
 * Returns an array of MCP server objects.
 */
export const fetchProjectMcpServersOutputSchema = z.array(mcpServerToolSchema);

/**
 * Tool-specific input schema for updateMcpServer.
 * Uses z.any() for customHeaders instead of z.record() because
 * z.record() is not supported in Vercel AI SDK tool schemas.
 * The actual validation happens in the tRPC layer.
 */
const updateMcpServerToolInput = updateMcpServerInput.extend({
  customHeaders: z.any().describe("Custom headers for the MCP server"),
});

/**
 * Tool-specific output schema for MCP server details.
 * Uses z.any() for customHeaders, mcpCapabilities, and mcpVersion
 * instead of z.record() because z.record() is not supported in Vercel AI SDK tool schemas.
 */
const mcpServerDetailToolSchema = mcpServerDetailSchema.extend({
  customHeaders: z.any().describe("Custom headers for the MCP server"),
  mcpCapabilities: z.any().optional().describe("Server capabilities"),
  mcpVersion: z.any().optional().describe("Server version information"),
});

/**
 * Input schema for the `updateMcpServer` function.
 * Contains parameters for updating an MCP server.
 */
export const updateMcpServerInputSchema = updateMcpServerToolInput;

/**
 * Output schema for the `updateMcpServer` function.
 * Returns updated MCP server details.
 */
export const updateMcpServerOutputSchema = mcpServerDetailToolSchema;

/**
 * Tool-specific output schema for inspect MCP server.
 * Uses z.any() for version and capabilities instead of z.record() because
 * z.record() is not supported in Vercel AI SDK tool schemas.
 */
const inspectMcpServerToolOutputSchema = inspectMcpServerOutputSchema.extend({
  serverInfo: z
    .object({
      version: z.any().optional().describe("Server version information"),
      instructions: z
        .string()
        .optional()
        .describe("Instructions provided by the server"),
      capabilities: z.any().optional().describe("Server capabilities"),
    })
    .describe("Information about the MCP server"),
});

/**
 * Input schema for the `getMcpServerTools` function.
 * Contains the project ID and server ID.
 */
export const getMcpServerToolsInputSchema = inspectMcpServerInput;

/**
 * Output schema for the `getMcpServerTools` function.
 * Returns available tools and server information.
 */
export const getMcpServerToolsOutputSchema = inspectMcpServerToolOutputSchema;

/**
 * Register MCP server management tools
 */
export function registerMcpTools(
  registerTool: RegisterToolFn,
  ctx: ToolContext,
) {
  /**
   * Registers a tool to fetch all MCP (Model Context Protocol) servers for a project.
   * Returns server configuration including URL, headers, and authentication status.
   * IMPORTANT: Always call this first before deleting a server to get the correct server ID.
   * @param {Object} params - Parameters
   * @param {string} params.projectId - The project ID to fetch MCP servers for
   * @returns {Array} MCP server details including ID (required for deletion), URL, headers, and auth status
   */
  registerTool({
    name: "fetchProjectMcpServers",
    description:
      "Fetches all MCP servers for a project. Returns an array of servers with their IDs, URLs, headers, and auth status. MUST be called before deleting a server to get the correct server ID - never guess or use the URL as the ID.",
    tool: async (params) => {
      return await ctx.trpcClient.tools.listMcpServers.query(params);
    },
    inputSchema: fetchProjectMcpServersInputSchema,
    outputSchema: fetchProjectMcpServersOutputSchema,
  });

  /**
   * Registers a tool to update an existing MCP server.
   * @param {Object} params - Update parameters
   * @param {string} params.projectId - The project ID containing the MCP server
   * @param {string} params.serverId - The ID of the MCP server to update
   * @param {string} params.url - The new URL of the MCP server
   * @param {Record<string, string>} params.customHeaders - Custom HTTP headers for the server
   * @param {MCPTransport} params.mcpTransport - Transport mechanism
   * @returns {Object} Updated MCP server details
   */
  registerTool({
    name: "updateMcpServer",
    description: "Updates an existing MCP server for a project.",
    tool: async (params) => {
      const result = await ctx.trpcClient.tools.updateMcpServer.mutate(params);

      // Invalidate the mcp server cache to refresh the component
      await invalidateMcpServersCache(ctx, params.projectId);

      return result;
    },
    inputSchema: updateMcpServerInputSchema,
    outputSchema: updateMcpServerOutputSchema,
  });

  /**
   * Registers a tool to inspect and get available tools from an MCP server.
   * Returns the tools/capabilities exposed by the MCP server along with server information.
   * @param {Object} params - Inspection parameters
   * @param {string} params.projectId - The project ID containing the MCP server
   * @param {string} params.serverId - The ID of the MCP server to inspect
   * @returns {Object} Available tools and server information including capabilities and version
   */
  registerTool({
    name: "getMcpServerTools",
    description: "Gets the tools for an MCP server for a project.",
    tool: async (params) => {
      return await ctx.trpcClient.tools.inspectMcpServer.query(params);
    },
    inputSchema: getMcpServerToolsInputSchema,
    outputSchema: getMcpServerToolsOutputSchema,
  });
}
