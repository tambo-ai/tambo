import type { ContextHelperFn } from "../types.js";

/**
 * Context helper that provides the current time information.
 * @returns Current time context with ISO string and timezone
 */
export const currentTimeContextHelper: ContextHelperFn = () => {
  const now = new Date();

  return {
    iso: now.toISOString(),
    timestamp: now.getTime(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    localString: now.toLocaleString(),
  };
};
