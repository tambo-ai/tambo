import type { FullConfig } from "../schemas";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Helper for defining typed config in tambo.config.ts files.
 * Provides type checking and autocomplete in IDEs.
 *
 * @example
 * // tambo.config.ts
 * import { defineConfig } from "@tambo-ai-cloud/config";
 *
 * export default defineConfig({
 *   cli: {
 *     components: {
 *       prefix: "src/ui/tambo",
 *     },
 *   },
 * });
 */
export function defineConfig(
  config: DeepPartial<FullConfig>,
): DeepPartial<FullConfig> {
  return config;
}
