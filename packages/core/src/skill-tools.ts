/**
 * Provider-managed tool names used for skill execution.
 * These internal names are replaced with SKILL_TOOL_DISPLAY_NAME
 * in streaming events so the UI doesn't show "code_execution" or "shell".
 */
export const PROVIDER_SKILL_TOOL_NAMES = new Set(["code_execution", "shell"]);

/** User-facing display name for provider-managed skill tools. */
export const SKILL_TOOL_DISPLAY_NAME = "skill";

/**
 * Check whether a tool name is a provider-managed skill tool.
 * @returns True if the tool name matches a known provider skill tool name
 *   OR the sanitized display name.
 */
export function isSkillToolName(toolName: string | undefined | null): boolean {
  return (
    typeof toolName === "string" &&
    (PROVIDER_SKILL_TOOL_NAMES.has(toolName) ||
      toolName === SKILL_TOOL_DISPLAY_NAME)
  );
}
