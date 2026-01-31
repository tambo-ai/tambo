/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import { StickyNote, stickyNoteSchema } from "@/interactables/components/StickyNote";
import { useCanvasStore } from "@/lib/canvas-storage";
import { supabase } from "@/lib/supabase";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";

/**
 * Tambo components
 */
export const components: TamboComponent[] = [
    {
        name: "StickyNote",
        description:
            "A premium sticky note with neutral design, #80FFCE accent option, ID/date footer. Draggable on canvas.",
        component: StickyNote,
        propsSchema: stickyNoteSchema,
    },
];

const createNoteInputSchema = z.object({
    title: z.string().describe("Title of the sticky note"),
    content: z.string().describe("Content/body of the sticky note"),
    color: z
        .enum(["default", "accent", "muted"])
        .optional()
        .default("default")
        .describe("Style: default (neutral), accent (#80FFCE), muted (subtle)"),
});

const updateNoteInputSchema = z.object({
    id: z.string().describe("ID of the sticky note to update (last 8 chars or full ID)"),
    title: z.string().optional().describe("New title"),
    content: z.string().optional().describe("New content"),
    color: z.enum(["default", "accent", "muted"]).optional().describe("New style"),
});

const deleteNoteInputSchema = z.object({
    id: z.string().describe("ID of the sticky note to delete"),
});

const toolOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    noteId: z.string().optional(),
});


export const tools: TamboTool[] = [
    {
        name: "createNote",
        description:
            "Creates a new sticky note on the canvas and saves to database. Use when user asks to create, add, or make a new note.",
        tool: async (args: z.infer<typeof createNoteInputSchema>) => {
            const noteId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const now = new Date().toISOString();

            const state = useCanvasStore.getState();
            let activeCanvasId = state.activeCanvasId;

            if (!activeCanvasId) {
                const newCanvas = state.createCanvas("Notes");
                activeCanvasId = newCanvas.id;
            }

            state.addComponent(activeCanvasId, {
                componentId: noteId,
                _componentType: "StickyNote",
                _inCanvas: true,
                canvasId: activeCanvasId,
                id: noteId,
                title: args.title,
                content: args.content,
                color: args.color || "default",
                createdAt: now,
            });

            const { error } = await supabase.from("sticky_notes").insert({
                id: noteId,
                title: args.title,
                content: args.content,
                color: args.color || "default",
                canvas_id: activeCanvasId,
                created_at: now,
                updated_at: now,
            });

            if (error) {
                console.error("Failed to persist note to Supabase:", error);
                return {
                    success: false,
                    message: `Note created locally. DB error: ${error.message}`,
                    noteId,
                };
            }

            return {
                success: true,
                message: `Created "${args.title}"`,
                noteId,
            };
        },
        inputSchema: createNoteInputSchema,
        outputSchema: toolOutputSchema,
    },
    {
        name: "updateNote",
        description:
            "Updates an existing sticky note by ID and syncs to database. Use when user asks to edit, change, or update a note.",
        tool: async (args: z.infer<typeof updateNoteInputSchema>) => {
            const state = useCanvasStore.getState();
            const activeCanvasId = state.activeCanvasId;

            if (!activeCanvasId) {
                return { success: false, message: "No active canvas found." };
            }

            const components = state.getComponents(activeCanvasId);
            const existing = components.find(
                (c) => c.id === args.id || c.componentId === args.id || c.componentId?.endsWith(args.id)
            );

            if (!existing) {
                return { success: false, message: `Note with ID "${args.id}" not found.` };
            }

            const updateProps: Record<string, unknown> = {};
            if (args.title !== undefined) updateProps.title = args.title;
            if (args.content !== undefined) updateProps.content = args.content;
            if (args.color !== undefined) updateProps.color = args.color;

            state.updateComponent(activeCanvasId, existing.componentId, updateProps);

            const { error } = await supabase
                .from("sticky_notes")
                .update({
                    ...(args.title && { title: args.title }),
                    ...(args.content && { content: args.content }),
                    ...(args.color && { color: args.color }),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existing.componentId);

            if (error) {
                console.error("Failed to update note in Supabase:", error);
            }

            return {
                success: true,
                message: `Updated note #${existing.componentId.slice(-8)}`,
                noteId: existing.componentId,
            };
        },
        inputSchema: updateNoteInputSchema,
        outputSchema: toolOutputSchema,
    },
    {
        name: "deleteNote",
        description:
            "Deletes a sticky note by ID from canvas and database. Use when user asks to remove, delete, or clear a note.",
        tool: async (args: z.infer<typeof deleteNoteInputSchema>) => {
            const state = useCanvasStore.getState();
            const activeCanvasId = state.activeCanvasId;

            if (!activeCanvasId) {
                return { success: false, message: "No active canvas found." };
            }

            const components = state.getComponents(activeCanvasId);
            const existing = components.find(
                (c) => c.id === args.id || c.componentId === args.id || c.componentId?.endsWith(args.id)
            );

            if (!existing) {
                return { success: false, message: `Note with ID "${args.id}" not found.` };
            }

            state.removeComponent(activeCanvasId, existing.componentId);

            const { error } = await supabase.from("sticky_notes").delete().eq("id", existing.componentId);

            if (error) {
                console.error("Failed to delete note from Supabase:", error);
            }

            return {
                success: true,
                message: `Deleted note #${existing.componentId.slice(-8)}`,
                noteId: existing.componentId,
            };
        },
        inputSchema: deleteNoteInputSchema,
        outputSchema: toolOutputSchema,
    },
];
