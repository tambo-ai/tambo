import { env } from "@/lib/env";
import { isUnsafeIP } from "@tambo-ai-cloud/core";
import dns from "dns/promises";
import { parse as parseTld } from "tldts";

// Hostname patterns that must be rejected before any DNS resolution. These
// guard against attempts to bypass DNS by using literal local names or
// reserved TLDs.
const UNSAFE_HOSTNAME_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^[^.:]+$/, // single-label hostnames (e.g. "internal") — never public
  /\.local$/i,
  /\.localhost$/i,
  /\.test$/i,
  /\.example$/i,
  /\.invalid$/i,
];

const isUnsafeHostname = (hostname: string): boolean =>
  UNSAFE_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname));

/**
 * Options for `validateSafeURL`.
 *
 * `allowLocalMcp` is the per-call opt-out for the MCP dev workflow. It MUST
 * NOT be wired into general-purpose call sites — the only legitimate use is
 * from `validateSafeURLForMcp` / `validateServerUrlForMcp` below, where the
 * operator has explicitly set `ALLOW_LOCAL_MCP_SERVERS`. Other call sites
 * (custom LLM base URL, agent URL) must always perform full validation.
 */
export interface ValidateSafeURLOptions {
  /** When true, skip all safety checks. MCP-specific opt-out. */
  allowLocalMcp?: boolean;
}

// Helper to perform additional safety checks on the URL
export const validateSafeURL = async (
  urlOrFragment: string,
  options: ValidateSafeURLOptions = {},
): Promise<{ safe: boolean; reason?: string }> => {
  if (options.allowLocalMcp) {
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

  if (isUnsafeHostname(tld.hostname)) {
    return {
      safe: false,
      reason: "URL resolves to a private or internal network address",
    };
  }

  // Resolve A and AAAA in parallel. Node's `dns.resolve` defaults to A records
  // only, while the runtime fetch path uses `getaddrinfo` (via `dns.lookup`)
  // and returns both families on dual-stack hosts. An attacker-controlled
  // domain with a public A record and an AAAA pointing at loopback / IMDS /
  // cluster-internal IPv6 would otherwise pass validation and connect to the
  // AAAA address at fetch time.
  const [v4Result, v6Result] = await Promise.allSettled([
    dns.resolve4(tld.hostname),
    dns.resolve6(tld.hostname),
  ]);

  const v4 = v4Result.status === "fulfilled" ? v4Result.value : [];
  const v6 = v6Result.status === "fulfilled" ? v6Result.value : [];
  const addresses = [...v4, ...v6];

  if (addresses.length === 0) {
    const errors: string[] = [];
    if (v4Result.status === "rejected") {
      errors.push(
        v4Result.reason instanceof Error
          ? v4Result.reason.message
          : String(v4Result.reason),
      );
    }
    if (v6Result.status === "rejected") {
      errors.push(
        v6Result.reason instanceof Error
          ? v6Result.reason.message
          : String(v6Result.reason),
      );
    }
    return {
      safe: false,
      reason: `Unable to verify URL safety: ${errors.join("; ") || "no addresses returned"}`,
    };
  }

  for (const addr of addresses) {
    if (isUnsafeIP(addr)) {
      return {
        safe: false,
        reason: "URL resolves to a private or internal network address",
      };
    }
  }

  return { safe: true };
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

/**
 * MCP-specific validation that honours the `ALLOW_LOCAL_MCP_SERVERS` env
 * flag. Use only from MCP call sites; non-MCP code paths must use
 * `validateSafeURL` / `validateServerUrl` so the dev flag cannot disable
 * SSRF protection on unrelated URL fields (custom LLM base URL, agent URL).
 */
export const validateSafeURLForMcp = async (
  urlOrFragment: string,
): Promise<{ safe: boolean; reason?: string }> =>
  await validateSafeURL(urlOrFragment, {
    allowLocalMcp: !!env.ALLOW_LOCAL_MCP_SERVERS,
  });

/** MCP-specific boolean wrapper, equivalent to `validateServerUrl`. */
export const validateServerUrlForMcp = async (
  url: string,
): Promise<boolean> => {
  try {
    const valid = await validateSafeURLForMcp(url);
    if (!valid.safe) {
      console.error("URL is unsafe:", valid.reason);
    }
    return valid.safe;
  } catch {
    return false;
  }
};
