import { UserProfileCard } from "@/components/tambo/user-profile-card";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { getUserProfile, updateUserNote } from "./supabase-tools";

export const components: TamboComponent[] = [
  {
    name: "UserProfileCard",
    description:
      "Displays current user profile with name, email, and saved notes. Shows when the note was last updated.",
    component: UserProfileCard,
    propsSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "User display name" },
        email: { type: "string", description: "User email address" },
        note: {
          type: "string",
          description: "User saved note or personal message",
        },
        lastUpdated: {
          type: "string",
          description: "ISO timestamp of when the note was last updated",
        },
      },
      required: ["name", "email"],
    },
  },
];

export const tools: TamboTool[] = [
  {
    name: "getUserProfile",
    description:
      "Fetch the current authenticated user profile including name, email, and any saved notes. No parameters needed - automatically uses the current user session.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
    outputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        note: { type: ["string", "null"] },
        lastUpdated: { type: "string" },
      },
    },
    tool: getUserProfile,
  },
  {
    name: "updateUserNote",
    description:
      "Save or update a text note for the current authenticated user. Only provide the note text - user is automatically identified from session.",
    inputSchema: {
      type: "object" as const,
      properties: {
        note: {
          type: "string",
          description: "The note content to save (max 500 chars)",
        },
      },
      required: ["note"],
    },
    outputSchema: {
      type: "object" as const,
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
      },
    },
    tool: updateUserNote,
  },
];
