import { NextFunction, Request, Response } from "express";

const MCP_RATE_WINDOW_MS = 60_000;
const MCP_RATE_LIMIT_ENTRIES_MAX = 10_000;

interface MpcRateLimitEntry {
  count: number;
  windowStart: number;
}

export function createMcpRateLimitMiddleware(
  rateLimit: number,
): (req: Request, res: Response, next: NextFunction) => void {
  const store = new Map<string, MpcRateLimitEntry>();

  const removeExpiredEntries = (): void => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.windowStart > MCP_RATE_WINDOW_MS) {
        store.delete(key);
      }
    }
  };

  const evictFirstEntry = (): void => {
    const firstKey = store.keys().next().value;
    if (typeof firstKey === "string") {
      store.delete(firstKey);
    }
  };

  const sweepInterval = setInterval(removeExpiredEntries, MCP_RATE_WINDOW_MS);
  sweepInterval.unref();

  return (req, res, next): void => {
    const tracker = `mcp:ip:${req.ip ?? req.socket.remoteAddress ?? "unknown"}`;
    const now = Date.now();
    const entry = store.get(tracker);

    if (!entry || now - entry.windowStart > MCP_RATE_WINDOW_MS) {
      if (store.size >= MCP_RATE_LIMIT_ENTRIES_MAX) {
        evictFirstEntry();
      }
      store.set(tracker, { count: 1, windowStart: now });
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
  };
}
