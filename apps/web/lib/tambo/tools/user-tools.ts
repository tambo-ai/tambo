import { z } from "zod/v3";
import type { RegisterToolFn, ToolContext } from "./types";

/**
 * Input schema for the `fetchCurrentUser` function.
 * No arguments required.
 */
export const fetchCurrentUserInputSchema = z.object({});

/**
 * Output schema for the `fetchCurrentUser` function.
 * Returns user details (id, email, createdAt, imageUrl).
 */
export const fetchCurrentUserOutputSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  createdAt: z.string(),
  imageUrl: z.string().optional(),
});

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
    inputSchema: fetchCurrentUserInputSchema,
    outputSchema: fetchCurrentUserOutputSchema,
  });
}
