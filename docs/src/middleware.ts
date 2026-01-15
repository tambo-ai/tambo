import { NextRequest, NextResponse } from "next/server";

/**
 * Parses the Accept header and extracts content types with their q-values.
 * Returns an Array<{type, q}> sorted by quality (descending).
 */
function parseAcceptHeader(
  acceptHeader: string,
): Array<{ type: string; q: number }> {
  return (
    acceptHeader
      .split(",")
      .map((part) => {
        const [type, ...params] = part.split(";").map((s) => s.trim());

        // Default q-value to 1.0 if not present
        let q = 1.0;
        for (const param of params) {
          // Extract q-values from parameters like "q=0.9"
          const match = param.match(/^q\s*=\s*([0-9.]+)$/i);
          if (match) {
            q = parseFloat(match[1]);
            break;
          }
        }

        return { type: type.toLowerCase(), q };
      })
      // Sort by q-value (descending)
      .sort((a, b) => b.q - a.q)
  );
}

/**
 * Determines if the Accept header prefers Markdown/plain text over HTML (sorted by q-values)
 * Returns true if:
 * - `text/markdown` has higher q-value than `text/html`
 * - `text/plain` has higher q-value than `text/html`
 * - `text/html` is absent and `text/markdown` or `text/plain` is present
 */
function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;

  const sortedEntries = parseAcceptHeader(acceptHeader);

  // Find indices in the sorted entries
  const htmlIndex = sortedEntries.findIndex(
    (entry) => entry.type === "text/html",
  );
  const markdownIndex = sortedEntries.findIndex(
    (entry) => entry.type === "text/markdown",
  );
  const plainIndex = sortedEntries.findIndex(
    (entry) => entry.type === "text/plain",
  );

  // If HTML is not present (index === -1)
  if (htmlIndex === -1) {
    return markdownIndex !== -1 || plainIndex !== -1;
  }

  // Check if markdown or plain appears before HTML in sorted order
  if (markdownIndex !== -1 && markdownIndex < htmlIndex) {
    return true;
  }

  if (plainIndex !== -1 && plainIndex < htmlIndex) {
    return true;
  }

  return false;
}

/**
 * Checks if the request path should be excluded from middleware processing.
 */
function shouldSkipPath(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname === "/llms.txt" || pathname === "/llms-full.txt") return true;
  if (pathname === "/robots.txt") return true;

  // Skip the Markdown route itself (avoids infinite loops)
  if (pathname === "/llms.mdx" || pathname.startsWith("/llms.mdx/"))
    return true;

  // Already handled by next.config.mjs
  if (pathname.endsWith(".mdx")) return true;

  // Skip static assets (extensions)
  const staticExtensions = [
    ".ico",
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".webp",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".eot",
    ".gif",
    ".webm",
    ".mp4",
  ];

  if (staticExtensions.some((ext) => pathname.endsWith(ext))) {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only process GET and HEAD requests
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  // Skip excluded paths
  if (shouldSkipPath(pathname)) {
    return NextResponse.next();
  }

  // Check if the request prefers Markdown
  const acceptHeader = request.headers.get("accept");
  if (prefersMarkdown(acceptHeader)) {
    // Rewrite to the Markdown route
    const url = request.nextUrl.clone();
    url.pathname = `/llms.mdx${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// Config matcher for performance
export const config = {
  matcher: [
    // Skip middleware for static assets
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
