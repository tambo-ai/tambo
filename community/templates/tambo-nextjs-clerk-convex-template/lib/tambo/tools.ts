import { defineTool, type TamboTool } from "@tambo-ai/react";
import { z } from "zod";

/**
 * Creates Tambo tools for notes management.
 * These tools allow the AI to create, update, and manage notes.
 */
export function createNotesTools(
  createNote: (args: {
    title: string;
    content: string;
    pinned?: boolean;
  }) => Promise<{ id: string; title: string }>,
  updateNote: (args: {
    id: string;
    title?: string;
    content?: string;
    pinned?: boolean;
    archived?: boolean;
  }) => Promise<unknown>,
  deleteNote: (args: { id: string }) => Promise<unknown>,
): TamboTool[] {
  return [
    defineTool({
      name: "createNote",
      description:
        "Creates a new note with a title and content. " +
        "Use this when the user asks to create, add, or write a note. " +
        "You can optionally pin the note. " +
        "After creating, ALWAYS render the NoteCard component to show the created note.",
      tool: async (params) => {
        try {
          const result = await createNote({
            title: params.title,
            content: params.content,
            pinned: params.pinned,
          });
          return {
            success: true,
            noteId: result.id,
            title: result.title,
            content: params.content,
            pinned: params.pinned ?? false,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "Failed to create note",
          };
        }
      },
      inputSchema: z.object({
        title: z.string().describe("The title of the note"),
        content: z.string().describe("The content/body of the note"),
        pinned: z.boolean().optional().describe("Whether to pin the note"),
      }),
      outputSchema: z.object({
        success: z.boolean(),
        noteId: z.string().optional(),
        title: z.string().optional(),
        content: z.string().optional(),
        pinned: z.boolean().optional(),
        error: z.string().optional(),
      }),
    }),

    defineTool({
      name: "updateNote",
      description:
        "Updates an existing note. Can change title, content, pin status, or archive it. " +
        "Use this when the user wants to edit, modify, pin, unpin, or archive a note.",
      tool: async (params) => {
        try {
          await updateNote({
            id: params.noteId,
            title: params.title,
            content: params.content,
            pinned: params.pinned,
            archived: params.archived,
          });
          return {
            success: true,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "Failed to update note",
          };
        }
      },
      inputSchema: z.object({
        noteId: z.string().describe("The ID of the note to update"),
        title: z.string().optional().describe("New title for the note"),
        content: z.string().optional().describe("New content for the note"),
        pinned: z
          .boolean()
          .optional()
          .describe("Whether to pin/unpin the note"),
        archived: z
          .boolean()
          .optional()
          .describe("Whether to archive/unarchive the note"),
      }),
      outputSchema: z.object({
        success: z.boolean(),
        error: z.string().optional(),
      }),
    }),

    defineTool({
      name: "deleteNote",
      description:
        "Permanently deletes a note. Use this when the user asks to delete or remove a note.",
      tool: async (params) => {
        try {
          await deleteNote({ id: params.noteId });
          return {
            success: true,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "Failed to delete note",
          };
        }
      },
      inputSchema: z.object({
        noteId: z.string().describe("The ID of the note to delete"),
      }),
      outputSchema: z.object({
        success: z.boolean(),
        error: z.string().optional(),
      }),
    }),
  ];
}
