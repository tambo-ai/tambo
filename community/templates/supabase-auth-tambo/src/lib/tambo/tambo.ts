import { UserProfileCard } from "@/components/tambo/user-profile-card";
import { getUserProfileById, updateUserNoteById } from "@/server/actions";
import type { TamboComponent } from "@tambo-ai/react";
import { z } from "zod";

/**
 * Create Tambo tools bound to a specific user.
 *
 * Tools must be created fresh with the authenticated user's ID because
 * server actions called through Tambo don't have access to cookies for auth.
 * This approach ensures each tool invocation is scoped to the correct user
 * and can safely operate on their data via RLS-protected database operations.
 *
 * @param userId - The authenticated user's ID
 * @param userEmail - The user's email address
 * @param userName - Optional display name (falls back to email prefix)
 * @returns Array of tools bound to the specified user
 */
export function createTools(
  userId: string,
  userEmail: string,
  userName?: string,
) {
  return [
    {
      name: "getUserProfile",
      description:
        "Show the user's profile card with their name, email, and saved note.",
      tool: async () => {
        // Validate user profile exists (creates if needed)
        await getUserProfileById(
          userId,
          userEmail,
          userName || userEmail.split("@")[0],
        );
        // Return empty - component fetches its own data
        return {};
      },
      inputSchema: z.object({}),
      outputSchema: z.object({}).strict(),
    },
    {
      name: "updateUserNote",
      description: "Update the user's saved note.",
      tool: async (input: { note: string }) => {
        await updateUserNoteById(userId, input.note, userEmail, userName);
        // Return empty - component will re-fetch to show updates
        return {};
      },
      inputSchema: z.object({
        note: z
          .string()
          .max(500, "Note must be 500 characters or less")
          .describe("The note content to save."),
      }),
      outputSchema: z.object({}).strict(),
    },
  ];
}

/**
 * Component registry with associated tools.
 *
 * The associatedTools property links tools to components, telling Tambo's AI
 * that when these tools are called, it should display the component.
 */
export function createComponents(
  userId: string,
  userEmail: string,
  userName?: string,
): TamboComponent[] {
  const tools = createTools(userId, userEmail, userName);

  return [
    {
      name: "UserProfileCard",
      description:
        "Displays the user's profile including name, email, and saved notes.",
      component: UserProfileCard,
      propsSchema: z.object({}),
      associatedTools: tools, // Link both tools to this component
    },
  ];
}
