import { JSONValue } from "@tambo-ai-cloud/core";

// These are the common parameters that are supported by AI SDK streamtext
export interface CommonParametersDefaults {
  temperature?: number;
  maxOutputTokens?: number;
  maxRetries?: number;
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
  seed?: number;
  headers?: Record<string, string>;
  // We can add other specific capabilities here
}

export const PARAMETER_METADATA: Record<
  keyof CommonParametersDefaults,
  {
    description: string;
    uiType: string;
  }
> = {
  temperature: {
    description: "Controls randomness in output",
    uiType: "number",
  },
  maxOutputTokens: {
    description: "Maximum tokens to generate",
    uiType: "number",
  },
  maxRetries: { description: "Maximum number of retries", uiType: "number" },
  topP: { description: "Nucleus sampling threshold", uiType: "number" },
  topK: { description: "Top K sampling", uiType: "number" },
  presencePenalty: { description: "Penalty for new topics", uiType: "number" },
  frequencyPenalty: { description: "Penalty for repetition", uiType: "number" },
  stopSequences: {
    description: "Sequences where generation stops",
    uiType: "array",
  },
  seed: { description: "Deterministic sampling seed", uiType: "number" },
  headers: { description: "Custom headers for requests", uiType: "object" },
};

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
  commonParametersDefaults?: CommonParametersDefaults;
  /** Whether the model is the default model */
  isDefaultModel?: boolean;
  /** Input token limit of the model */
  inputTokenLimit?: number;
}

export type LlmModelConfig = Record<string, LlmModelConfigInfo>;

/** Provider-specific parameters defaults that will be passed to the AI SDK via providerOptions */
export interface ProviderSpecificParams {
  [key: string]: JSONValue;
}

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
  /** Provider-specific parameters defaults */
  providerSpecificParams?: ProviderSpecificParams;
}

export type LlmProviderConfig = Record<string, LlmProviderConfigInfo>;
