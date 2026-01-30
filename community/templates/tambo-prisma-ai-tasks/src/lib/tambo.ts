/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import { Graph, graphSchema } from "@/components/tambo/graph";
import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import {
  getCountryPopulations,
  getGlobalPopulationTrend,
} from "@/services/population-stats";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { aiCreateThread, aiListThreads } from "@/app/actions/ai-tools";
import {
  aiCreateTask,
  aiListTasks,
  aiUpdateTask,
  aiDeleteTask,
} from "@/app/actions/task";

/* -------------------------------------------------------------------------- */
/*                                   TOOLS                                    */
/* -------------------------------------------------------------------------- */

export const tools: TamboTool[] = [
  {
    name: "countryPopulation",
    description: "Get population statistics by country with optional filters",
    tool: getCountryPopulations,
    inputSchema: z.object({
      continent: z.string().optional(),
      sortBy: z.enum(["population", "growthRate"]).optional(),
      limit: z.number().optional(),
      order: z.enum(["asc", "desc"]).optional(),
    }),
    outputSchema: z.array(
      z.object({
        countryCode: z.string(),
        countryName: z.string(),
        continent: z.enum([
          "Asia",
          "Africa",
          "Europe",
          "North America",
          "South America",
          "Oceania",
        ]),
        population: z.number(),
        year: z.number(),
        growthRate: z.number(),
      }),
    ),
  },

  {
    name: "globalPopulation",
    description: "Get global population trends",
    tool: getGlobalPopulationTrend,
    inputSchema: z.object({
      startYear: z.number().optional(),
      endYear: z.number().optional(),
    }),
    outputSchema: z.array(
      z.object({
        year: z.number(),
        population: z.number(),
        growthRate: z.number(),
      }),
    ),
  },

  /* --------------------------- AI ↔ DATABASE TOOLS -------------------------- */

  {
    name: "create_thread",
    description: "Create a new thread in the database",
    tool: async ({ title }: { title: string }) => {
      return await aiCreateThread(title);
    },
    inputSchema: z.object({
      title: z.string(),
    }),
    outputSchema: z.object({
      id: z.string(),
      title: z.string().nullable(),
      createdAt: z.date(),
    }),
  },

  {
    name: "list_threads",
    description: "List all existing threads from the database",
    tool: async () => {
      return await aiListThreads();
    },
    inputSchema: z.object({}),
    outputSchema: z.array(
      z.object({
        id: z.string(),
        title: z.string().nullable(),
        createdAt: z.date(),
      }),
    ),
  },

  {
    name: "create_task",
    description: "Create a new task in the database",
    tool: async ({ title }: { title: string }) => {
      return await aiCreateTask(title);
    },
    inputSchema: z.object({
      title: z.string(),
    }),
    outputSchema: z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
      createdAt: z.date(),
    }),
  },

  {
    name: "list_tasks",
    description: "List all tasks from the database",
    tool: async () => {
      return await aiListTasks();
    },
    inputSchema: z.object({}),
    outputSchema: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        completed: z.boolean(),
        createdAt: z.date(),
      }),
    ),
  },

  {
    name: "update_task",
    description:
      "Update an existing task. Can rename a task or mark it as completed or incomplete.",
    tool: async ({
      id,
      title,
      completed,
    }: {
      id: string;
      title?: string;
      completed?: boolean;
    }) => {
      return await aiUpdateTask({ id, title, completed });
    },
    inputSchema: z.object({
      id: z.string(),
      title: z.string().optional(),
      completed: z.boolean().optional(),
    }),
    outputSchema: z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
      createdAt: z.date(),
    }),
  },

  {
    name: "delete_task",
    description: "Delete a task permanently by its ID.",
    tool: async ({ id }: { id: string }) => {
      return await aiDeleteTask(id);
    },
    inputSchema: z.object({
      id: z.string(),
    }),
    outputSchema: z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
      createdAt: z.date(),
    }),
  },
];

/* -------------------------------------------------------------------------- */
/*                                 COMPONENTS                                 */
/* -------------------------------------------------------------------------- */

export const components: TamboComponent[] = [
  {
    name: "Graph",
    description: "Render charts (bar, line, pie) using Recharts",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataCard",
    description: "Display selectable data cards with summaries",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
];
