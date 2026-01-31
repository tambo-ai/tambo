/**
 * Configuration file for Tambo AI integration.
 * Defines the components and tools available to the AI assistant.
 */
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { Graph } from "../components/tambo/Graph";

import { DataCard } from "../components/tambo/DataCard";

// Graph Component Schema
/**
 * Schema for the Graph component, defining which props the AI can pass to it.
 */
const graphSchema = z.object({
  data: z
    .object({
      type: z.enum(["bar", "line", "pie"]).describe("Type of chart to render"),
      labels: z.array(z.string()).describe("X-axis labels or categories"),
      datasets: z
        .array(
          z.object({
            label: z.string().describe("Dataset name shown in legend"),
            data: z.array(z.number()).describe("Numerical data points"),
            color: z
              .string()
              .nullish()
              .describe("Hex color code (e.g., #3b82f6)"),
          }),
        )
        .describe("Data series to display"),
    })
    .describe("Chart configuration and data"),
  title: z.string().nullish().describe("Chart title displayed at top"),
  showLegend: z.boolean().nullish().describe("Whether to show the legend"),
  variant: z.enum(["default", "solid", "bordered"]).nullish(),
  size: z.enum(["sm", "default", "lg"]).nullish(),
});

// DataCard Component Schema
/**
 * Schema for the DataCard component.
 */
const dataCardSchema = z.object({
  title: z.string().nullish().describe("Title of the data card section"),
  items: z
    .array(
      z.object({
        label: z.string().describe("Label for the data point"),
        value: z
          .union([z.string(), z.number()])
          .describe("Value of the data point"),
        trend: z
          .object({
            value: z.number().describe("Percentage change"),
            direction: z
              .enum(["up", "down", "neutral"])
              .describe("Direction of the trend"),
          })
          .nullish()
          .describe("Trend indicator"),
        description: z
          .string()
          .nullish()
          .describe("Helper text or description"),
      }),
    )
    .describe("List of data items to display"),
  variant: z
    .enum(["default", "grid", "list"])
    .nullish()
    .describe("Layout variant"),
});

// Tool: Global Population Data
const getGlobalPopulationTrend = async (params?: {
  startYear?: number;
  endYear?: number;
}) => {
  const data = [
    { year: 2020, population: 7794000000, growthRate: 1.05 },
    { year: 2021, population: 7875000000, growthRate: 1.04 },
    { year: 2022, population: 7951000000, growthRate: 0.97 },
    { year: 2023, population: 8045000000, growthRate: 1.18 },
    { year: 2024, population: 8100000000, growthRate: 0.68 },
  ];

  if (params?.startYear && params?.endYear) {
    return data.filter(
      (d) => d.year >= params.startYear! && d.year <= params.endYear!,
    );
  }
  return data;
};

// Tool: Weather Data (Mock)
const getWeatherData = async (params?: { city?: string }) => {
  const mockData: Record<string, any> = {
    london: { temp: 15, condition: "Rainy", humidity: 82 },
    "new york": { temp: 22, condition: "Sunny", humidity: 45 },
    tokyo: { temp: 28, condition: "Cloudy", humidity: 70 },
  };

  const city = params?.city?.toLowerCase() || "london";
  return mockData[city] || { temp: 20, condition: "Clear", humidity: 50, city };
};

/**
 * List of components that the AI can choose to render in the chat.
 */
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "Renders interactive charts (bar, line, pie) using Recharts. Perfect for visualizing data trends, comparisons, and distributions. Supports multiple datasets, custom colors, and responsive sizing.",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataCard",
    description:
      "Displays a set of key-value data points, statistics, or metrics in a card format. Useful for summaries, quick stats, or dashboard-like views.",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
];

/**
 * List of tools (functions) that the AI can call to fetch real-time data.
 */
export const tools: TamboTool[] = [
  {
    name: "globalPopulation",
    description:
      "Retrieves global population statistics by year with growth rates. Supports optional year range filtering (startYear, endYear). Returns array of year, population, and growthRate.",
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
  {
    name: "getWeather",
    description:
      "Fetches current weather data for a city including temperature, condition, and humidity.",
    tool: getWeatherData,
    inputSchema: z.object({
      city: z.string().optional(),
    }),
    outputSchema: z.object({
      temp: z.number(),
      condition: z.string(),
      humidity: z.number(),
      city: z.string().optional(),
    }),
  },
];
