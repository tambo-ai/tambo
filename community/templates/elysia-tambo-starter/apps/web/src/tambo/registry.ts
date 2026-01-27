import { TamboComponent } from "@tambo-ai/react";
import { DataTable } from "../components/DataTable";
import { TaskList } from "../components/TaskList";
import { SimpleChart } from "../components/SimpleChart";
import { NotificationCard } from "../components/NotificationCard";
import { PricingTable } from "../components/PricingTable";
import { z } from "zod";

export const components: TamboComponent[] = [
  {
    name: "dataTable",
    component: DataTable,
    description:
      "A professional table component for displaying structured data.",
    propsSchema: z.object({
      title: z.string().optional().describe("The title of the table"),
      columns: z.array(z.string()).describe("List of column headers"),
      rows: z.array(z.array(z.any())).describe("List of data rows"),
    }),
  },
  {
    name: "taskList",
    component: TaskList,
    description: "A list of tasks.",
    propsSchema: z.object({
      initialTasks: z
        .array(
          z.object({
            id: z.string(),
            text: z.string(),
            completed: z.boolean(),
          }),
        )
        .optional()
        .describe("Initial list of tasks"),
    }),
  },
  {
    name: "simpleChart",
    component: SimpleChart,
    description: "A simple bar chart to visualize data.",
    propsSchema: z.object({
      title: z.string().optional().describe("The chart title"),
      data: z
        .array(
          z.object({
            label: z.string(),
            value: z.number(),
          }),
        )
        .describe("Array of data points with label and value"),
    }),
  },
  {
    name: "notification",
    component: NotificationCard,
    description: "A notification or alert card.",
    propsSchema: z.object({
      type: z
        .enum(["success", "warning", "error", "info"])
        .describe("The type/severity of the notification"),
      title: z.string().describe("The bold title of the notification"),
      message: z.string().describe("The main message content"),
    }),
  },
  {
    name: "pricingTable",
    component: PricingTable,
    description: "A pricing plan card.",
    propsSchema: z.object({
      planName: z.string().describe("Name of the plan (e.g. Pro, Basic)"),
      price: z.string().describe("Formatted price string (e.g. $29)"),
      period: z.string().optional().describe("Billing period (e.g. /month)"),
      features: z.array(z.string()).describe("List of features included"),
      isPopular: z
        .boolean()
        .optional()
        .describe("Whether to highlight as popular"),
      ctaText: z.string().optional().describe("Button text"),
    }),
  },
];
