/**
 * Global context helpers registry.
 * Consumers can add/remove helpers and resolve additional context anywhere.
 */

export type HelperFn = () =>
  | unknown
  | null
  | undefined
  | Promise<unknown | null | undefined>;

/**
 * Resolve all helpers to AdditionalContext entries, skipping null/undefined and errors.
 * @returns The resolved additional context.
 */
export async function resolveAdditionalContext(
  helpers: Record<string, HelperFn>,
): Promise<{ name: string; context: unknown }[]> {
  const entries = Object.entries(helpers);
  if (entries.length === 0) return [];

  const results = await Promise.all(
    entries.map(async ([name, fn]) => {
      try {
        const value = await fn();
        if (value == null) return null;
        return { name, context: value };
      } catch (error) {
        console.error(`Error running context helper ${name}:`, error);
        return null;
      }
    }),
  );

  return results.filter(Boolean) as { name: string; context: unknown }[];
}
