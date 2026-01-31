import type { Context, Next } from "hono";

/**
 * Simple logger middleware for Hono
 * Logs incoming requests with method, path, and response time
 */
export const logger = async (c: Context, next: Next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const status = c.res.status;
  const elapsed = Date.now() - start;

  // Color code based on status
  let statusColor = "\x1b[32m"; // green
  if (status >= 400 && status < 500) statusColor = "\x1b[33m"; // yellow
  if (status >= 500) statusColor = "\x1b[31m"; // red

  const reset = "\x1b[0m";
  const methodColor = "\x1b[36m"; // cyan

  console.log(
    `${methodColor}${method}${reset} ${path} ${statusColor}${status}${reset} - ${elapsed}ms`,
  );
};
