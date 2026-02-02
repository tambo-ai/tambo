import * as Sentry from "@sentry/nestjs";
import { postgresIntegration } from "@sentry/node";

const environment =
  process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development";

// Try to load profiling integration synchronously
let profilingIntegration: ReturnType<
  typeof import("@sentry/profiling-node").nodeProfilingIntegration
> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const profiling = require("@sentry/profiling-node");
  profilingIntegration = profiling.nodeProfilingIntegration();
} catch {
  console.warn(
    "Could not load Sentry profiling integration (native module issue). Profiling will be disabled.",
  );
}

// Initialize Sentry SYNCHRONOUSLY before any other modules are imported
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment,

    // Performance Monitoring
    tracesSampleRate: 1,

    // Profiling (requires tracing to be enabled)
    profilesSampleRate: profilingIntegration ? 1 : 0,

    // Integrations
    integrations: (defaults) => [
      ...defaults.filter((integration) => integration.name !== "Http"),
      Sentry.httpIntegration({
        maxIncomingRequestBodySize: "always",
      }),
      // Database instrumentation
      postgresIntegration(),
      // Add profiling integration if available
      ...(profilingIntegration ? [profilingIntegration] : []),
    ],

    // Configure error filtering
    beforeSend(event, hint) {
      if (event.exception) {
        const error = hint.originalException as Error;
        if (error?.message?.includes("/health")) {
          return null;
        }
      }
      return event;
    },

    attachStacktrace: true,

    initialScope: {
      tags: {
        service: "tambo-cloud",
        component: "api",
      },
    },
  });

  console.log(`Sentry initialized for ${environment} environment`);
} else {
  console.log("Sentry DSN not provided, skipping Sentry initialization");
}
