/**
 * Context helper that provides the user's current time and timezone
 * @returns the raw context value. The provider will wrap it with the key.
 */
export function currentTimeContextHelperContext(): Record<string, unknown> {
  const now = new Date();

  return {
    timestamp: now.toISOString(),
  };
}
