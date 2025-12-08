import { z } from "zod/v3";

/**
 * Set of standard HTTP headers that should not be overridden in custom headers
 */
const UNSAFE_HEADERS = new Set([
  // Common HTTP headers that should not be overridden
  "accept",
  "accept-charset",
  "accept-encoding",
  "accept-language",
  "accept-ranges",
  "age",
  "allow",
  "cache-control",
  "connection",
  "content-encoding",
  "content-language",
  "content-length",
  "content-location",
  "content-range",
  "content-type",
  "cookie",
  "date",
  "etag",
  "expect",
  "expires",
  "from",
  "host",
  "if-match",
  "if-modified-since",
  "if-none-match",
  "if-range",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "pragma",
  "proxy-authenticate",
  "proxy-authorization",
  "range",
  "referer",
  "retry-after",
  "server",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "user-agent",
  "vary",
  "via",
  "warning",
  "www-authenticate",
]);

/**
 * List of allowed header name prefixes for custom headers
 */
const SAFE_HEADER_PREFIXES = [
  "x-",
  "authorization",
  "api-key",
  "bearer",
  "token",
];

/**
 * Validates if a header name is safe to use as a custom header
 * @param headerName The header name to validate
 * @returns boolean indicating if the header name is safe to use
 */
export function validateHeaderName(headerName: string): boolean {
  const lowerHeader = headerName.toLowerCase();

  // Check if it's an unsafe header
  if (UNSAFE_HEADERS.has(lowerHeader)) {
    return false;
  }

  // Check if it starts with any safe prefix
  return SAFE_HEADER_PREFIXES.some((prefix) =>
    lowerHeader.startsWith(prefix.toLowerCase()),
  );
}

/**
 * Zod schema for validating custom headers
 */
export const customHeadersSchema = z
  .record(
    z
      .string()
      .refine(
        validateHeaderName,
        "Invalid header name. Only custom headers (x-*) and authentication headers are allowed.",
      ),
    z.string(),
  )
  .optional();
