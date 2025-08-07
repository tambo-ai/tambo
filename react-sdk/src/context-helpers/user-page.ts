/**
 * Context helper that provides information about the user's current page.
 * @returns the raw context value. The provider will wrap it with the key.
 */
export function getUserPageContext(): Record<string, unknown> | null {
  if (typeof window === "undefined") {
    return null;
  }
  return {
    url: window.location.href,
    title: document.title,
  };
}
