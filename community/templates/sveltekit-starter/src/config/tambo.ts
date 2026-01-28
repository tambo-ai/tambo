/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import Graph from "../components/tambo/Graph.svelte";
import DataCard from "../components/tambo/DataCard.svelte";
import {
  getCountryPopulations,
  getGlobalPopulationTrend,
} from "../services/population-stats.js";
import type { TamboComponent, TamboTool } from "$lib/tambo/types.js";
import { z } from "zod";

/**
 * Graph schema for props validation
 */
export const graphDataSchema = z.object({
  type: z.enum(["bar", "line", "pie"]).describe("Type of graph to render"),
  labels: z.array(z.string()).describe("Labels for the graph"),
  datasets: z
    .array(
      z.object({
        label: z.string().describe("Label for the dataset"),
        data: z.array(z.number()).describe("Data points for the dataset"),
        color: z.string().optional().describe("Optional color for the dataset"),
      }),
    )
    .describe("Data for the graph"),
});

export const graphSchema = z.object({
  data: graphDataSchema.describe(
    "Data object containing chart configuration and values",
  ),
  title: z.string().describe("Title for the chart"),
  showLegend: z
    .boolean()
    .optional()
    .describe("Whether to show the legend (default: true)"),
  variant: z
    .enum(["default", "solid", "bordered"])
    .optional()
    .describe("Visual style variant of the graph"),
  size: z
    .enum(["default", "sm", "lg"])
    .optional()
    .describe("Size of the graph"),
});

/**
 * DataCard schema for props validation
 */
export const dataCardSchema = z.object({
  title: z.string().describe("Title displayed above the data cards"),
  options: z
    .array(
      z.object({
        id: z.string().describe("Unique identifier for this card"),
        label: z.string().describe("Display text for the card title"),
        value: z.string().describe("Value associated with this card"),
        description: z
          .string()
          .optional()
          .describe("Optional summary for the card"),
        url: z
          .string()
          .optional()
          .describe("Optional URL for the card to navigate to"),
      }),
    )
    .describe("Array of selectable cards to display"),
});

/**
 * Tool input schemas (used for both validation and JSON schema generation)
 */
const countryPopulationInputSchema = z.object({
  continent: z.string().optional().describe("Filter by continent"),
  sortBy: z
    .enum(["population", "growthRate"])
    .optional()
    .describe("Sort by field"),
  limit: z.number().optional().describe("Limit results"),
  order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
});

const globalPopulationInputSchema = z.object({
  startYear: z.number().optional().describe("Start year filter"),
  endYear: z.number().optional().describe("End year filter"),
});

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 */
export const tools: TamboTool[] = [
  {
    name: "countryPopulation",
    description:
      "A tool to get population statistics by country with advanced filtering options",
    tool: getCountryPopulations as TamboTool["tool"],
    toolSchema: countryPopulationInputSchema,
  },
  {
    name: "globalPopulation",
    description:
      "A tool to get global population trends with optional year range filtering",
    tool: getGlobalPopulationTrend as TamboTool["tool"],
    toolSchema: globalPopulationInputSchema,
  },
];

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 */
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie). Supports customizable data visualization with labels, datasets, and styling options.",
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
];
