import type { JSONValue } from "./llm-parameter-types";

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
export type LlmParameterUIType =
  | "number"
  | "string"
  | "boolean"
  | "array"
  | "object";

/** the schema for a parameter, suitable for deciding how to display it in the UI */
export interface LlmParameterSchema {
  description: string;
  uiType: LlmParameterUIType;
  example?: JSONValue;
}

/** A mapping of parameter names to their schema */
export type LlmParameterMetadata<K extends string = string> = Record<
  K,
  LlmParameterSchema
>;

export const PARAMETER_METADATA: LlmParameterMetadata<
  keyof CommonParametersDefaults
> = {
  temperature: {
    description: "Controls randomness in output",
    uiType: "number",
    example: 0.5,
  },
  maxOutputTokens: {
    description: "Maximum tokens to generate",
    uiType: "number",
    example: 1000,
  },
  maxRetries: {
    description: "Maximum number of retries",
    uiType: "number",
    example: 3,
  },
  topP: {
    description: "Nucleus sampling threshold",
    uiType: "number",
    example: 0.5,
  },
  topK: { description: "Top K sampling", uiType: "number", example: 50 },
  presencePenalty: {
    description: "Penalty for new topics",
    uiType: "number",
    example: 0.1,
  },
  frequencyPenalty: {
    description: "Penalty for repetition",
    uiType: "number",
    example: 0.1,
  },
  stopSequences: {
    description: "Sequences where generation stops",
    uiType: "array",
    example: ["\n"],
  },
  seed: {
    description: "Deterministic sampling seed",
    uiType: "number",
    example: 42,
  },
  headers: {
    description: "Custom headers for requests",
    uiType: "object",
    example: { Authorization: "Bearer <your-api-key>" },
  },
};

export interface LlmModelConfigInfo<ModelId extends string = string> {
  /** The actual name used in API calls, e.g., "gpt-4o-mini" */
  apiName: ModelId;
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
  /** Any parameters that are specific to just this model, such as reasoning or modality */
  modelSpecificParams?: LlmParameterMetadata;
  /** Whether the model is the default model */
  isDefaultModel?: boolean;
  /** Input token limit of the model */
  inputTokenLimit?: number;
}

export type LlmModelConfig<ModelId extends string = string> = {
  [K in ModelId]: LlmModelConfigInfo<K>;
};

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
