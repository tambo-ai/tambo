import { NextFunction, Request, Response } from "express";
import { normalizeRateLimitAddress } from "../common/rate-limit/rate-limit-address";

const MCP_RATE_WINDOW_MS = 60_000;
const MCP_RATE_LIMIT_ENTRIES_MAX = 10_000;
const MCP_OVERFLOW_KEY = "mcp:overflow";

interface McpRateLimitEntry {
  count: number;
  windowStart: number;
}

export type McpRateLimitMiddleware = ((
  req: Request,
  res: Response,
  next: NextFunction,
) => void) & {
  dispose: () => void;
};

export function createMcpRateLimitMiddleware(
  rateLimit: number,
): McpRateLimitMiddleware {
  const store = new Map<string, McpRateLimitEntry>();

  const removeExpiredEntries = (): void => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.windowStart > MCP_RATE_WINDOW_MS) {
        store.delete(key);
      }
    }
  };

  const sweepInterval = setInterval(removeExpiredEntries, MCP_RATE_WINDOW_MS);
  sweepInterval.unref();

  const getStorageKey = (tracker: string): string => {
    if (store.has(tracker)) {
      return tracker;
    }
    if (store.has(MCP_OVERFLOW_KEY)) {
      return MCP_OVERFLOW_KEY;
    }
    if (store.size < MCP_RATE_LIMIT_ENTRIES_MAX) {
      return tracker;
    }
    return MCP_OVERFLOW_KEY;
  };

  const middleware = ((req, res, next): void => {
    const tracker = `mcp:ip:${normalizeRateLimitAddress(
      req.ip ?? req.socket.remoteAddress,
    )}`;
    const now = Date.now();
    const storageKey = getStorageKey(tracker);
    const entry = store.get(storageKey);

    if (!entry || now - entry.windowStart > MCP_RATE_WINDOW_MS) {
      store.set(storageKey, { count: 1, windowStart: now });
      res.setHeader("X-RateLimit-Limit", rateLimit);
      res.setHeader("X-RateLimit-Remaining", rateLimit - 1);
      next();
      return;
    }

    entry.count++;
    if (entry.count > rateLimit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((entry.windowStart + MCP_RATE_WINDOW_MS - now) / 1000),
      );
      res.setHeader("Retry-After", retryAfterSeconds);
      res.setHeader("X-RateLimit-Limit", rateLimit);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", retryAfterSeconds);
      res
        .status(429)
        .type("application/problem+json")
        .json({
          type: "https://docs.tambo.co/reference/problems/rate-limit",
          status: 429,
          title: "Too Many Requests",
          detail: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
          instance: req.originalUrl ?? req.url,
        });
      return;
    }

    res.setHeader("X-RateLimit-Limit", rateLimit);
    res.setHeader("X-RateLimit-Remaining", rateLimit - entry.count);
    next();
  }) as McpRateLimitMiddleware;
  middleware.dispose = () => clearInterval(sweepInterval);
  return middleware;
}
