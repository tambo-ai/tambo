import dns from "dns/promises";
import { parse as parseTld } from "tldts";

// Helper to validate URLs are not pointing to unsafe locations
export const isUnsafeHostname = (hostname: string): boolean => {
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
  hostname: string,
): Promise<{ safe: boolean; reason?: string }> => {
  // use tldts to check for host safety
  const tld = parseTld(hostname);
  if (!tld.isIcann) {
    return {
      safe: false,
      reason: "URL is not a valid domain",
    };
  }

  try {
    // Resolve IP addresses for the hostname
    const addresses = await dns.resolve(hostname);

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
  } catch (_error) {
    return {
      safe: false,
      reason: "Unable to verify URL safety",
    };
  }
};
