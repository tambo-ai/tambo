/**
 * Generates a unique context key for OAuth authentication based on the original
 * issuer and organizational claims from various enterprise identity providers.
 *
 * Supports enterprise identity providers with organizational context:
 * - Google Workspace: Uses 'hd' (hosted domain) claim
 * - Microsoft Azure AD: Uses 'tid' (tenant ID) claim
 * - WorkOS: Uses 'org_id' claims
 * - Auth0 Organizations: Uses 'org_id' claims
 * - Generic providers: Falls back to issuer hostname
 *
 * Context key formats:
 * - Google consumer: oauth:user:accounts.google.com:${sub}
 * - Google Workspace: oauth:user:accounts.google.com:${hd}:${sub}
 * - Microsoft Azure AD: oauth:user:login.microsoftonline.com:${tid}:${sub}
 * - WorkOS/Auth0 with org: oauth:user:${hostname}:${org_id}:${sub}
 * - Other providers: oauth:user:${hostname}:${sub}
 * - Legacy fallback: oauth:user:${sub}
 *
 * @param originalIssuer - The original OAuth issuer URL from the token
 * @param orgClaims - Object containing organizational claims from the token
 * @param sub - The subject (user ID) from the token
 * @returns A unique context key string
 */
export function generateContextKey(
  originalIssuer: unknown,
  orgClaims: {
    // Google Workspace
    hd?: unknown;
    // Microsoft Azure AD
    tid?: unknown;
    // WorkOS, Auth0, and other enterprise providers
    org_id?: unknown;
  },
  sub: string,
): string {
  // Legacy fallback if no issuer information is available
  if (!originalIssuer || typeof originalIssuer !== "string") {
    return `oauth:user:${sub}`;
  }

  // Parse the issuer URL safely
  let issuerHostname: string;
  try {
    issuerHostname = new URL(originalIssuer).hostname;
  } catch {
    console.warn("Failed to parse issuer URL from token: ", originalIssuer);
    // If URL parsing fails, use the issuer as-is but sanitized
    issuerHostname = originalIssuer.replace(/[^a-zA-Z0-9.-]/g, "_");
  }

  // Handle Google Workspace vs consumer accounts
  if (
    issuerHostname === "accounts.google.com" &&
    orgClaims.hd &&
    typeof orgClaims.hd === "string" &&
    orgClaims.hd.trim() !== ""
  ) {
    return `oauth:user:${issuerHostname}:${orgClaims.hd}:${sub}`;
  }

  // Handle Microsoft Azure AD/Entra ID with tenant context
  if (
    (issuerHostname === "login.microsoftonline.com" ||
      issuerHostname.endsWith(".microsoftonline.com") ||
      issuerHostname === "sts.windows.net") &&
    orgClaims.tid &&
    typeof orgClaims.tid === "string" &&
    orgClaims.tid.trim() !== ""
  ) {
    return `oauth:user:${issuerHostname}:${orgClaims.tid}:${sub}`;
  }

  // Handle WorkOS, Auth0, and other enterprise providers with org_id
  if (
    orgClaims.org_id &&
    typeof orgClaims.org_id === "string" &&
    orgClaims.org_id.trim() !== ""
  ) {
    return `oauth:user:${issuerHostname}:${orgClaims.org_id}:${sub}`;
  }

  // Standard provider without organizational context
  return `oauth:user:${issuerHostname}:${sub}`;
}
