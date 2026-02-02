import type { ContextHelperFn } from "../types.js";

/**
 * Context helper that provides the current page URL and title.
 * Only works in browser environment.
 * @returns Current page context or null if not in browser
 */
export const currentPageContextHelper: ContextHelperFn = () => {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  return {
    url: window.location.href,
    pathname: window.location.pathname,
    title: document.title,
    hostname: window.location.hostname,
  };
};
