import type { Context, Next } from "hono";

/**
 * Global error handler middleware
 * Catches errors thrown in route handlers and returns consistent JSON error responses
 */
export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error("Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return c.json(
      {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
};
