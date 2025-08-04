import { AdditionalContext } from "./types";

/**
 * Context helper that provides the user's current time and timezone
 * @returns Additional context with user's time information
 */
export function getUserTimeContext(): AdditionalContext {
  const now = new Date();

  return {
    name: "userTime",
    context: {
      localTime: now.toLocaleString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: now.toISOString(),
      offsetMinutes: now.getTimezoneOffset(),
    },
  };
}
