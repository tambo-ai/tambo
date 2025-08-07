/**
 * Context helper that provides information about the user's current page.
 * @returns the raw context value. The provider will wrap it with the key.
 */
export function getUserPageContext() {
  if (typeof window === "undefined") {
    return null; // Skip when not in browser
  }
  return {
    url: window.location.href,
    title: document.title,
  };
}
