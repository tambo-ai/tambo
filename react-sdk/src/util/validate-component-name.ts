/**
 * Validates that a name contains no whitespace characters
 * @param name The name to validate
 * @param contextName The context name (e.g., "component", "tool")
 */
export function assertNoSpacesInName(name: string, contextName: string): void {
  if (/\s/.test(name)) {
    throw new Error(
      `${contextName} "${name}" cannot contain spaces. Use underscores, hyphens, or camelCase instead.`,
    );
  }
}
