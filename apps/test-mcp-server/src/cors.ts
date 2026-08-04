import type { RequestHandler } from "express";

const LOCAL_ORIGIN_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const ALLOWED_METHODS = "GET, POST, DELETE";
const ALLOWED_HEADERS =
  "authorization, content-type, mcp-protocol-version, mcp-session-id, last-event-id";
const EXPOSED_HEADERS = "mcp-session-id, last-event-id, mcp-protocol-version";

export function isAllowedCorsOrigin(
  origin: string | undefined,
  allowedOrigins: readonly string[],
): boolean {
  if (!origin || allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      LOCAL_ORIGIN_HOSTS.has(url.hostname)
    );
  } catch {
    return false;
  }
}

export function createMcpCorsMiddleware(
  allowedOrigins: readonly string[],
): RequestHandler {
  return (request, response, next) => {
    const origin = request.header("origin");

    if (!isAllowedCorsOrigin(origin, allowedOrigins)) {
      response.status(403).send("Origin is not allowed");
      return;
    }

    if (!origin) {
      next();
      return;
    }

    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
    response.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS);
    response.setHeader("Access-Control-Expose-Headers", EXPOSED_HEADERS);
    response.vary("Origin");

    if (request.method === "OPTIONS") {
      response.sendStatus(204);
      return;
    }

    next();
  };
}
