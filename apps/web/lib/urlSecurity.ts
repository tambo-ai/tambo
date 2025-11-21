import { env } from "@/lib/env";
import dns from "dns/promises";
import { parse as parseTld } from "tldts";

// Helper to validate URLs are not pointing to unsafe locations
const isUnsafeHostname = (hostname: string): boolean => {
  const unsafePatterns = [
    // Local/Internal patterns
    /^localhost$/i,
    /^127\.\d+\.\d+\.\d+$/,
    /^0\.0\.0\.0$/,
    /^::1$/,
    /^\.local$/,
    /^[^.]+$/, // Single word hostnames without dots
    /\.local$/i,
    /\.localhost$/i,
    // Private IP ranges
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./, // Link-local

    // Private IPv6
    /^fc00::/i, // Unique local address
    /^fe80::/i, // Link-local

    // Potentially unsafe TLDs
    /\.test$/i,
    /\.example$/i,
    /\.invalid$/i,
    /\.localhost$/i,
  ];

  return unsafePatterns.some((pattern) => pattern.test(hostname));
};

// Helper to perform additional safety checks on the URL
export const validateSafeURL = async (
  urlOrFragment: string,
): Promise<{ safe: boolean; reason?: string }> => {
  // Skip validation if local MCP servers are allowed
  if (env.ALLOW_LOCAL_MCP_SERVERS) {
    return { safe: true };
  }

  // Enforce HTTPS-only URLs when a protocol is provided
  try {
    const maybeUrl = new URL(urlOrFragment);
    if (maybeUrl.protocol.toLowerCase() !== "https:") {
      return {
        safe: false,
        reason: "Only HTTPS protocol is allowed",
      };
    }
  } catch {
    // Not a fully-qualified URL; continue and validate as a hostname/fragment
  }

  // use tldts to check for host safety
  const tld = parseTld(urlOrFragment);

  if (!tld.isIcann || !tld.hostname) {
    return {
      safe: false,
      reason: "URL is not a valid domain",
    };
  }

  try {
    // Resolve IP addresses for the hostname
    const addresses = await dns.resolve(tld.hostname);

    // Check if any resolved IP is in private ranges
    for (const addr of addresses) {
      if (isUnsafeHostname(addr)) {
        return {
          safe: false,
          reason: "URL resolves to a private or internal network address",
        };
      }
    }

    return { safe: true };
  } catch (error) {
    return {
      safe: false,
      reason: `Unable to verify URL safety: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

/** Validate that the URL is safe to call from the server */
export const validateServerUrl = async (url: string): Promise<boolean> => {
  try {
    const valid = await validateSafeURL(url);
    if (!valid.safe) {
      console.error("URL is unsafe:", valid.reason);
    }
    return valid.safe;
  } catch {
    return false;
  }
};
