import { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import TaskList from "@/components/tambo/TaskList";

// 1. Define the Task Schema once to reuse it in both registries
const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
});

export const components: TamboComponent[] = [
  {
    name: "TaskList",
    description: "Displays a list of tasks. Use this when the user asks to see their tasks.",
    component: TaskList,
    propsSchema: z.object({
      tasks: z.array(TaskSchema).describe("The array of tasks to display"),
      loading: z.boolean().optional(),
    }),
  },
];

export const tools: TamboTool[] = [
  {
    name: "manage_tasks",
    description: "Fetch the task list or add a new task via the Hono API.",
    inputSchema: z.object({
      action: z.enum(["list", "add"]).describe("The action to perform"),
      title: z.string().optional().describe("Task title (required for add)"),
    }),
    // FIX: Mandatory outputSchema required by Tambo SDK
    outputSchema: z.union([
      z.array(TaskSchema), // For 'list' action
      TaskSchema,          // For 'add' action
      z.object({ error: z.string() })
    ]).describe("The resulting task data or task list from the API"),
    
    tool: async ({ action, title }) => {
      const endpoint = "/api/tasks";
      if (action === "list") {
        const res = await fetch(endpoint);
        return res.json();
      }
      if (action === "add" && title) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        return res.json();
      }
    },
  },
];