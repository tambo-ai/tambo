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
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + 10 * 60 * 1000).toUTCString();
  const isSecure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const secureAttr = isSecure ? "; Secure" : "";
  document.cookie = `${PENDING_LEGAL_COOKIE}=true; path=/; expires=${expires}; SameSite=Lax${secureAttr}`;
}

/**
 * Checks if the pending legal acceptance cookie is set.
 * Uses proper cookie parsing to avoid false positives.
 */
export function hasPendingLegalCookie(): boolean {
  if (typeof document === "undefined") return false;
  const cookies = document.cookie.split(";").map((c) => c.trim());
  return cookies.some((c) => c === `${PENDING_LEGAL_COOKIE}=true`);
}

/**
 * Clears the pending legal acceptance cookie.
 */
export function clearPendingLegalCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${PENDING_LEGAL_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
