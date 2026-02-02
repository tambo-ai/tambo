import { agentHeadersSchema } from "@/lib/schemas/project";
import { AgentProviderType, AiProviderType } from "@tambo-ai-cloud/core";
import { z } from "zod/v3";

/**
 * Shared schemas for agent settings operations.
 * Used by both tRPC routers and tool definitions.
 */

// Tool-compatible agent headers schema using array of key-value objects
// Records (objects with dynamic keys) are not supported in tool schemas
const agentHeadersToolSchema = z
  .array(
    z.object({
      name: z.string().describe("Header name (e.g., 'Authorization')"),
      value: z.string().describe("Header value (e.g., 'Bearer token')"),
    }),
  )
  // REFINE BLOCK TO PREVENT DUPLICATES
  .refine(
    (items) => {
      const keys = items.map((i) => i.name);
      return new Set(keys).size === keys.length;
    },
    {
      message: "Duplicate header names are not allowed",
    },
  );

export type AgentHeadersToolInput = z.infer<typeof agentHeadersToolSchema>;

// Input schema for tRPC router (uses proper validation)
export const updateProjectAgentSettingsInput = z.object({
  projectId: z
    .string()
    .describe("The complete project ID (e.g., 'p_u2tgQg5U.43bbdf')"),
  providerType: z
    .nativeEnum(AiProviderType)
    .describe("The provider type (LLM or AGENT)"),
  agentProviderType: z
    .nativeEnum(AgentProviderType)
    .nullable()
    .optional()
    .describe("The agent provider type if using agent mode"),
  agentUrl: z
    .string()
    .url()
    .nullable()
    .optional()
    .describe("The agent URL if using agent mode"),
  agentName: z
    .string()
    .nullable()
    .optional()
    .describe("The agent name if using agent mode"),
  agentHeaders: agentHeadersSchema
    .nullable()
    .optional()
    .describe("Custom headers for agent requests"),
});

// Input schema for tools (uses array format for headers since records are not supported)
export const updateProjectAgentSettingsToolInput = z.object({
  projectId: z
    .string()
    .describe("The complete project ID (e.g., 'p_u2tgQg5U.43bbdf')"),
  providerType: z
    .nativeEnum(AiProviderType)
    .describe("The provider type (LLM or AGENT)"),
  agentProviderType: z
    .nativeEnum(AgentProviderType)
    .nullable()
    .optional()
    .describe("The agent provider type if using agent mode"),
  agentUrl: z
    .string()
    .url()
    .nullable()
    .optional()
    .describe("The agent URL if using agent mode"),
  agentName: z
    .string()
    .nullable()
    .optional()
    .describe("The agent name if using agent mode"),
  agentHeaders: agentHeadersToolSchema
    .nullable()
    .optional()
    .describe("Custom headers for agent requests"),
});

// Output schemas
export const updateProjectAgentSettingsOutputSchema = z.object({
  providerType: z
    .nativeEnum(AiProviderType)
    .describe("The provider type (LLM or AGENT)"),
  agentProviderType: z
    .nativeEnum(AgentProviderType)
    .nullable()
    .describe("The agent provider type"),
  agentUrl: z.string().nullable().describe("The agent URL"),
  agentName: z.string().nullable().describe("The agent name"),
  agentHeaders: agentHeadersSchema
    .nullable()
    .describe("Custom headers for agent requests"),
});
