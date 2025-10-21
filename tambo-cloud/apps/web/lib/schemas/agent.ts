import { agentHeadersSchema } from "@/lib/schemas/project";
import { AgentProviderType, AiProviderType } from "@tambo-ai-cloud/core";
import { z } from "zod";

/**
 * Shared schemas for agent settings operations.
 * Used by both tRPC routers and tool definitions.
 */

// Input schemas
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
  agentHeaders: z
    .record(z.string(), z.string())
    .nullable()
    .describe("Custom headers for agent requests"),
});
