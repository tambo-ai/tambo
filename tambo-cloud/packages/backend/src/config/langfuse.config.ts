interface LangfuseConfig {
  enabled: boolean;
  publicKey?: string;
  secretKey?: string;
  baseUrl?: string;
}

export function createLangfuseConfig(): LangfuseConfig {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const baseUrl = process.env.LANGFUSE_HOST || "https://cloud.langfuse.com";

  // Only enable if both keys are provided
  const enabled = !!(publicKey && secretKey);

  return {
    enabled,
    publicKey,
    secretKey,
    baseUrl,
  };
}

export function createLangfuseTelemetryConfig(
  metadata?: Record<string, string>,
) {
  const config = createLangfuseConfig();

  if (!config.enabled) {
    return undefined;
  }

  return {
    isEnabled: true,
    functionId: metadata?.functionId
      ? `${metadata.functionId}-ai-sdk-call`
      : "ai-sdk-call",
    metadata: {
      ...metadata,
      // Include Langfuse configuration in metadata for context
      langfuseEnabled: true,
    },
  };
}
