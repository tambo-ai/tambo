import {
  updateProjectAgentSettingsToolInput as updateProjectAgentSettingsInputSchema,
  updateProjectAgentSettingsOutputSchema,
} from "@/lib/schemas/agent";
import { invalidateLlmSettingsCache, invalidateProjectCache } from "./helpers";
import type { RegisterToolFn, ToolContext } from "./types";
import type { z } from "zod/v3";

// NOTE: `updateProjectAgentSettingsToolInput` models `agentHeaders` as `z.unknown()`
// to keep the tool input schema JSON-schema compatible. We validate/normalize
// before calling the tRPC mutation.
type UpdateProjectAgentSettingsToolInput = z.infer<
  typeof updateProjectAgentSettingsInputSchema
>;

function normalizeAgentHeaders(
  agentHeaders: unknown,
): Record<string, string> | null | undefined {
  if (agentHeaders === null || agentHeaders === undefined) {
    return agentHeaders;
  }

  if (typeof agentHeaders !== "object" || Array.isArray(agentHeaders)) {
    throw new Error(
      "Invalid agentHeaders: must be an object mapping string keys to string values (e.g. { key: 'value' })",
    );
  }

  const blockedKeys = new Set(["__proto__", "prototype", "constructor"]);
  const headers = Object.create(null) as Record<string, string>;
  for (const [key, value] of Object.entries(
    agentHeaders as Record<string, unknown>,
  )) {
    if (blockedKeys.has(key)) {
      throw new Error(`Invalid agentHeaders: forbidden key '${key}'`);
    }
    if (typeof value !== "string") {
      throw new Error(
        `Invalid agentHeaders: agentHeaders[${key}] must be a string (received ${typeof value})`,
      );
    }
    headers[key] = value;
  }

  return headers;
}

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
    }: UpdateProjectAgentSettingsToolInput) => {
      const result =
        await ctx.trpcClient.project.updateProjectAgentSettings.mutate({
          projectId,
          providerType,
          agentProviderType,
          agentUrl,
          agentName,
          agentHeaders: normalizeAgentHeaders(agentHeaders),
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
