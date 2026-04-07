import {
  createSkillInput,
  deleteSkillInput,
  listSkillsInput,
  skillSchema,
  updateSkillInput,
} from "@/lib/schemas/skills";
import { z } from "zod/v3";
import { invalidateSkillsCache } from "./helpers";
import type { RegisterToolFn, ToolContext } from "./types";

/**
 * Input schema for the `fetchProjectSkills` tool.
 */
export const fetchProjectSkillsInputSchema = listSkillsInput;

/**
 * Output schema for the `fetchProjectSkills` tool.
 */
export const fetchProjectSkillsOutputSchema = z.array(skillSchema);

/**
 * Input schema for the `createSkill` tool.
 */
export const createSkillInputSchema = createSkillInput;

/**
 * Output schema for the `createSkill` tool.
 */
export const createSkillOutputSchema = skillSchema;

/**
 * Input schema for the `updateSkill` tool.
 */
export const updateSkillInputSchema = updateSkillInput;

/**
 * Output schema for the `updateSkill` tool.
 */
export const updateSkillOutputSchema = skillSchema.nullable();

/**
 * Input schema for the `deleteSkill` tool.
 */
export const deleteSkillInputSchema = deleteSkillInput;

/**
 * Output schema for the `deleteSkill` tool.
 */
export const deleteSkillOutputSchema = z.void();

/**
 * Register skill management tools
 */
export function registerSkillTools(
  registerTool: RegisterToolFn,
  ctx: ToolContext,
) {
  /**
   * Registers a tool to fetch all skills for a project.
   * @returns Array of skills for the project
   */
  registerTool({
    name: "fetchProjectSkills",
    description:
      "Fetches all skills for a project. Returns an array of skills with their IDs, names, descriptions, enabled status, and usage counts.",
    tool: async (params) => {
      return await ctx.trpcClient.skills.list.query(params);
    },
    inputSchema: fetchProjectSkillsInputSchema,
    outputSchema: fetchProjectSkillsOutputSchema,
  });

  /**
   * Registers a tool to create a new skill for a project.
   * @returns The created skill
   */
  registerTool({
    name: "createSkill",
    description:
      "Creates a new skill for a project. The name must be kebab-case (e.g. scheduling-assistant). Returns the created skill.",
    tool: async (params) => {
      const result = await ctx.trpcClient.skills.create.mutate(params);
      await invalidateSkillsCache(ctx, params.projectId);
      return result;
    },
    inputSchema: createSkillInputSchema,
    outputSchema: createSkillOutputSchema,
  });

  /**
   * Registers a tool to update an existing skill.
   * @returns The updated skill
   */
  registerTool({
    name: "updateSkill",
    description:
      "Updates an existing skill for a project. Can update name, description, instructions, or enabled status. Returns the updated skill.",
    tool: async (params) => {
      const result = await ctx.trpcClient.skills.update.mutate(params);
      await invalidateSkillsCache(ctx, params.projectId);
      return result;
    },
    inputSchema: updateSkillInputSchema,
    outputSchema: updateSkillOutputSchema,
  });

  /**
   * Registers a tool to delete a skill.
   * IMPORTANT: Always call fetchProjectSkills first to get the correct skill ID.
   * @returns void
   */
  registerTool({
    name: "deleteSkill",
    description:
      "Deletes a skill from a project. MUST call fetchProjectSkills first to get the correct skill ID - never guess the ID.",
    tool: async (params) => {
      await ctx.trpcClient.skills.delete.mutate(params);
      await invalidateSkillsCache(ctx, params.projectId);
    },
    inputSchema: deleteSkillInputSchema,
    outputSchema: deleteSkillOutputSchema,
  });
}
