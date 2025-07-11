import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { NestInstrumentation } from "@opentelemetry/instrumentation-nestjs-core";
import { NodeSDK, NodeSDKConfiguration } from "@opentelemetry/sdk-node";
import { LangfuseExporter } from "langfuse-vercel";

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

  sdkConfig.traceExporter = new LangfuseExporter({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_HOST,
  }); // new OTLPTraceExporter(langfuseConfig);
  console.log("OpenTelemetry configured with Langfuse exporter");

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
