/* eslint-disable turbo/no-undeclared-env-vars */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

    // Start the devtools WebSocket server alongside the Next.js dev server
    if (process.env.NODE_ENV === "development") {
      await import("./devtools-server/server");
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
