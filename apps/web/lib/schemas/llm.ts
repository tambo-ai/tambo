import { customLlmParametersSchema } from "@/lib/llm-parameters";
import { agentHeadersSchema } from "@/lib/schemas/project";
import { AgentProviderType, AiProviderType } from "@tambo-ai-cloud/core";
import { z } from "zod/v3";

/**
 * Shared schemas for LLM operations.
 * Used by both tRPC routers and tool definitions.
 */

// Input schemas
export const getProjectLlmSettingsInput = z.object({
  projectId: z
    .string()
    .describe("The complete project ID (e.g., 'p_u2tgQg5U.43bbdf')"),
});

export const updateProjectLlmSettingsInput = z.object({
  projectId: z
    .string()
    .describe("The complete project ID (e.g., 'p_u2tgQg5U.43bbdf')"),
  defaultLlmProviderName: z
    .string()
    .nullable()
    .optional()
    .describe(
      "The LLM provider name (e.g., 'openai', 'anthropic') that will be used as the provider for this project",
    ),
  defaultLlmModelName: z
    .string()
    .nullable()
    .optional()
    .describe("The model name that will be used as the model for this project"),
  customLlmModelName: z
    .string()
    .nullable()
    .optional()
    .describe("Custom model name if using custom provider"),
  customLlmBaseURL: z
    .string()
    .nullable()
    .optional()
    .describe("Custom base URL for LLM API"),
  maxInputTokens: z
    .number()
    .nullable()
    .optional()
    .describe("Maximum input tokens"),
  customLlmParameters: customLlmParametersSchema
    .nullable()
    .optional()
    .describe(
      'Custom LLM parameters. Structure: { "providerName": { "modelName": { "parameterName": parameterValue } } }',
    ),
});

// Output schemas
export const projectLlmSettingsSchema = z.object({
  defaultLlmProviderName: z
    .string()
    .nullable()
    .describe("The LLM provider name (e.g., 'openai', 'anthropic')"),
  defaultLlmModelName: z.string().nullable().describe("The default model name"),
  customLlmModelName: z
    .string()
    .nullable()
    .describe("Custom model name if using custom provider"),
  customLlmBaseURL: z
    .string()
    .nullable()
    .describe("Custom base URL for LLM API"),
  maxInputTokens: z.number().nullable().describe("Maximum input tokens"),
  providerType: z
    .nativeEnum(AiProviderType)
    .nullish()
    .describe("AI provider type (LLM or AGENT)"),
  agentProviderType: z
    .nativeEnum(AgentProviderType)
    .nullish()
    .describe("Agent provider type if using agent mode"),
  agentUrl: z.string().nullable().describe("Agent URL if using agent mode"),
  agentName: z.string().nullable().describe("Agent name if using agent mode"),
  agentHeaders: agentHeadersSchema
    .nullable()
    .describe("Custom headers for agent requests"),
  customLlmParameters: customLlmParametersSchema
    .nullable()
    .describe("Custom LLM parameters"),
});

export const updateProjectLlmSettingsOutputSchema = z.object({
  defaultLlmProviderName: z
    .string()
    .nullable()
    .describe("The LLM provider name (e.g., 'openai', 'anthropic')"),
  defaultLlmModelName: z.string().nullable().describe("The default model name"),
  customLlmModelName: z
    .string()
    .nullable()
    .describe("Custom model name if using custom provider"),
  customLlmBaseURL: z
    .string()
    .nullable()
    .describe("Custom base URL for LLM API"),
  maxInputTokens: z.number().nullable().describe("Maximum input tokens"),
  customLlmParameters: customLlmParametersSchema
    .nullable()
    .describe("Custom LLM parameters"),
});

// For fetchAvailableLlmModels - this returns the LlmProviderConfig from core
export const llmProviderConfigSchema = z
  .record(
    z.string(),
    z.object({
      apiName: z.string().describe("API name for the provider"),
      displayName: z.string().describe("Human-readable display name"),
      docLinkRoot: z.string().optional().describe("Root URL for documentation"),
      apiKeyLink: z
        .string()
        .optional()
        .describe("Link to get API key for this provider"),
      isCustomProvider: z
        .boolean()
        .optional()
        .describe("Whether this is a custom provider"),
      requiresBaseUrl: z
        .boolean()
        .optional()
        .describe("Whether this provider requires a custom base URL"),
      isDefaultProvider: z
        .boolean()
        .optional()
        .describe("Whether this is a default provider"),
      models: z
        .record(
          z.string(),
          z.object({
            displayName: z.string().describe("Human-readable model name"),
            apiName: z.string().describe("API name for the model"),
            inputTokenLimit: z
              .number()
              .optional()
              .describe("Maximum input tokens"),
            outputTokenLimit: z
              .number()
              .optional()
              .describe("Maximum output tokens"),
            status: z
              .enum(["tested", "untested", "deprecated"])
              .optional()
              .describe("Testing status of the model"),
            releaseDate: z.string().optional().describe("Model release date"),
            notes: z
              .string()
              .optional()
              .describe("Additional notes about the model"),
            docLink: z
              .string()
              .optional()
              .describe("Documentation link for this model"),
            modelSpecificParams: z
              .record(z.string(), z.any())
              .optional()
              .describe("Model-specific parameters"),
          }),
        )
        .optional()
        .describe("Available models for this provider"),
      providerSpecificParams: z
        .record(z.string(), z.any())
        .optional()
        .describe("Provider-specific parameters"),
    }),
  )
  .describe("Configuration for all available LLM providers");
