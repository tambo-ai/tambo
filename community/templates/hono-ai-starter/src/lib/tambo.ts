import { defineTool } from "@tambo-ai/react";
import { z } from "zod";

export const tools = [
  defineTool({
    name: "manage_tasks",
    description: "Fetch the task list or add a new task via the Hono API.",
    inputSchema: z.object({
      action: z.enum(["list", "add"]),
      title: z.string().optional().describe("Task title (required for add)"),
    }),
    tool: async ({ action, title }) => {
      const endpoint = "/api/tasks";
      if (action === "list") return (await fetch(endpoint)).json();
      if (action === "add" && title) {
        return (await fetch(endpoint, {
          method: "POST",
          body: JSON.stringify({ title }),
        })).json();
      }
    },
  }),
];