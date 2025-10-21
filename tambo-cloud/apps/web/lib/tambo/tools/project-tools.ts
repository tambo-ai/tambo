import {
  createProjectInput,
  createProjectOutputSchema,
  getProjectByIdInput,
  projectDetailSchema,
  projectTableSchema,
  removeProjectInput,
  updateProjectOutputSchema,
} from "@/lib/schemas/project";
import { z } from "zod";
import { invalidateProjectCache } from "./helpers";
import type { RegisterToolFn, ToolContext } from "./types";

/**
 * Zod schema for the `fetchAllProjects` function.
 * Defines no arguments and the return type as an object with a `projects` property, which is an array of project details.
 */
export const fetchAllProjectsSchema = z
  .function()
  .args()
  .returns(z.object({ projects: z.array(projectTableSchema) }));

/**
 * Zod schema for the `fetchProjectById` function.
 * Defines the argument as a project ID string and the return type as an object containing detailed project information.
 */
export const fetchProjectByIdSchema = z
  .function()
  .args(
    z
      .object({
        projectId: getProjectByIdInput,
      })
      .describe("Arguments for fetching a specific project"),
  )
  .returns(projectDetailSchema);

/**
 * Zod schema for the `updateProject` function.
 * Defines the argument as an object containing core project update parameters.
 * Use dedicated tools for LLM settings (updateProjectLlmSettings), agent settings (updateProjectAgentSettings),
 * and OAuth settings (updateOAuthValidationSettings).
 */
export const updateProjectSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The ID of the project to update"),
      name: z.string().optional().describe("The new name of the project"),
      customInstructions: z
        .string()
        .optional()
        .describe("The new custom instructions for the project"),
      allowSystemPromptOverride: z
        .boolean()
        .optional()
        .describe("Whether to allow system prompt override"),
      maxToolCallLimit: z
        .number()
        .optional()
        .describe("The new maximum number of tool calls allowed per response"),
      isTokenRequired: z
        .boolean()
        .optional()
        .describe(
          "Whether authentication tokens are required for this project",
        ),
    }),
  )
  .returns(
    updateProjectOutputSchema.pick({
      id: true,
      name: true,
      userId: true,
      customInstructions: true,
      allowSystemPromptOverride: true,
      maxToolCallLimit: true,
    }),
  );

/**
 * Zod schema for the `createProject` function.
 * Defines the argument as the project name string and the return type as an object representing the newly created project (id, name, userId).
 */
export const createProjectSchema = z
  .function()
  .args(createProjectInput)
  .returns(createProjectOutputSchema);

/**
 * Zod schema for the `removeProject` function.
 * Defines the argument as the project ID string and the return type as an object indicating success (e.g., `{ success: true }`).
 */
export const removeProjectSchema = z
  .function()
  .args(removeProjectInput)
  .returns(z.object({ success: z.boolean() }));

/**
 * Zod schema for the `fetchProjectCount` function.
 * Defines no arguments and returns the count of projects for the current user.
 */
export const fetchProjectCountSchema = z
  .function()
  .args()
  .returns(
    z.object({
      count: z.number(),
    }),
  );

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
    toolSchema: fetchAllProjectsSchema,
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
    toolSchema: fetchProjectByIdSchema,
  });

  /**
   * Registers a tool to update core project settings.
   * For LLM settings, use updateProjectLlmSettings.
   * For agent settings, use updateProjectAgentSettings.
   * For OAuth settings, use updateOAuthValidationSettings.
   * @param {Object} params - Project update parameters
   * @param {string} params.projectId - The ID of the project to update
   * @param {string} params.name - The new name for the project
   * @param {string} params.customInstructions - Custom AI instructions for the project
   * @param {boolean} params.allowSystemPromptOverride - Whether to allow system prompt override
   * @param {number} params.maxToolCallLimit - Maximum tool calls allowed per response
   * @param {boolean} params.isTokenRequired - Whether authentication tokens are required
   * @returns {Object} Updated project details
   */
  registerTool({
    name: "updateProject",
    description:
      "Updates core project settings like name, custom instructions, system prompt override, and tool call limits. For LLM settings use updateProjectLlmSettings, for agent settings use updateProjectAgentSettings, for OAuth settings use updateOAuthValidationSettings.",
    tool: async (params: {
      projectId: string;
      name?: string;
      customInstructions?: string;
      allowSystemPromptOverride?: boolean;
      maxToolCallLimit?: number;
      isTokenRequired?: boolean;
    }) => {
      const result = await ctx.trpcClient.project.updateProject.mutate(params);

      // Invalidate the project cache to refresh the component
      await invalidateProjectCache(ctx);

      return result;
    },
    toolSchema: updateProjectSchema,
  });

  /**
   * Registers a tool to create a new project.
   * @param {string} projectName - The name for the new project
   * @returns {Object} Created project details with ID, name, and user ID
   */
  registerTool({
    name: "createProject",
    description: "create a new project",
    tool: async (projectName: string) => {
      const result =
        await ctx.trpcClient.project.createProject.mutate(projectName);

      // Invalidate the project cache to refresh the component
      await invalidateProjectCache(ctx);

      return result;
    },
    toolSchema: createProjectSchema,
  });

  /**
   * Registers a tool to remove/delete a project.
   * @param {string} projectId - The ID of the project to remove
   * @returns {Object} Success status indicating the project was deleted
   */
  registerTool({
    name: "removeProject",
    description: "remove a project",
    tool: async (projectId: string) => {
      await ctx.trpcClient.project.removeProject.mutate(projectId);

      // Invalidate the project cache to refresh the component
      await invalidateProjectCache(ctx);

      return { success: true };
    },
    toolSchema: removeProjectSchema,
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
    toolSchema: fetchProjectCountSchema,
  });
}
