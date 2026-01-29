/**
 * Auth preferences stored in localStorage.
 *
 * Tracks:
 * - Last used OAuth provider (for "Last used" badge)
 * - Legal acceptance version (for returning user flow with version awareness)
 */

import { LEGAL_CONFIG } from "./legal-config";

const LAST_USED_PROVIDER_KEY = "tambo_last_used_provider";
const LEGAL_ACCEPTED_VERSION_KEY = "tambo_legal_accepted_version";

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
 * Checks if this browser has previously completed legal acceptance for the current version.
 * Used to skip the checkbox for returning users.
 *
 * @returns true if the stored version meets the minimum required version
 */
export function hasAcceptedLegalBefore(): boolean {
  if (typeof window === "undefined") return false;
  const storedVersion = localStorage.getItem(LEGAL_ACCEPTED_VERSION_KEY);
  if (!storedVersion) return false;
  // Version comparison: stored version must meet minimum version
  return storedVersion >= LEGAL_CONFIG.MINIMUM_VERSION;
}

/**
 * Gets the stored legal acceptance version.
 *
 * @returns the stored version string, or null if not set
 */
export function getAcceptedLegalVersion(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LEGAL_ACCEPTED_VERSION_KEY);
}

/**
 * Marks that this browser has completed legal acceptance with the current version.
 * Called after successful legal acceptance to remember for future logins.
 */
export function setLegalAcceptedInBrowser() {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    LEGAL_ACCEPTED_VERSION_KEY,
    LEGAL_CONFIG.CURRENT_VERSION,
  );
}

/**
 * Clears auth preferences (useful for testing or logout).
 */
export function clearAuthPreferences() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LAST_USED_PROVIDER_KEY);
  localStorage.removeItem(LEGAL_ACCEPTED_VERSION_KEY);
}
