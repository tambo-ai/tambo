import { AdditionalContext } from "./types";

/**
 * Context helper that provides information about the user's current page
 * @returns Additional context with current page information
 */
export function getUserPageContext(): AdditionalContext {
  // Only run in browser environment
  if (typeof window === "undefined") {
    return {
      name: "userPage",
      context: {
        error: "Not in browser environment",
      },
    };
  }

  return {
    name: "userPage",
    context: {
      url: window.location.href,
      pathname: window.location.pathname,
      hostname: window.location.hostname,
      search: window.location.search,
      hash: window.location.hash,
      title: document.title,
      referrer: document.referrer,
    },
  };
}
