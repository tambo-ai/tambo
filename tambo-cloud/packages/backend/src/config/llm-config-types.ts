export interface LlmModelCapabilities {
  inputTokenLimit: number;
  supportsTools?: boolean;
  supportsJsonMode?: boolean;
  temperature?: number;
  // We can add other specific capabilities here
}

export interface LlmModelConfigInfo {
  /** The actual name used in API calls, e.g., "gpt-4o-mini" */
  apiName: string;
  /** User-friendly name, e.g., "GPT-4o Mini" */
  displayName: string;
  /** The status of the model integration */
  status: "tested" | "untested" | "known-issues";
  /** For known issues, specific behaviors, etc. */
  notes?: string;
  /** Link to external documentation about the model or its issues */
  docLink?: string;
  /** Link to Tambo's documentation about the model or its issues */
  tamboDocLink?: string;
  /** Additional capabilities of the model */
  properties: LlmModelCapabilities;
  /** Whether the model is the default model */
  isDefaultModel?: boolean;
}

export type LlmModelConfig = Record<string, LlmModelConfigInfo>;

export interface LlmProviderConfigInfo {
  /** e.g., "openai", "anthropic" - must match Provider type and providerKeys.providerName */
  apiName: string;
  /** User-friendly name, e.g., "OpenAI" */
  displayName: string;
  /** Root URL for the provider's documentation */
  docLinkRoot?: string;
  /** Link to where users can get their API key */
  apiKeyLink?: string;
  /** Keyed by model apiName for easy lookup */
  models?: LlmModelConfig;
  /** Whether the provider is custom */
  isCustomProvider?: boolean;
  /** Whether the provider requires a base URL */
  requiresBaseUrl?: boolean;
  /** Whether the provider is the default provider */
  isDefaultProvider?: boolean;
}

export type LlmProviderConfig = Record<string, LlmProviderConfigInfo>;
