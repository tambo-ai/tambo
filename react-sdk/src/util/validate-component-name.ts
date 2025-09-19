/**
 * Validates that a name matches OpenAI function name requirements
 * @param name The name to validate
 * @param contextName The context name (e.g., "component", "tool")
 */
export function assertValidName(name: string, contextName: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(
      `${contextName} "${name}" must only contain letters, numbers, underscores, and hyphens.`,
    );
  }
}
