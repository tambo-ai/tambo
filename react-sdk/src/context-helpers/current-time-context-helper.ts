import { ContextHelperFn } from "./types";

/**
 * Prebuilt context helper that provides information about the user's current time.
 * @returns a value to include it, or null/undefined to skip.
 */
export const currentTimeContextHelper: ContextHelperFn = () => {
  try {
    const now = new Date();
    return {
      timestamp: now.toString(),
    };
  } catch (e) {
    console.error("prebuiltUserTime failed:", e);
    return null;
  }
};
