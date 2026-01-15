import { NextRequest, NextResponse } from "next/server";

/**
 * Determines if the Accept header prefers Markdown/plain text over HTML.
 * Returns true if:
 * - `text/markdown` appears before `text/html`
 * - `text/plain` appears before `text/html`
 * - `text/html` is absent and `text/markdown` or `text/plain` is present
 */
function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;

  const accept = acceptHeader.toLowerCase();
  const htmlIndex = accept.indexOf("text/html");
  const markdownIndex = accept.indexOf("text/markdown");
  const plainIndex = accept.indexOf("text/plain");

  // If `text/html` is not present
  if (htmlIndex === -1) {
    return markdownIndex !== -1 || plainIndex !== -1;
  }

  // If `text/markdown` appears before `text/html`
  if (markdownIndex !== -1 && markdownIndex < htmlIndex) {
    return true;
  }

  // If `text/plain` appears before `text/html`
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
