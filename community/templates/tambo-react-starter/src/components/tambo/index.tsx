/**
 * Component & Tool Registry
 *
 * This file registers React components and tools with Tambo.
 * The AI uses these registrations to decide what to render.
 *
 * Each component needs:
 * - name: Unique identifier for the AI to reference
 * - description: Helps AI decide when to use this component
 * - propsSchema: Zod schema defining the expected data structure
 *
 * Each tool needs:
 * - name: Function identifier
 * - description: What the tool does
 * - tool: Async function implementation
 * - inputSchema/outputSchema: Zod schemas for type safety
 */

import { ActionItemForm } from "./ActionItemForm";
import { AgendaViewer } from "./AgendaViewer";
import { z } from "zod";

// Example components - replace or extend these for your use case
export const components = [
    {
        name: "AgendaViewer",
        description: "Displays a timeline with time slots, topics, and assignees. Use for schedules, agendas, or any time-based list.",
        component: AgendaViewer,
        propsSchema: z.object({
            agenda: z.array(
                z.object({
                    time: z.string().describe("Time slot (e.g., '10:00 AM')"),
                    topic: z.string().describe("Item title or description"),
                    assignee: z.string().describe("Person responsible"),
                })
            ).min(1).describe("Array of timeline items"),
        }),
    },
    {
        name: "ActionItemForm",
        description: "Interactive checklist for tasks or action items. Use when user wants to track todos, tasks, or items to complete.",
        component: ActionItemForm,
        propsSchema: z.object({
            items: z.array(
                z.object({
                    task: z.string().describe("Task description"),
                    assignee: z.string().optional().describe("Person assigned"),
                    due: z.string().optional().describe("Due date (YYYY-MM-DD)"),
                })
            ).min(1).default([{ task: "New task" }]).describe("Array of tasks"),
        }),
    },
];

// Example tool - replace or extend for your use case
export const tools = [
    {
        name: "summarizeNotes",
        description: "Extracts action items and decisions from text notes",
        tool: async (args: { notes: string }) => {
            // Example implementation - replace with your logic
            console.log("Processing notes:", args.notes);
            return {
                actions: ["Example action 1", "Example action 2"],
                decisions: ["Example decision 1"],
            };
        },
        inputSchema: z.object({
            notes: z.string().describe("Raw text to process"),
        }),
        outputSchema: z.object({
            actions: z.array(z.string()),
            decisions: z.array(z.string()),
        }),
    },
];
