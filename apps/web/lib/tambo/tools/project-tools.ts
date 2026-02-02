import {
  createProjectInput as createProjectInputSchema,
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
    inputSchema: z.object({}),
    outputSchema: z.object({
      projects: z.array(projectTableSchema),
    }),
  });

  /**
   * Registers a tool to fetch a specific project by its ID.
   * @returns Project details including ID, name, user ID, settings, and timestamps
   */
  registerTool({
    name: "fetchProjectById",
    description:
      "Fetches a specific project by its complete ID (e.g., 'p_u2tgQg5U.43bbdf'). Use fetchAllProjects first to get the correct project ID.",
    tool: async ({ projectId }) => {
      return await ctx.trpcClient.project.getProjectById.query(projectId);
    },
    inputSchema: z
      .object({
        projectId: getProjectByIdInput,
      })
      .describe("Arguments for fetching a specific project"),
    outputSchema: projectDetailSchema,
  });

  /**
   * Registers a tool to create a new project.
   * @returns Created project details with ID, name, and user ID
   */
  registerTool({
    name: "createProject",
    description: "create a new project",
    tool: async ({ projectName }) => {
      const result =
        await ctx.trpcClient.project.createProject.mutate(projectName);

      // Invalidate the project cache to refresh the component
      await invalidateProjectCache(ctx);

      return result;
    },
    inputSchema: z.object({
      projectName: createProjectInputSchema,
    }),
    outputSchema: createProjectOutputSchema,
  });

  /**
   * Registers a tool to remove/delete a project.
   * @returns Success status indicating the project was deleted
   */
  registerTool({
    name: "removeProject",
    description: "remove a project",
    tool: async ({ projectId }) => {
      await ctx.trpcClient.project.removeProject.mutate(projectId);

      // Invalidate the project cache to refresh the component
      await invalidateProjectCache(ctx);

      return { success: true };
    },
    inputSchema: z.object({
      projectId: removeProjectInput,
    }),
    outputSchema: z.object({ success: z.boolean() }),
  });

  /**
   * Registers a tool to fetch the total number of projects for the current user.
   * Returns the count of projects associated with the user's account.
   * @returns Object containing the project count
   */
  registerTool({
    name: "fetchProjectCount",
    description: "Fetches the total number of projects for the current user.",
    tool: async () => {
      const projects = await ctx.trpcClient.project.getUserProjects.query();
      return { count: projects.length };
    },
    inputSchema: z.object({}),
    outputSchema: z.object({
      count: z.number(),
    }),
  });
}
