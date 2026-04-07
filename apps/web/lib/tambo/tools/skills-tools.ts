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
    inputSchema: listSkillsInput,
    outputSchema: z.array(skillSchema),
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
    inputSchema: createSkillInput,
    outputSchema: skillSchema,
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
    inputSchema: updateSkillInput,
    outputSchema: skillSchema.nullable(),
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
    inputSchema: deleteSkillInput,
    outputSchema: z.void(),
  });
}
