import * as Sentry from "@sentry/nestjs";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

export function initializeSentry() {
  const environment = process.env.NODE_ENV || "development";

  // Only initialize if DSN is provided
  if (!process.env.SENTRY_DSN) {
    console.log(
      "Sentry DSN not provided, skipping Sentry initialization, if you want to use Sentry, please contact us at support@tambo.co",
    );
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment,

    // Performance Monitoring
    tracesSampleRate: 1,

    // Profiling (requires tracing to be enabled)
    profilesSampleRate: 1,

    // Integrations
    integrations: [
      // Profiling
      nodeProfilingIntegration(),
      // NestJS integrations are auto-configured by @sentry/nestjs
    ],

    // Configure error filtering
    beforeSend(event, hint) {
      // Filter out specific errors if needed
      if (event.exception) {
        const error = hint.originalException as Error;

        // Don't send health check errors
        if (error.message.includes("/health")) {
          return null;
        }
      }

      return event;
    },

    // Attach stack traces even for non-error events
    attachStacktrace: true,

    // Tags that will be applied to all events
    initialScope: {
      tags: {
        service: "tambo-cloud",
        component: "api",
      },
    },
  });

  console.log(`Sentry initialized for ${environment} environment`);
}
