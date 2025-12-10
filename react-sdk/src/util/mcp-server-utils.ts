import type {
  McpServerInfo,
  NormalizedMcpServerInfo,
} from "../model/mcp-server-info";
import { getMcpServerUniqueKey, MCPTransport } from "../model/mcp-server-info";

/**
 * Derives a short, meaningful key from a server URL.
 * Strips TLDs and common prefixes to get a human-readable identifier.
 * For example, "https://mcp.linear.app/mcp" becomes "linear".
 * @returns A lowercased, human-readable key derived from the URL
 */
export function deriveServerKey(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

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
    // Common prefixes: www, api, mcp, app, etc.
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
 * Normalizes an MCP server info object, ensuring it has a serverKey.
 * If serverKey is not provided, derives it from the URL.
 * @returns The normalized MCP server info object
 */
export function normalizeServerInfo(
  server: McpServerInfo | string,
): NormalizedMcpServerInfo {
  const base: McpServerInfo =
    typeof server === "string"
      ? {
          url: server,
          transport: MCPTransport.HTTP,
        }
      : server;

  const serverKey = base.serverKey ?? deriveServerKey(base.url);
  const transport = base.transport ?? MCPTransport.HTTP;

  return { ...base, transport, serverKey };
}

/**
 * Deduplicates MCP servers by connection identity and ensures serverKey uniqueness.
 * First deduplicates by connection (url + transport), then ensures serverKey uniqueness
 * by appending -2, -3, etc. to duplicate serverKeys.
 * @param servers - Array of normalized MCP server info objects
 * @returns Array of deduplicated servers with unique serverKeys
 */
export function deduplicateMcpServers(
  servers: NormalizedMcpServerInfo[],
): NormalizedMcpServerInfo[] {
  if (servers.length === 0) {
    return servers;
  }

  // 1. Deduplicate by connection identity using a stable key
  const byKey = new Map<string, NormalizedMcpServerInfo>();
  for (const server of servers) {
    const key = getMcpServerUniqueKey(server);
    byKey.set(key, server);
  }

  const deduped = Array.from(byKey.values());

  // 2. Ensure serverKey uniqueness for readable, unambiguous prefixes
  const seen = new Map<string, number>();
  return deduped.map((server) => {
    const baseKey = server.serverKey;
    const count = (seen.get(baseKey) ?? 0) + 1;
    seen.set(baseKey, count);

    if (count === 1) {
      return server;
    }

    return {
      ...server,
      serverKey: `${baseKey}-${count}`,
    };
  });
}
