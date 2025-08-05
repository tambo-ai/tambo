import { AdditionalContextHelper } from "./types";
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
