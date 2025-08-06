import { AdditionalContextHelper, CustomContextHelperConfig } from "./types";
import { getUserPageContext } from "./user-page";
import { getUserTimeContext } from "./user-time";

export * from "./types";
export * from "./user-page";
export * from "./user-time";

/**
 * Pre-built context helpers that can be enabled/disabled
 */
export const DEFAULT_CONTEXT_HELPERS: AdditionalContextHelper[] = [
  {
    name: "userTime",
    enabled: false, // Default to disabled
    run: getUserTimeContext,
  },
  {
    name: "userPage",
    enabled: false, // Default to disabled
    run: getUserPageContext,
  },
];

/**
 * Helper function to create a custom context helper configuration
 * @param run - Function that returns the context data
 * @param enabled - Whether the helper should be enabled by default
 * @returns A context helper configuration
 */
export function createContextHelper<T = Record<string, unknown>>(
  run: () => T | Promise<T>,
  enabled = true,
): CustomContextHelperConfig<T> {
  return {
    enabled,
    run,
  };
}
