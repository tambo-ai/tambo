/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import { Graph, graphSchema } from "@/components/tambo/graph";
import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import {
  getCountryPopulations,
  getGlobalPopulationTrend,
} from "@/services/population-stats";
import type { TamboComponent } from "@tambo-ai/react";
import type { TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { DataTable, dataTablePropsSchema } from '@/components/tambo/data-table';
import { queryTasks, insertTask } from '@/actions/db-actions';


/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * can be controlled by AI to dynamically fetch data based on user interactions.
 */

export const tools: TamboTool[] = [
  {
    name: "countryPopulation",
    description:
      "A tool to get population statistics by country with advanced filtering options",
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
    description:
      "A tool to get global population trends with optional year range filtering",
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
  // Add more tools here
  {
    name: 'queryTasks',
    description: 'Fetches tasks from the database. Can filter by status (todo, in_progress, done) and/or priority (low, medium, high). Returns tasks ordered by creation date (newest first). Do not pass null values - omit parameters to get all tasks.',
    tool: async (params: {
      status?: string | null,
      priority?: string | null
    }) => {
      // Sanitize params - treat "null" string or null as undefined
      const validStatuses = ['todo', 'in_progress', 'done'];
      const validPriorities = ['low', 'medium', 'high'];

      const cleanFilters: {
        status?: 'todo' | 'in_progress' | 'done',
        priority?: 'low' | 'medium' | 'high'
      } = {};

      if (params.status && validStatuses.includes(params.status)) {
        cleanFilters.status = params.status as 'todo' | 'in_progress' | 'done';
      }

      if (params.priority && validPriorities.includes(params.priority)) {
        cleanFilters.priority = params.priority as 'low' | 'medium' | 'high';
      }

      return await queryTasks(Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined);
    },
    inputSchema: z.object({
      status: z.enum(['todo', 'in_progress', 'done']).nullable().optional(),
      priority: z.enum(['low', 'medium', 'high']).nullable().optional(),
    }),
    outputSchema: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        status: z.string(),
        priority: z.string(),
        createdAt: z.string(),
      })
    ),
  },
  {
    name: 'insertTask',
    description: 'Creates a new task in the database. Requires a title. Optional: description, status (defaults to "todo"), priority (defaults to "medium").',
    tool: async (params: {
      title: string;
      description?: string;
      status?: 'todo' | 'in_progress' | 'done';
      priority?: 'low' | 'medium' | 'high';
    }) => {
      return await insertTask(params);
    },
    inputSchema: z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(['todo', 'in_progress', 'done']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
    }),
    outputSchema: z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      status: z.string(),
      priority: z.string(),
      createdAt: z.string(),
    }),
  },
];

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 * Each component is defined with its name, description, and expected props. The components
 * can be controlled by AI to dynamically render UI elements based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie) using Recharts. Supports customizable data visualization with labels, datasets, and styling options.",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataCard",
    description:
      "A component that displays options as clickable cards with links and summaries with the ability to select multiple items.",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
  // Add more components here
  {
    name: 'DataTable',
    description: 'ALWAYS use this component to display tasks from the database in a beautiful table format. Render this component whenever the queryTasks tool returns data. Pass the queryTasks result directly to the data prop.',
    component: DataTable,
    propsSchema: dataTablePropsSchema,
  },
];
