/**
 * Auth preferences stored in localStorage.
 *
 * Tracks:
 * - Last used OAuth provider (for "Last used" badge)
 * - Whether user has accepted legal terms (for returning user flow)
 */

const LAST_USED_PROVIDER_KEY = "tambo_last_used_provider";
const LEGAL_ACCEPTED_KEY = "tambo_legal_accepted";

/**
 * Gets the last used OAuth provider ID.
 */
export function getLastUsedProvider(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_USED_PROVIDER_KEY);
}

/**
 * Saves the OAuth provider as last used.
 */
export function setLastUsedProvider(providerId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_USED_PROVIDER_KEY, providerId);
}

/**
 * Checks if this browser has previously completed legal acceptance.
 * Used to skip the checkbox for returning users.
 */
export function hasAcceptedLegalBefore(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LEGAL_ACCEPTED_KEY) === "true";
}

/**
 * Marks that this browser has completed legal acceptance.
 * Called after successful legal acceptance to remember for future logins.
 */
export function setLegalAcceptedInBrowser() {
  if (typeof window === "undefined") return;
  localStorage.setItem(LEGAL_ACCEPTED_KEY, "true");
}

/**
 * Clears auth preferences (useful for testing or logout).
 */
export function clearAuthPreferences() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LAST_USED_PROVIDER_KEY);
  localStorage.removeItem(LEGAL_ACCEPTED_KEY);
}
