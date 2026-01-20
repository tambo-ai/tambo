import {
  createProjectInput,
  createProjectOutputSchema,
  getProjectByIdInput,
  projectDetailSchema,
  projectTableSchema,
  removeProjectInput,
} from "@/lib/schemas/project";
import { z } from "zod/v3";
import { invalidateProjectCache } from "./helpers";
import type { RegisterToolFn, ToolContext } from "./types";

/**
 * Input schema for the `fetchAllProjects` function.
 * No arguments required.
 */
export const fetchAllProjectsInputSchema = z.object({});

/**
 * Output schema for the `fetchAllProjects` function.
 * Returns an object with a `projects` property containing an array of project details.
 */
export const fetchAllProjectsOutputSchema = z.object({
  projects: z.array(projectTableSchema),
});

/**
 * Input schema for the `fetchProjectById` function.
 * Requires a project ID string.
 */
export const fetchProjectByIdInputSchema = z
  .object({
    projectId: getProjectByIdInput,
  })
  .describe("Arguments for fetching a specific project");

/**
 * Output schema for the `fetchProjectById` function.
 * Returns detailed project information.
 */
export const fetchProjectByIdOutputSchema = projectDetailSchema;

/**
 * Input schema for the `createProject` function.
 * Requires the project name.
 */
export const createProjectInputSchema = z.object({
  projectName: createProjectInput,
});

/**
 * Output schema for the `createProject` function.
 * Returns the newly created project (id, name, userId).
 */
export const createProjectOutputSchema_ = createProjectOutputSchema;

/**
 * Input schema for the `removeProject` function.
 * Requires the project ID.
 */
export const removeProjectInputSchema = z.object({
  projectId: removeProjectInput,
});

/**
 * Output schema for the `removeProject` function.
 * Returns an object indicating success.
 */
export const removeProjectOutputSchema = z.object({ success: z.boolean() });

/**
 * Input schema for the `fetchProjectCount` function.
 * No arguments required.
 */
export const fetchProjectCountInputSchema = z.object({});

/**
 * Output schema for the `fetchProjectCount` function.
 * Returns the count of projects for the current user.
 */
export const fetchProjectCountOutputSchema = z.object({
  count: z.number(),
});

/**
 * Register project management tools
 */
export function registerProjectTools(
  registerTool: RegisterToolFn,
  ctx: ToolContext,
) {
  /**
   * Registers a tool to fetch all projects for the current user.
   * Returns an object containing an array of project objects with detailed information.
   */
  registerTool({
    name: "fetchAllProjects",
    description: "Fetches all projects for the current user.",
    tool: async () => {
      const projects = await ctx.trpcClient.project.getUserProjects.query();
      return { projects };
    },
    inputSchema: fetchAllProjectsInputSchema,
    outputSchema: fetchAllProjectsOutputSchema,
  });

  /**
   * Registers a tool to fetch a specific project by its ID.
   * @param {Object} params - Parameters object
   * @param {string} params.projectId - The complete project ID (e.g., 'p_u2tgQg5U.43bbdf')
   * @returns {Object} Project details including ID, name, user ID, settings, and timestamps
   */
  registerTool({
    name: "fetchProjectById",
    description:
      "Fetches a specific project by its complete ID (e.g., 'p_u2tgQg5U.43bbdf'). Use fetchAllProjects first to get the correct project ID.",
    tool: async (params: { projectId: string }) => {
      return await ctx.trpcClient.project.getProjectById.query(
        params.projectId,
      );
    },
    inputSchema: fetchProjectByIdInputSchema,
    outputSchema: fetchProjectByIdOutputSchema,
  });

  /**
   * Registers a tool to create a new project.
   * @param {Object} params - Parameters object
   * @param {string} params.projectName - The name for the new project
   * @returns {Object} Created project details with ID, name, and user ID
   */
  registerTool({
    name: "createProject",
    description: "create a new project",
    tool: async (params: { projectName: string }) => {
      const result = await ctx.trpcClient.project.createProject.mutate(
        params.projectName,
      );

      // Invalidate the project cache to refresh the component
      await invalidateProjectCache(ctx);

      return result;
    },
    inputSchema: createProjectInputSchema,
    outputSchema: createProjectOutputSchema_,
  });

  /**
   * Registers a tool to remove/delete a project.
   * @param {Object} params - Parameters object
   * @param {string} params.projectId - The ID of the project to remove
   * @returns {Object} Success status indicating the project was deleted
   */
  registerTool({
    name: "removeProject",
    description: "remove a project",
    tool: async (params: { projectId: string }) => {
      await ctx.trpcClient.project.removeProject.mutate(params.projectId);

      // Invalidate the project cache to refresh the component
      await invalidateProjectCache(ctx);

      return { success: true };
    },
    inputSchema: removeProjectInputSchema,
    outputSchema: removeProjectOutputSchema,
  });

  /**
   * Registers a tool to fetch the total number of projects for the current user.
   * Returns the count of projects associated with the user's account.
   * @returns {Object} Object containing the project count
   */
  registerTool({
    name: "fetchProjectCount",
    description: "Fetches the total number of projects for the current user.",
    tool: async () => {
      const projects = await ctx.trpcClient.project.getUserProjects.query();
      return { count: projects.length };
    },
    inputSchema: fetchProjectCountInputSchema,
    outputSchema: fetchProjectCountOutputSchema,
  });
}
