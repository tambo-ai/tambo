import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

export const tools: TamboTool[] = [
    {
        name: "saveUserNote",
        description:
            "Saves a note for the authenticated user to the database. Use this when the user wants to remember something, save information, or store a thought.",
        tool: async (params: { content: string }) => {
            const response = await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: params.content }),
            });

            if (!response.ok) {
                throw new Error("Failed to save note");
            }

            const data = await response.json();
            return data;
        },
        inputSchema: z.object({
            content: z.string().describe("The note content to save"),
        }),
        outputSchema: z.object({
            id: z.number(),
            content: z.string(),
            created_at: z.string(),
            message: z.string(),
        }),
    },
    {
        name: "listUserNotes",
        description:
            "Retrieves all notes saved by the authenticated user from the database. Use this when the user wants to see their saved notes or recall information.",
        tool: async () => {
            const response = await fetch("/api/notes");

            if (!response.ok) {
                throw new Error("Failed to fetch notes");
            }

            const data = await response.json();
            return data;
        },
        inputSchema: z.object({}),
        outputSchema: z.object({
            notes: z.array(
                z.object({
                    id: z.number(),
                    content: z.string(),
                    created_at: z.string(),
                }),
            ),
            count: z.number(),
        }),
    },
    {
        name: "deleteUserNote",
        description:
            "Deletes a specific note for the authenticated user. Use this when the user wants to remove or forget a saved note.",
        tool: async (params: { noteId: number }) => {
            const response = await fetch(`/api/notes?id=${params.noteId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete note");
            }

            const data = await response.json();
            return data;
        },
        inputSchema: z.object({
            noteId: z.number().describe("The ID of the note to delete"),
        }),
        outputSchema: z.object({
            message: z.string(),
        }),
    },
];
