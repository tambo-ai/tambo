/**
 * Cookie utilities for tracking pending legal acceptance during OAuth flow.
 *
 * When a user checks the legal checkbox on the first screen before signing in,
 * we set a cookie to remember their acceptance intent. After OAuth completes,
 * we check for this cookie and auto-accept the legal terms.
 */

const PENDING_LEGAL_COOKIE = "pendingLegalAcceptance";

/**
 * Sets a cookie indicating the user accepted legal terms before auth.
 * Cookie expires in 10 minutes (enough time for OAuth flow).
 */
export function setPendingLegalCookie() {
  const expires = new Date(Date.now() + 10 * 60 * 1000).toUTCString();
  document.cookie = `${PENDING_LEGAL_COOKIE}=true; path=/; expires=${expires}; SameSite=Lax`;
}

/**
 * Checks if the pending legal acceptance cookie is set.
 */
export function hasPendingLegalCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${PENDING_LEGAL_COOKIE}=true`);
}

/**
 * Clears the pending legal acceptance cookie.
 */
export function clearPendingLegalCookie() {
  document.cookie = `${PENDING_LEGAL_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
