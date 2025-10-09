import { LangfuseSpanProcessor, ShouldExportSpan } from "@langfuse/otel";

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { NestInstrumentation } from "@opentelemetry/instrumentation-nestjs-core";
import { NodeSDK, NodeSDKConfiguration } from "@opentelemetry/sdk-node";

// Initialize OpenTelemetry
export function initializeOpenTelemetry() {
  // Configure instrumentations
  const instrumentations = [
    new HttpInstrumentation({
      // Don't trace health checks and other noise
      ignoreIncomingRequestHook: (req) => {
        const url = req.url || "";
        return url.includes("/health") || url.includes("/metrics");
      },
    }),
    new ExpressInstrumentation(),
    new NestInstrumentation(),
    ...getNodeAutoInstrumentations(),
  ];

  // Create SDK configuration
  const sdkConfig: Partial<NodeSDKConfiguration> = {
    // resource,
    instrumentations,
    spanProcessors: [langfuseSpanProcessor],
  };

  // Initialize the SDK
  const sdk = new NodeSDK(sdkConfig);

  // Start the SDK
  sdk.start();

  console.log("OpenTelemetry initialized successfully");

  return sdk;
}

// Graceful shutdown
export async function shutdownOpenTelemetry(sdk: NodeSDK) {
  return await sdk.shutdown();
}

const shouldExportSpan: ShouldExportSpan = (span) => {
  return ![
    // for now just manually exclude these because we do not want them to go to
    // langfuse even though we are using them for sentry.
    "@opentelemetry/instrumentation-pg",
    "@opentelemetry/instrumentation-express",
    "@opentelemetry/instrumentation-net",
    "@opentelemetry/instrumentation-dns",
    "@opentelemetry/instrumentation-undici",
  ].includes(span.otelSpan.instrumentationScope.name);
};

export const langfuseSpanProcessor = new LangfuseSpanProcessor({
  shouldExportSpan,
});

export const sdk = initializeOpenTelemetry();
