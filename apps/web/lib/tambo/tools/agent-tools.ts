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

function formatAgentHeaderKeyForError(key: string): string {
  const maxLength = 120;
  const truncatedKey =
    key.length > maxLength ? `${key.slice(0, maxLength)}…` : key;
  return JSON.stringify(truncatedKey);
}

// Block keys commonly used in prototype pollution attacks. This is defense-in-depth
// alongside using a null-prototype accumulator.
function isPrototypePollutionKey(key: string): boolean {
  return key === "__proto__" || key === "prototype" || key === "constructor";
}

// Intentionally enforce RFC 7230 token syntax for header names on the tool boundary.
const headerNameTokenRegex = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

function hasUnsafeHeaderValueChars(value: string): boolean {
  for (const char of value) {
    const charCode = char.charCodeAt(0);
    // Disallow CTL characters (0x00-0x1F, 0x7F) per RFC 7230. We intentionally
    // disallow all control characters (including horizontal tab).
    if (charCode <= 0x1f || charCode === 0x7f) {
      return true;
    }
  }

  return false;
}

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

  const headers = Object.create(null) as Record<string, string>;
  for (const [key, value] of Object.entries(
    agentHeaders as Record<string, unknown>,
  )) {
    if (isPrototypePollutionKey(key)) {
      throw new Error(
        `Invalid agentHeaders: forbidden key ${formatAgentHeaderKeyForError(key)}`,
      );
    }
    if (!headerNameTokenRegex.test(key)) {
      throw new Error(
        `Invalid agentHeaders: invalid header name ${formatAgentHeaderKeyForError(key)}`,
      );
    }
    if (typeof value !== "string") {
      throw new Error(
        `Invalid agentHeaders: value for header ${formatAgentHeaderKeyForError(key)} must be a string (received ${typeof value})`,
      );
    }
    if (hasUnsafeHeaderValueChars(value)) {
      throw new Error(
        `Invalid agentHeaders: header value for ${formatAgentHeaderKeyForError(key)} contains control characters`,
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
