export const UI_TOOLNAME_PREFIX = "show_component_" as const;

export function isUiToolName(toolName: string | undefined | null): boolean {
  return (
    typeof toolName === "string" && toolName.startsWith(UI_TOOLNAME_PREFIX)
  );
}
