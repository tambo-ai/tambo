import { env } from "./env";

export const LEGAL_CONFIG = {
  // Current version - update this when legal docs change
  CURRENT_VERSION: "vF",

  // Set to true to force re-acceptance for all users
  FORCE_REACCEPT: false,

  // Minimum accepted version (users with older versions must re-accept)
  MINIMUM_VERSION: "vF",

  // Document URLs
  URLS: {
    TERMS: env.NEXT_PUBLIC_TERMS_URL || "/terms",
    PRIVACY: env.NEXT_PUBLIC_PRIVACY_URL || "/privacy",
    LICENSE: env.NEXT_PUBLIC_LICENSE_URL || "/license",
  },
} as const;

// Helper to check if user needs to accept new version
export function needsLegalAcceptance(
  userVersion: string | null,
  forceReaccept: boolean = LEGAL_CONFIG.FORCE_REACCEPT,
): boolean {
  if (!userVersion) return true;
  if (forceReaccept) return true;

  // Add version comparison logic here if needed
  // For now, simple string comparison
  return userVersion < LEGAL_CONFIG.MINIMUM_VERSION;
}
