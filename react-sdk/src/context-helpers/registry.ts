/**
 * Global context helpers registry.
 * Consumers can add/remove helpers and resolve additional context anywhere.
 */

export type HelperFn = () =>
  | any
  | null
  | undefined
  | Promise<any | null | undefined>;

let helpers: Record<string, HelperFn> = {};

/**
 * Get the current helpers map (by reference).
 * @returns The current helpers map.
 */
export function getHelpers(): Record<string, HelperFn> {
  return helpers;
}

/**
 * Replace the entire helpers map (used for hydration/reset in tests).
 * @param next - The new helpers map.
 */
export function setHelpers(next: Record<string, HelperFn>) {
  helpers = next;
}

/**
 * Add or replace a helper.
 * @param name - The name of the helper.
 * @param fn - The helper function.
 */
export function addHelper(name: string, fn: HelperFn) {
  helpers[name] = fn;
}

/**
 * Remove a helper by name.
 * @param name - The name of the helper.
 */
export function removeHelper(name: string) {
  delete helpers[name];
}

/**
 * Resolve all helpers to AdditionalContext entries, skipping null/undefined and errors.
 * @returns The resolved additional context.
 */
export async function resolveAdditionalContext(): Promise<
  { name: string; context: any }[]
> {
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

  return results.filter(Boolean) as { name: string; context: any }[];
}
