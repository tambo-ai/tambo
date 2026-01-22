import {
  updateProjectAgentSettingsInput as updateProjectAgentSettingsInputSchema,
  updateProjectAgentSettingsOutputSchema,
} from "@/lib/schemas/agent";
import { invalidateLlmSettingsCache, invalidateProjectCache } from "./helpers";
import type { RegisterToolFn, ToolContext } from "./types";

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
   * @returns Updated agent settings
   */
  registerTool({
    name: "updateProjectAgentSettings",
    description:
      "Updates agent settings for a project, including provider type and agent-specific configurations. Requires complete project ID.",
    tool: async ({
      projectId,
      providerType,
      agentProviderType,
      agentUrl,
      agentName,
      agentHeaders,
    }) => {
      const result =
        await ctx.trpcClient.project.updateProjectAgentSettings.mutate({
          projectId,
          providerType,
          agentProviderType,
          agentUrl,
          agentName,
          // Cast from unknown (tool schema) to Record<string, string> (tRPC expects)
          // Validation happens server-side
          agentHeaders: agentHeaders,
        });

      // Invalidate all caches that display agent settings (shown in LLM settings view)
      await Promise.all([
        invalidateLlmSettingsCache(ctx, projectId),
        ctx.utils.project.getProjectById.invalidate(projectId),
        invalidateProjectCache(ctx),
      ]);

      return result;
    },
    inputSchema: updateProjectAgentSettingsInputSchema,
    outputSchema: updateProjectAgentSettingsOutputSchema,
  });
}
