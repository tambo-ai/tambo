import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Derives a short, meaningful server key from an MCP server URL.
 * This key is used to namespace tools, resources, and prompts from the server.
 *
 * Algorithm:
 * 1. Parse the hostname and split by periods
 * 2. Remove TLD patterns (e.g., .com, .co.uk)
 * 3. Filter out common prefixes (www, api, mcp, app, staging, dev, prod)
 * 4. Work backwards to find the first meaningful component
 * 5. Return lowercase result
 *
 * Examples:
 * - "https://mcp.linear.app/mcp" → "linear"
 * - "https://api.github.com" → "github"
 * - "https://google.com" → "google"
 * - "https://google.co.uk" → "google"
 * - "https://mcp.company.co.uk" → "company"
 *
 * @returns A lowercase server key derived from the URL hostname
 */
export function deriveServerKey(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    // Handle IP addresses explicitly
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
      return hostname.replace(/\./g, "_");
    }

    // Split hostname into parts
    const parts = hostname.split(".");

    // Remove common TLD patterns
    // Handle cases like: .com, .org, .co.uk, .com.au, etc.
    let relevantParts = [...parts];

    // If we have 3+ parts and the last two are short (likely TLD like .co.uk)
    if (
      relevantParts.length >= 3 &&
      relevantParts[relevantParts.length - 1].length <= 3 &&
      relevantParts[relevantParts.length - 2].length <= 3
    ) {
      relevantParts = relevantParts.slice(0, -2);
    }
    // Otherwise just remove the last part (TLD like .com)
    else if (relevantParts.length >= 2) {
      relevantParts = relevantParts.slice(0, -1);
    }

    // From what's left, prefer the rightmost part that's not a common prefix
    // Common prefixes: www, api, mcp, app, staging, dev, prod
    const commonPrefixes = new Set([
      "www",
      "api",
      "mcp",
      "app",
      "staging",
      "dev",
      "prod",
    ]);

    // Work backwards through the parts to find a meaningful name
    for (let i = relevantParts.length - 1; i >= 0; i--) {
      const part = relevantParts[i];
      if (part && !commonPrefixes.has(part.toLowerCase())) {
        return part.toLowerCase();
      }
    }

    // Fallback: use the last relevant part even if it's a common prefix
    return relevantParts[relevantParts.length - 1]?.toLowerCase() || hostname;
  } catch {
    // If URL parsing fails, just return a sanitized version of the input
    return url.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  }
}

/**
 * Validates that a serverKey is valid (min 2 characters, alphanumeric + underscore)
 * @returns True if the key is at least 2 characters and contains only alphanumeric characters or underscores
 */
export function isValidServerKey(key: string): boolean {
  const trimmed = key.trim();
  if (trimmed.length < 2) {
    return false;
  }
  // Allow alphanumeric and underscores
  return /^[a-zA-Z0-9_]+$/.test(trimmed);
}

export type ResourceFetcher = (uri: string) => Promise<ReadResourceResult>;
export type ResourceFetchResult = ReadResourceResult;
