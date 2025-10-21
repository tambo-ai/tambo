import { z } from "zod";
import type { RegisterToolFn, ToolContext } from "./types";

/**
 * Zod schema for the `fetchCurrentUser` function.
 * Defines no arguments and a return type as an object containing user details (id, email, createdAt, imageUrl).
 */
export const fetchCurrentUserSchema = z
  .function()
  .args()
  .returns(
    z.object({
      id: z.string(),
      email: z.string().optional(),
      createdAt: z.string(),
      imageUrl: z.string().optional(),
    }),
  );

/**
 * Register user management tools
 */
export function registerUserTools(
  registerTool: RegisterToolFn,
  ctx: ToolContext,
) {
  /**
   * Registers a tool to fetch the current user information.
   * Returns user details including ID, email, creation date, and image URL.
   * If the user is not logged in, provides a link to the login page.
   */
  registerTool({
    name: "fetchCurrentUser",
    description:
      "Fetches the current user. If the user is not logged in, return a link that leads to the login page at /login",
    tool: async () => {
      return await ctx.trpcClient.user.getUser.query();
    },
    toolSchema: fetchCurrentUserSchema,
  });
}
