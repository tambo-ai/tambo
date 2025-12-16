import * as Sentry from "@sentry/nestjs";

const environment =
  process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development";

async function initSentry() {
  // Only initialize if DSN is provided
  if (!process.env.SENTRY_DSN) {
    console.log(
      "Sentry DSN not provided, skipping Sentry initialization, if you want to use Sentry, please contact us at support@tambo.co",
    );
    return;
  }

  // Try to load profiling integration, but gracefully handle failures
  // (e.g., incompatible Node.js version, missing native module)
  let profilingIntegration:
    | (typeof import("@sentry/profiling-node"))["nodeProfilingIntegration"]
    | undefined;
  try {
    const { nodeProfilingIntegration } = await import("@sentry/profiling-node");
    profilingIntegration = nodeProfilingIntegration;
  } catch (error) {
    console.warn(
      "Could not load Sentry profiling integration (native module issue). Profiling will be disabled.",
      error instanceof Error ? error.message : error,
    );
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment,

    // Performance Monitoring
    tracesSampleRate: 1,

    // Profiling (requires tracing to be enabled)
    profilesSampleRate: profilingIntegration ? 1 : 0,

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
      // Add profiling integration if available
      ...(profilingIntegration ? [profilingIntegration()] : []),
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

void initSentry();
