import { ContextHelperFn } from "./types";

/**
 * Prebuilt context helper that provides information about the user's current page.
 * @returns a value to include it, or null/undefined to skip.
 */
export const currentPageContextHelper: ContextHelperFn = () => {
  try {
    if (typeof window === "undefined") {
      return null;
    }
    return {
      url: window.location.href,
      title: document.title,
    };
  } catch (e) {
    console.error("prebuiltUserPage failed:", e);
    return null;
  }
};
