/**
 * @file tambo.ts
 * @description Central configuration for Tambo components and tools (Prisma task manager).
 *
 * Register components and tools here. These are used by TamboProvider.
 * Read more at https://docs.tambo.co
 */

import TaskList from "../components/tambo/TaskList";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";

const taskListPropsSchema = z.object({
  tasks: z
    .array(
      z.object({
        id: z.string().optional().default(""),
        title: z.string().optional().default(""),
      })
    )
    .default([]),
});

export const tools: TamboTool[] = [
  {
    name: "createTask",
    description: "Create a new task",
    inputSchema: z.object({
      title: z.string(),
    }),
    outputSchema: z.object({
      message: z.string(),
    }),
    tool: async ({ title }: { title: string }) => {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      return { message: `Task "${title}" created.` };
    },
  },
  {
    name: "getTasks",
    description: "Get all tasks",
    inputSchema: z.object({}),
    outputSchema: z.object({
      component: z.literal("TaskList"),
      props: z.object({
        tasks: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
          })
        ),
      }),
    }),
    tool: async () => {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      const tasks = Array.isArray(data) ? data : [];
      return {
        component: "TaskList",
        props: {
          tasks: tasks.map((t: { id: number; title: string }) => ({
            id: String(t.id),
            title: String(t.title),
          })),
        },
      };
    },
  },
];

export const components: TamboComponent[] = [
  {
    name: "TaskList",
    description:
      "Displays a list of tasks with id and title. Use when the user asks to see tasks, list tasks, or show my tasks.",
    component: TaskList,
    propsSchema: taskListPropsSchema,
  },
];
