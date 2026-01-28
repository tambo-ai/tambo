import { UserProfileCard } from "@/components/tambo/user-profile-card";
import { getUserProfileById, updateUserNoteById } from "@/server/actions";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";

export const components: TamboComponent[] = [
  {
    name: "UserProfileCard",
    description:
      "Displays the user's profile including name, email, and saved notes.",
    component: UserProfileCard,
    propsSchema: z.object({
      name: z.string().describe("User display name"),
      email: z.string().describe("User email address"),
      note: z.string().nullable().describe("User saved note"),
      lastUpdated: z
        .string()
        .optional()
        .describe("ISO timestamp of last update"),
    }),
  },
];

/**
 * Create tools bound to a specific user.
 * This is necessary because server actions called through Tambo's tool
 * execution don't have access to cookies for authentication.
 */
export function createTools(
  userId: string,
  userEmail: string,
  userName?: string,
): TamboTool[] {
  return [
    {
      name: "getUserProfile",
      description:
        "Fetch the authenticated user's profile including name, email, and saved notes.",
      tool: async () =>
        getUserProfileById(
          userId,
          userEmail,
          userName || userEmail.split("@")[0],
        ),
      inputSchema: z.object({}),
      outputSchema: z.object({
        name: z.string().describe("User's display name"),
        email: z.string().describe("User's email address"),
        note: z.string().nullable().describe("User's saved note"),
        lastUpdated: z
          .string()
          .optional()
          .describe("ISO timestamp of last update"),
      }),
    },
    {
      name: "updateUserNote",
      description:
        "Update the user's personal note. Returns the updated profile data.",
      tool: async (input: { note: string }) =>
        updateUserNoteById(userId, input.note, userEmail, userName),
      inputSchema: z.object({
        note: z
          .string()
          .describe("The note content to save. Maximum 500 characters."),
      }),
      outputSchema: z.object({
        name: z.string(),
        email: z.string(),
        note: z.string().nullable(),
        lastUpdated: z.string().optional(),
      }),
    },
  ];
}
