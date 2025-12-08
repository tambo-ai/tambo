import type { ToolContext } from "./types";

/**
 * Helper to invalidate project cache after mutations
 */
export async function invalidateProjectCache(ctx: ToolContext) {
  await ctx.utils.project.getUserProjects.invalidate();
}

/**
 * Helper to invalidate API keys cache for a specific project
 */
export async function invalidateApiKeysCache(
  ctx: ToolContext,
  projectId: string,
) {
  await ctx.utils.project.getApiKeys.invalidate(projectId);
}

/**
 * Helper to invalidate LLM settings cache for a specific project
 */
export async function invalidateLlmSettingsCache(
  ctx: ToolContext,
  projectId: string,
) {
  await ctx.utils.project.getProjectLlmSettings.invalidate({ projectId });
}

/**
 * Helper to invalidate OAuth settings cache for a specific project
 */
export async function invalidateOAuthSettingsCache(
  ctx: ToolContext,
  projectId: string,
) {
  await ctx.utils.project.getOAuthValidationSettings.invalidate({ projectId });
}

/**
 * Helper to invalidate MCP servers cache for a specific project
 */
export async function invalidateMcpServersCache(
  ctx: ToolContext,
  projectId: string,
) {
  await ctx.utils.tools.listMcpServers.invalidate({ projectId });
}
