/* eslint-disable turbo/no-undeclared-env-vars */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

    // Start the devtools WebSocket server alongside the Next.js dev server.
    // WS_NO_BUFFER_UTIL must be set BEFORE ws is imported — webpack hoists
    // imports above inline statements, so setting it inside server.ts is too late.
    if (process.env.NODE_ENV === "development") {
      process.env.WS_NO_BUFFER_UTIL = "1";
      await import("./devtools-server/server");
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
