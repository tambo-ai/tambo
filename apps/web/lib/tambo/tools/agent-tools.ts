import { updateProjectAgentSettingsToolInput as updateProjectAgentSettingsInputSchema } from "@/lib/schemas/agent";
import { z } from "zod/v3";
import { invalidateLlmSettingsCache, invalidateProjectCache } from "./helpers";
import type { RegisterToolFn, ToolContext } from "./types";

// Tool-compatible output schema (original uses agentHeadersSchema which is a Record type)
const updateProjectAgentSettingsOutputSchema = z
  .unknown()
  .describe("Updated agent settings for the project");

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
      // Validate and convert agentHeaders from unknown to Record<string, string> | null | undefined
      let validatedHeaders: Record<string, string> | null | undefined =
        undefined;
      if (agentHeaders !== null && agentHeaders !== undefined) {
        if (typeof agentHeaders === "object" && !Array.isArray(agentHeaders)) {
          // Convert to Record<string, string>, filtering out non-string values
          const headers: Record<string, string> = {};
          for (const [key, value] of Object.entries(agentHeaders)) {
            if (typeof key === "string" && typeof value === "string") {
              headers[key] = value;
            }
          }
          validatedHeaders = Object.keys(headers).length > 0 ? headers : null;
        } else {
          validatedHeaders = null;
        }
      }

      const result =
        await ctx.trpcClient.project.updateProjectAgentSettings.mutate({
          projectId,
          providerType,
          agentProviderType,
          agentUrl,
          agentName,
          agentHeaders: validatedHeaders,
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
