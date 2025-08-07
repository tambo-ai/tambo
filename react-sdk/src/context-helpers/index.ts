import { ContextHelperFn } from "./types";
import { currentPageContextHelperContext } from "./user-page";
import { currentTimeContextHelperContext } from "./user-time";

export * from "./types";
export * from "./user-page";
export * from "./user-time";

/**
 * Prebuilt context helper that provides information about the user's current time.
 * @returns a value to include it, or null/undefined to skip.
 */
export const currentTimeContextHelper: ContextHelperFn = () => {
  try {
    return currentTimeContextHelperContext();
  } catch (e) {
    console.error("prebuiltUserTime failed:", e);
    return null;
  }
};

/**
 * Prebuilt context helper that provides information about the user's current page.
 * @returns a value to include it, or null/undefined to skip.
 */
export const currentPageContextHelper: ContextHelperFn = () => {
  try {
    return currentPageContextHelperContext();
  } catch (e) {
    console.error("prebuiltUserPage failed:", e);
    return null;
  }
};
