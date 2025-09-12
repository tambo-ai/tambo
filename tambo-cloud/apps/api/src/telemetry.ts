import { LangfuseSpanProcessor, ShouldExportSpan } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

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
  };

  // this isn't quite working yet
  // sdkConfig.traceExporter = new OTLPTraceExporter(langfuseConfig);
  // console.log("OpenTelemetry configured with Langfuse exporter");

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
// Optional: filter our NextJS infra spans
const shouldExportSpan: ShouldExportSpan = (span) => {
  return span.otelSpan.instrumentationScope.name !== "next.js";
};

export const langfuseSpanProcessor = new LangfuseSpanProcessor({
  shouldExportSpan,
});

const tracerProvider = new NodeTracerProvider({
  spanProcessors: [langfuseSpanProcessor],
});

tracerProvider.register();
