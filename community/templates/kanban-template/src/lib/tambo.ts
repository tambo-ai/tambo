/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import { TaskCard, taskCardPropsSchema } from "@/components/tambo/task-card";
import { taskTools } from "@/lib/task-tools";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";

/**
 * Tools registered for Tambo to use.
 * These allow the AI to create, move, and query tasks.
 */
export const tools: TamboTool[] = taskTools;

/**
 * Components registered for Tambo to render.
 * The AI can dynamically render these based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "TaskCard",
    description:
      "Displays a task with title, description, priority badge, status badge, and optional due date. Use this component when showing task details or confirming task creation.",
    component: TaskCard,
    propsSchema: taskCardPropsSchema,
  },
];
