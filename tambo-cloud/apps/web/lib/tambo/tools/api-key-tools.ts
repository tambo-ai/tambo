import {
  apiKeySchema,
  deleteApiKeyInput,
  generateApiKeyInput,
  generatedApiKeySchema,
  getApiKeysInput,
} from "@/lib/schemas/api-key";
import { z } from "zod";
import { invalidateApiKeysCache } from "./helpers";
import type { RegisterToolFn, ToolContext } from "./types";

/**
 * Zod schema for the `fetchProjectApiKeys` function.
 * Defines the argument as a project ID string and the return type as an array of API key details.
 */
export const fetchProjectApiKeysSchema = z
  .function()
  .args(getApiKeysInput)
  .returns(z.array(apiKeySchema));

/**
 * Zod schema for the `generateProjectApiKey` function.
 * Defines arguments as the project ID string and API key name string,
 * and the return type as an object representing the newly generated API key details.
 */
export const generateProjectApiKeySchema = z
  .function()
  .args(generateApiKeyInput)
  .returns(generatedApiKeySchema);

/**
 * Zod schema for the `deleteProjectApiKey` function.
 * Defines arguments as the project ID string and API key ID string,
 * and the return type as an object indicating the key was processed for deletion (e.g., `{ deletedKey: undefined }`).
 */
export const deleteProjectApiKeySchema = z
  .function()
  .args(deleteApiKeyInput)
  .returns(
    z.object({
      deletedKey: z.void(),
    }),
  );

/**
 * Register API key management tools
 */
export function registerApiKeyTools(
  registerTool: RegisterToolFn,
  ctx: ToolContext,
) {
  /**
   * Registers a tool to fetch all API keys for a specific project.
   * @param {string} projectId - The project ID to fetch API keys for
   * @returns {Array} Array of API key details
   */
  registerTool({
    name: "fetchProjectApiKeys",
    description: "get all api keys for the current project",
    tool: async (projectId: string) => {
      return await ctx.trpcClient.project.getApiKeys.query(projectId);
    },
    toolSchema: fetchProjectApiKeysSchema,
  });

  /**
   * Registers a tool to generate a new API key for a project.
   * @param {Object} params - Parameters object
   * @param {string} params.projectId - The complete project ID
   * @param {string} params.name - The name/label for the new API key
   * @returns {Object} Generated API key details including the key value and metadata
   */
  registerTool({
    name: "generateProjectApiKey",
    description:
      "Generates a new API key for a project. Requires complete project ID.",
    tool: async (params: { projectId: string; name: string }) => {
      const result = await ctx.trpcClient.project.generateApiKey.mutate(params);

      // Invalidate the API keys cache to refresh the component
      await invalidateApiKeysCache(ctx, params.projectId);

      return result;
    },
    toolSchema: generateProjectApiKeySchema,
  });

  /**
   * Registers a tool to delete an existing API key from a project.
   * @param {Object} params - Parameters object
   * @param {string} params.projectId - The complete project ID
   * @param {string} params.apiKeyId - The ID of the API key to delete
   * @returns {Object} Confirmation message that the key was deleted
   */
  registerTool({
    name: "deleteProjectApiKey",
    description:
      "Deletes an API key for a project. Requires complete project ID.",
    tool: async (params: { projectId: string; apiKeyId: string }) => {
      await ctx.trpcClient.project.removeApiKey.mutate(params);

      // Invalidate the API keys cache to refresh the component
      await invalidateApiKeysCache(ctx, params.projectId);

      return { deletedKey: undefined };
    },
    toolSchema: deleteProjectApiKeySchema,
  });
}
