import type { Priority, Status, Task } from "@/types/task";
import type { TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { useTaskStore } from "./task-store";

const prioritySchema = z.enum(["low", "medium", "high"]);
const statusSchema = z.enum(["todo", "in-progress", "done"]);

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: prioritySchema,
  status: statusSchema,
  dueDate: z.string().optional(),
  createdAt: z.string(),
});

export const createTaskTool: TamboTool = {
  name: "createTask",
  description:
    "Create a new task in the kanban board. Tasks start in the 'todo' column by default.",
  inputSchema: z.object({
    title: z.string().describe("The title of the task"),
    description: z.string().optional().describe("Optional task description"),
    priority: prioritySchema
      .optional()
      .default("medium")
      .describe("Task priority: low, medium, or high"),
    dueDate: z
      .string()
      .optional()
      .describe("Optional due date in ISO format or human-readable format"),
  }),
  outputSchema: taskSchema,
  tool: async (input: {
    title: string;
    description?: string;
    priority?: Priority;
    dueDate?: string;
  }): Promise<Task> => {
    const store = useTaskStore.getState();
    const task = store.addTask({
      title: input.title,
      description: input.description,
      priority: input.priority ?? "medium",
      status: "todo",
      dueDate: input.dueDate,
    });
    return task;
  },
};

export const moveTaskTool: TamboTool = {
  name: "moveTask",
  description:
    "Move a task to a different column/status. Use this when the user wants to change a task's status (e.g., 'move X to done', 'start working on X').",
  inputSchema: z.object({
    taskId: z.string().describe("The ID of the task to move"),
    newStatus: statusSchema.describe(
      "The new status: todo, in-progress, or done",
    ),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    task: taskSchema.optional(),
    error: z.string().optional(),
  }),
  tool: async (input: {
    taskId: string;
    newStatus: Status;
  }): Promise<{ success: boolean; task?: Task; error?: string }> => {
    const store = useTaskStore.getState();
    const task = store.moveTask(input.taskId, input.newStatus);

    if (!task) {
      return {
        success: false,
        error: `Task with ID "${input.taskId}" not found`,
      };
    }

    return { success: true, task };
  },
};

export const getTasksTool: TamboTool = {
  name: "getTasks",
  description:
    "Get all tasks, optionally filtered by status. Use this to show the user their tasks or answer questions about what tasks exist.",
  inputSchema: z.object({
    status: statusSchema
      .optional()
      .describe("Optional filter by status: todo, in-progress, or done"),
  }),
  outputSchema: z.object({
    tasks: z.array(taskSchema),
    count: z.number(),
  }),
  tool: async (input: {
    status?: Status;
  }): Promise<{ tasks: Task[]; count: number }> => {
    const store = useTaskStore.getState();

    const tasks = input.status
      ? store.getTasksByStatus(input.status)
      : store.tasks;

    return { tasks, count: tasks.length };
  },
};

export const taskTools: TamboTool[] = [
  createTaskTool,
  moveTaskTool,
  getTasksTool,
];
