import {
  getOAuthValidationSettingsInput,
  oauthValidationSettingsSchema,
  updateOAuthValidationSettingsInput,
  updateOAuthValidationSettingsOutputSchema,
} from "@/lib/schemas/oauth";
import { OAuthValidationMode } from "@tambo-ai-cloud/core";
import { z } from "zod";
import { invalidateOAuthSettingsCache } from "./helpers";
import type { RegisterToolFn, ToolContext } from "./types";

/**
 * Zod schema for the `fetchOAuthValidationSettings` function.
 * Defines the argument as an object containing the project ID and returns OAuth validation settings.
 */
export const fetchOAuthValidationSettingsSchema = z
  .function()
  .args(getOAuthValidationSettingsInput)
  .returns(oauthValidationSettingsSchema);

/**
 * Zod schema for the `updateOAuthValidationSettings` function.
 * Defines arguments as an object containing OAuth validation settings and returns updated settings.
 */
export const updateOAuthValidationSettingsSchema = z
  .function()
  .args(updateOAuthValidationSettingsInput)
  .returns(updateOAuthValidationSettingsOutputSchema);

/**
 * Register OAuth validation settings management tools
 */
export function registerOAuthTools(
  registerTool: RegisterToolFn,
  ctx: ToolContext,
) {
  /**
   * Registers a tool to fetch OAuth validation settings for a project.
   * Returns the current OAuth validation mode, public key, and secret key status.
   * @param {Object} params - Parameters object
   * @param {string} params.projectId - The project ID to fetch OAuth validation settings for
   * @returns {Object} OAuth validation settings including mode, public key, and secret key status
   */
  registerTool({
    name: "fetchOAuthValidationSettings",
    description: "Fetches OAuth validation settings for a project.",
    tool: async (params: { projectId: string }) => {
      return await ctx.trpcClient.project.getOAuthValidationSettings.query(
        params,
      );
    },
    toolSchema: fetchOAuthValidationSettingsSchema,
  });

  /**
   * Registers a tool to update OAuth validation settings for a project.
   * Updates the OAuth validation mode and associated keys (secret key for symmetric, public key for asymmetric manual).
   * @param {Object} params - Parameters object
   * @param {string} params.projectId - The complete project ID
   * @param {OAuthValidationMode} params.mode - The OAuth validation mode
   * @param {string} params.secretKey - The secret key for symmetric validation (required when mode is SYMMETRIC)
   * @param {string} params.publicKey - The public key for asymmetric manual validation (required when mode is ASYMMETRIC_MANUAL)
   * @param {boolean} params.isTokenRequired - Whether authentication tokens are required for this project
   * @returns {Object} Updated OAuth validation settings
   */
  registerTool({
    name: "updateOAuthValidationSettings",
    description:
      "Updates OAuth validation settings for a project. Requires complete project ID. Secret key is required for SYMMETRIC mode, public key is required for ASYMMETRIC_MANUAL mode.",
    tool: async (params: {
      projectId: string;
      mode: OAuthValidationMode;
      secretKey?: string;
      publicKey?: string;
      isTokenRequired?: boolean;
    }) => {
      const result =
        await ctx.trpcClient.project.updateOAuthValidationSettings.mutate(
          params,
        );

      // Invalidate the OAuth settings cache to refresh the component
      await invalidateOAuthSettingsCache(ctx, params.projectId);

      return result;
    },
    toolSchema: updateOAuthValidationSettingsSchema,
  });
}
