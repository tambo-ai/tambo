import { z } from "zod";

export const tools = [
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

      return {
        message: `Task "${title}" created.`,
      };
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
            createdAt: z.string(),
          })
        ),
      }),
    }),
    tool: async () => {
      const res = await fetch("/api/tasks");
      const tasks = await res.json();

      return {
        component: "TaskList",
        props: { tasks },
      };
    },
  },
];
