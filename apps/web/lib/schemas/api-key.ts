import { z } from "zod/v3";

/**
 * Shared schemas for API key operations.
 * Used by both tRPC routers and tool definitions.
 */

// Input schemas
export const getApiKeysInput = z
  .string()
  .describe("The complete project ID (e.g., 'p_u2tgQg5U.43bbdf')");

export const generateApiKeyInput = z.object({
  projectId: z
    .string()
    .describe("The complete project ID (e.g., 'p_u2tgQg5U.43bbdf')"),
  name: z.string().describe("The name of the API key"),
});

export const deleteApiKeyInput = z.object({
  projectId: z
    .string()
    .describe("The complete project ID (e.g., 'p_u2tgQg5U.43bbdf')"),
  apiKeyId: z.string().describe("The API key ID to delete"),
});

// Output schemas
export const apiKeySchema = z.object({
  id: z.string().describe("The unique identifier for the API key"),
  name: z.string().describe("The name of the API key"),
  partiallyHiddenKey: z
    .string()
    .nullable()
    .describe("The partially hidden API key value"),
  lastUsedAt: z.date().nullable().describe("When the key was last used"),
  projectId: z.string().describe("The project ID this key belongs to"),
  hashedKey: z.string().describe("The hashed key value"),
  createdAt: z.date().describe("When the key was created"),
  updatedAt: z.date().describe("When the key was last updated"),
  createdByUserId: z.string().describe("The user ID who created this key"),
});

// For generateApiKey endpoint which returns the actual key
export const generatedApiKeySchema = apiKeySchema.extend({
  apiKey: z.string().describe("The actual API key (only shown once)"),
});
