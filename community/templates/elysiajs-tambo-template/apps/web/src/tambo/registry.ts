import { TamboComponent } from "@tambo-ai/react";
import { SimpleChart } from "../components/SimpleChart";
import { TodoList } from "../components/TodoList";
import { z } from "zod";

export const components: TamboComponent[] = [
  {
    name: "chart",
    component: SimpleChart,
    description: "A simple visual chart component for displaying data trends.",
    propsSchema: z.object({
      title: z.string().describe("The title of the chart"),
      data: z
        .array(
          z.object({
            label: z.string(),
            value: z.number(),
          }),
        )
        .describe("The data points for the chart"),
      type: z
        .enum(["bar", "line", "area"])
        .default("bar")
        .describe("The type of chart to render"),
    }),
  },
  {
    name: "todo",
    component: TodoList,
    description: "A todo list for managing tasks.",
    propsSchema: z.object({
      title: z.string().optional().describe("Title of the task list"),
      initialItems: z
        .array(
          z.object({
            id: z.string(),
            text: z.string(),
            completed: z.boolean(),
          }),
        )
        .optional()
        .describe("List of initial tasks"),
    }),
  },
];
