import { apiKeySchema, getApiKeysInput } from "@/lib/schemas/api-key";
import { z } from "zod/v3";
import type { RegisterToolFn, ToolContext } from "./types";

/**
 * Input schema for the `fetchProjectApiKeys` function.
 * Requires a project ID string.
 */
export const fetchProjectApiKeysInputSchema = z.object({
  projectId: getApiKeysInput,
});

/**
 * Output schema for the `fetchProjectApiKeys` function.
 * Returns an array of API key details.
 */
export const fetchProjectApiKeysOutputSchema = z.array(apiKeySchema);

/**
 * Register API key management tools
 */
export function registerApiKeyTools(
  registerTool: RegisterToolFn,
  ctx: ToolContext,
) {
  /**
   * Registers a tool to fetch all API keys for a specific project.
   * @param {Object} params - Parameters object
   * @param {string} params.projectId - The project ID to fetch API keys for
   * @returns {Array} Array of API key details
   */
  registerTool({
    name: "fetchProjectApiKeys",
    description: "get all api keys for the current project",
    tool: async (params) => {
      return await ctx.trpcClient.project.getApiKeys.query(params.projectId);
    },
    inputSchema: fetchProjectApiKeysInputSchema,
    outputSchema: fetchProjectApiKeysOutputSchema,
  });
}
