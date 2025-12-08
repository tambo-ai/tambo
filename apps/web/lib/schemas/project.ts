import { customLlmParametersSchema } from "@/lib/llm-parameters";
import { AgentProviderType, AiProviderType } from "@tambo-ai-cloud/core";
import { z } from "zod/v3";

/**
 * Shared schemas for project operations.
 * Used by both tRPC routers and tool definitions.
 */

// Agent header constraints (no regex; count and length limits only)
const MAX_AGENT_HEADER_COUNT = 20;
const MAX_AGENT_HEADER_NAME_LENGTH = 100;
const MAX_AGENT_HEADER_VALUE_LENGTH = 2000;

export const agentHeadersSchema = z
  .record(
    z.string().min(1).max(MAX_AGENT_HEADER_NAME_LENGTH),
    z.string().min(1).max(MAX_AGENT_HEADER_VALUE_LENGTH),
  )
  .refine((obj) => Object.keys(obj).length <= MAX_AGENT_HEADER_COUNT, {
    message: `Too many headers (max ${MAX_AGENT_HEADER_COUNT})`,
  });

// Input schemas
export const getUserProjectsInput = z
  .object({
    sort: z
      .enum(["thread_updated", "created", "updated"])
      .optional()
      .describe("Sort order for projects"),
  })
  .optional();

export const getProjectByIdInput = z
  .string()
  .describe("The complete project ID (e.g., 'p_u2tgQg5U.43bbdf')");

export const createProjectInput = z
  .string()
  .describe("The name of the project to create");

export const updateProjectInput = z.object({
  projectId: z.string().describe("The ID of the project to update"),
  name: z.string().optional().describe("The new name of the project"),
  customInstructions: z
    .string()
    .nullable()
    .optional()
    .describe("The new custom instructions for the project"),
  allowSystemPromptOverride: z
    .boolean()
    .optional()
    .describe("Whether to allow system prompt override"),
  defaultLlmProviderName: z
    .string()
    .nullable()
    .optional()
    .describe("Default LLM provider name"),
  defaultLlmModelName: z
    .string()
    .nullable()
    .optional()
    .describe("Default LLM model name"),
  customLlmModelName: z
    .string()
    .nullable()
    .optional()
    .describe("Custom LLM model name"),
  customLlmBaseURL: z
    .string()
    .nullable()
    .optional()
    .describe("Custom LLM base URL"),
  maxInputTokens: z
    .number()
    .nullable()
    .optional()
    .describe("Maximum input tokens"),
  maxToolCallLimit: z
    .number()
    .optional()
    .describe("Maximum number of tool calls allowed per response"),
  isTokenRequired: z
    .boolean()
    .optional()
    .describe("Whether authentication tokens are required for this project"),
  providerType: z
    .nativeEnum(AiProviderType)
    .optional()
    .describe("AI provider type"),
  agentProviderType: z
    .nativeEnum(AgentProviderType)
    .optional()
    .describe("Agent provider type"),
  agentUrl: z.string().url().nullable().optional().describe("Agent URL"),
  agentName: z.string().nullable().optional().describe("Agent name"),
  customLlmParameters: customLlmParametersSchema
    .nullable()
    .optional()
    .describe("Custom LLM parameters"),
  agentHeaders: agentHeadersSchema
    .nullable()
    .optional()
    .describe("Agent headers"),
});

export const removeProjectInput = z
  .string()
  .describe("The ID of the project to remove");

export const getTotalMessageUsageInput = z.object({
  period: z
    .string()
    .optional()
    .default("all time")
    .describe("Time period filter: 'all time', 'per month', or 'per week'"),
});

export const getTotalUsersInput = z.object({
  period: z
    .string()
    .optional()
    .default("all time")
    .describe("Time period filter: 'all time', 'per month', or 'per week'"),
});

// Output schemas
export const projectSchema = z.object({
  id: z.string().describe("The unique identifier for the project"),
  name: z.string().describe("The human-readable name of the project"),
  userId: z.string().describe("The user ID who owns the project"),
  createdAt: z.date().describe("The date and time the project was created"),
  updatedAt: z
    .date()
    .nullable()
    .describe("The date and time the project was last updated"),
  customInstructions: z
    .string()
    .nullable()
    .describe("Custom instructions for the project"),
  allowSystemPromptOverride: z
    .boolean()
    .describe("Whether system prompt override is allowed"),
  defaultLlmProviderName: z
    .string()
    .nullable()
    .describe("Default LLM provider name"),
  defaultLlmModelName: z.string().nullable().describe("Default LLM model name"),
  customLlmModelName: z.string().nullable().describe("Custom LLM model name"),
  customLlmBaseURL: z.string().nullable().describe("Custom LLM base URL"),
  maxToolCallLimit: z.number().describe("Maximum number of tool calls allowed"),
  isTokenRequired: z
    .boolean()
    .describe("Whether authentication tokens are required"),
  providerType: z
    .nativeEnum(AiProviderType)
    .nullish()
    .describe("AI provider type"),
  agentProviderType: z
    .nativeEnum(AgentProviderType)
    .nullish()
    .describe("Agent provider type"),
  agentUrl: z.string().nullable().describe("Agent URL"),
  agentName: z.string().nullable().describe("Agent name"),
  customLlmParameters: z
    .record(z.string(), z.record(z.string(), z.record(z.string(), z.any())))
    .nullable()
    .describe("Custom LLM parameters"),
  messages: z.number().describe("The number of messages in the project"),
  users: z.number().describe("The number of users in the project"),
  lastMessageAt: z
    .date()
    .nullable()
    .describe("Timestamp of the most recently updated thread in the project"),
});

export const projectDetailSchema = projectSchema.extend({
  maxInputTokens: z.number().nullable().describe("Maximum input tokens"),
});

export const createProjectOutputSchema = z.object({
  id: z.string().describe("The unique identifier for the project"),
  name: z.string().describe("The name of the project"),
  userId: z.string().describe("The user ID who owns the project"),
});

export const updateProjectOutputSchema = z.object({
  id: z.string().describe("The unique identifier for the project"),
  name: z.string().describe("The name of the project"),
  userId: z.string().describe("The user ID who owns the project"),
  customInstructions: z
    .string()
    .nullable()
    .describe("Custom instructions for the project"),
  allowSystemPromptOverride: z
    .boolean()
    .describe("Whether system prompt override is allowed"),
  defaultLlmProviderName: z
    .string()
    .nullable()
    .describe("Default LLM provider name"),
  defaultLlmModelName: z.string().nullable().describe("Default LLM model name"),
  customLlmModelName: z.string().nullable().describe("Custom LLM model name"),
  customLlmBaseURL: z.string().nullable().describe("Custom LLM base URL"),
  maxInputTokens: z.number().nullable().describe("Maximum input tokens"),
  maxToolCallLimit: z.number().describe("Maximum number of tool calls allowed"),
  providerType: z
    .nativeEnum(AiProviderType)
    .nullish()
    .describe("AI provider type"),
  agentProviderType: z
    .nativeEnum(AgentProviderType)
    .nullish()
    .describe("Agent provider type"),
  agentUrl: z.string().nullable().describe("Agent URL"),
  agentName: z.string().nullable().describe("Agent name"),
  customLlmParameters: z
    .record(z.string(), z.record(z.string(), z.record(z.string(), z.any())))
    .nullable()
    .describe("Custom LLM parameters"),
  agentHeaders: agentHeadersSchema
    .nullable()
    .optional()
    .describe("Agent headers"),
});

export const totalMessageUsageSchema = z.object({
  totalMessages: z.number().describe("Total number of messages"),
});

export const totalUsersSchema = z.object({
  totalUsers: z.number().describe("Total number of users"),
});

// For ProjectTable component compatibility
export const projectTableSchema = z.object({
  id: z.string().describe("The unique identifier for the project"),
  name: z.string().describe("The human-readable name of the project"),
  messages: z.number().describe("The number of messages in the project"),
  users: z.number().describe("The number of users in the project"),
  createdAt: z
    .string()
    .datetime()
    .describe("The date and time the project was created"),
  lastMessageAt: z
    .string()
    .datetime()
    .nullable()
    .describe("Timestamp of the most recently updated thread in the project"),
  isTokenRequired: z
    .boolean()
    .describe("Whether authentication tokens are required for this project"),
});
