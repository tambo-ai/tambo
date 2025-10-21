import {
  updateProjectAgentSettingsInput,
  updateProjectAgentSettingsOutputSchema,
} from "@/lib/schemas/agent";
import { AgentProviderType, AiProviderType } from "@tambo-ai-cloud/core";
import { z } from "zod";
import { invalidateLlmSettingsCache, invalidateProjectCache } from "./helpers";
import type { RegisterToolFn, ToolContext } from "./types";

/**
 * Zod schema for the `updateProjectAgentSettings` function.
 * Defines arguments as an object containing agent settings and returns updated settings.
 */
export const updateProjectAgentSettingsSchema = z
  .function()
  .args(updateProjectAgentSettingsInput)
  .returns(updateProjectAgentSettingsOutputSchema);

/**
 * Register agent-specific settings management tools
 */
export function registerAgentTools(
  registerTool: RegisterToolFn,
  ctx: ToolContext,
) {
  /**
   * Registers a tool to update agent settings for a project.
   * Updates the provider type (LLM or AGENT) and agent-specific configurations.
   * @param {Object} params - Parameters object
   * @param {string} params.projectId - The complete project ID
   * @param {AiProviderType} params.providerType - The provider type (LLM or AGENT)
   * @param {AgentProviderType} params.agentProviderType - The agent provider type (optional)
   * @param {string} params.agentUrl - The agent URL (optional)
   * @param {string} params.agentName - The agent name (optional)
   * @param {Record<string, string>} params.agentHeaders - Custom headers for agent requests (optional)
   * @returns {Object} Updated agent settings
   */
  registerTool({
    name: "updateProjectAgentSettings",
    description:
      "Updates agent settings for a project, including provider type and agent-specific configurations. Requires complete project ID.",
    tool: async (params: {
      projectId: string;
      providerType: AiProviderType;
      agentProviderType?: AgentProviderType | null;
      agentUrl?: string | null;
      agentName?: string | null;
      agentHeaders?: Record<string, string> | null;
    }) => {
      const result =
        await ctx.trpcClient.project.updateProjectAgentSettings.mutate(params);

      // Invalidate all caches that display agent settings (shown in LLM settings view)
      await Promise.all([
        invalidateLlmSettingsCache(ctx, params.projectId),
        ctx.utils.project.getProjectById.invalidate(params.projectId),
        invalidateProjectCache(ctx),
      ]);

      return result;
    },
    toolSchema: updateProjectAgentSettingsSchema,
  });
}
