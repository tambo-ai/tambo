import * as Sentry from "@sentry/nestjs";

const environment =
  process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development";

// Sentry MUST be initialized synchronously before any other imports
// so that auto-instrumentation (Postgres, HTTP, etc.) can patch modules
// before they're loaded by the app.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment,

    // Performance Monitoring
    tracesSampleRate: 1,

    // Profiling will be added after init if available
    profilesSampleRate: 1,

    // Integrations
    integrations: (defaults) => [
      // Keep all default integrations except the stock Http integration.
      // We exclude it so our customized Sentry.httpIntegration() below is the
      // only Http integration applied (avoids duplicate spans/breadcrumbs and
      // ensures our maxIncomingRequestBodySize setting takes effect).
      ...defaults.filter((integration) => integration.name !== "Http"),
      // NestJS integrations are auto-configured by @sentry/nestjs
      // Capture larger incoming request bodies on server routes
      // even with "always" setting, sentry never captures bodies exceeding 1 MB for performance and security reasons.
      Sentry.httpIntegration({
        maxIncomingRequestBodySize: "always",
      }),
    ],

    // Configure error filtering
    beforeSend(event, hint) {
      // Filter out specific errors if needed
      if (event.exception) {
        const error = hint.originalException as Error;

        // Don't send health check errors
        if (error.message?.includes("/health")) {
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

  // Try to add profiling integration after init (non-blocking)
  // This is fine to do async since profiling doesn't require module patching
  import("@sentry/profiling-node")
    .then(({ nodeProfilingIntegration }) => {
      Sentry.addIntegration(nodeProfilingIntegration());
      console.log("Sentry profiling integration loaded");
    })
    .catch((error) => {
      console.warn(
        "Could not load Sentry profiling integration (native module issue). Profiling will be disabled.",
        error instanceof Error ? error.message : error,
      );
    });
} else {
  console.log(
    "Sentry DSN not provided, skipping Sentry initialization, if you want to use Sentry, please contact us at support@tambo.co",
  );
}
