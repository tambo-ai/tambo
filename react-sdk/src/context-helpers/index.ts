import { ContextHelperFn } from "./types";
import { getUserPageContext } from "./user-page";
import { getUserTimeContext } from "./user-time";

export * from "./types";
export * from "./user-page";
export * from "./user-time";

/**
 * Prebuilt context helper that provides information about the user's current time.
 * @returns a value to include it, or null/undefined to skip.
 */
export const getUserTime: ContextHelperFn = () => {
  try {
    return getUserTimeContext();
  } catch (e) {
    console.error("prebuiltUserTime failed:", e);
    return null;
  }
};

/**
 * Prebuilt context helper that provides information about the user's current page.
 * @returns a value to include it, or null/undefined to skip.
 */
export const getUserPage: ContextHelperFn = () => {
  try {
    return getUserPageContext();
  } catch (e) {
    console.error("prebuiltUserPage failed:", e);
    return null;
  }
};
