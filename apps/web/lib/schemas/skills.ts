import {
  SKILL_NAME_MAX_LENGTH,
  SKILL_NAME_PATTERN,
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_INSTRUCTIONS_MAX_LENGTH,
} from "@tambo-ai-cloud/core";
import { z } from "zod/v3";

/**
 * Shared schemas for skill operations.
 * Used by both tRPC routers and tool definitions.
 */

// Input schemas
export const listSkillsInput = z.object({
  projectId: z.string().describe("The project ID to list skills for"),
});

export const createSkillInput = z.object({
  projectId: z.string().describe("The project ID to create the skill in"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(SKILL_NAME_MAX_LENGTH)
    .regex(
      SKILL_NAME_PATTERN,
      "Name must be kebab-case (e.g. scheduling-assistant)",
    )
    .describe("The skill name in kebab-case (e.g. scheduling-assistant)"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(SKILL_DESCRIPTION_MAX_LENGTH)
    .describe("A short description of what the skill does"),
  instructions: z
    .string()
    .max(SKILL_INSTRUCTIONS_MAX_LENGTH)
    .describe("The full instructions for the skill"),
});

export const updateSkillInput = z.object({
  projectId: z.string().describe("The project ID containing the skill"),
  skillId: z.string().describe("The skill ID to update"),
  name: z
    .string()
    .min(1)
    .max(SKILL_NAME_MAX_LENGTH)
    .regex(
      SKILL_NAME_PATTERN,
      "Name must be kebab-case (e.g. scheduling-assistant)",
    )
    .optional()
    .describe("New name for the skill (kebab-case)"),
  description: z
    .string()
    .min(1)
    .max(SKILL_DESCRIPTION_MAX_LENGTH)
    .optional()
    .describe("New description for the skill"),
  instructions: z
    .string()
    .max(SKILL_INSTRUCTIONS_MAX_LENGTH)
    .optional()
    .describe("New instructions for the skill"),
  enabled: z.boolean().optional().describe("Whether the skill is enabled"),
});

export const deleteSkillInput = z.object({
  projectId: z.string().describe("The project ID containing the skill"),
  skillId: z.string().describe("The skill ID to delete"),
});

// Output schemas
export const skillSchema = z.object({
  id: z.string().describe("The unique skill identifier"),
  projectId: z.string().describe("The project this skill belongs to"),
  name: z.string().describe("The skill name"),
  description: z.string().describe("The skill description"),
  instructions: z.string().describe("The skill instructions"),
  enabled: z.boolean().describe("Whether the skill is enabled"),
  usageCount: z.number().describe("How many times the skill has been used"),
  lastUsedAt: z.date().nullable().describe("When the skill was last used"),
  createdAt: z.date().describe("When the skill was created"),
  updatedAt: z.date().describe("When the skill was last updated"),
});
