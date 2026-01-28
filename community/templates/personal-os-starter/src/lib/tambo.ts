/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import {
  GithubWidget,
  githubWidgetSchema,
  NewsWidget,
  newsWidgetSchema,
  TimerWidget,
  timerWidgetSchema,
} from "@/components/tambo/more-widgets";
import {
  MusicWidget,
  musicWidgetSchema,
  StatsWidget,
  statsWidgetSchema,
  TasksWidget,
  tasksWidgetSchema,
  WeatherWidget,
  weatherWidgetSchema,
} from "@/components/tambo/widgets";
import {
  getCountryPopulations,
  getGlobalPopulationTrend,
} from "@/services/population-stats";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

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
    name: "WeatherWidget",
    description: "Displays current weather for a specific city.",
    component: WeatherWidget,
    propsSchema: weatherWidgetSchema,
  },
  {
    name: "TasksWidget",
    description: "A checklist of tasks to do.",
    component: TasksWidget,
    propsSchema: tasksWidgetSchema,
  },
  {
    name: "MusicWidget",
    description: "A music player widget showing current song and artist.",
    component: MusicWidget,
    propsSchema: musicWidgetSchema,
  },
  {
    name: "StatsWidget",
    description:
      "A stat card for displaying a single metric like 'Revenue' or 'Followers'.",
    component: StatsWidget,
    propsSchema: statsWidgetSchema,
  },
  {
    name: "GithubWidget",
    description:
      "Displays GitHub repository status, including PRs and commit counts.",
    component: GithubWidget,
    propsSchema: githubWidgetSchema,
  },
  {
    name: "TimerWidget",
    description: "A countdown or focus timer.",
    component: TimerWidget,
    propsSchema: timerWidgetSchema,
  },
  {
    name: "NewsWidget",
    description: "Displays a news headline with source and category.",
    component: NewsWidget,
    propsSchema: newsWidgetSchema,
  },
];
