/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import RecipeCard from "@/components/recipe-card";
import { Graph, graphSchema } from "@/components/tambo/graph";
import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import {
  getCountryPopulations,
  getGlobalPopulationTrend,
} from "@/services/population-stats";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { supabase } from "./supabase";
import { AnalyticsTable, AnalyticsTableSchema } from "@/components/analytics-card";

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
  {
    name: "get-available-ingredients",
    description:
      "Get a list of all the available ingredients that can be used in a recipe.",
    tool: () => [
      "pizza dough",
      "mozzarella cheese",
      "tomatoes",
      "basil",
      "olive oil",
      "chicken breast",
      "ground beef",
      "onions",
      "garlic",
      "bell peppers",
      "mushrooms",
      "pasta",
      "rice",
      "eggs",
      "bread",
    ],
    inputSchema: z.object({
      numberOfIngredients: z
        .number()
        .optional()
        .describe("The number of ingredients to return"),
    }),
    outputSchema: z.array(z.string()),
  },
  {
    name: "queryRecords",
    description:
      "Fetches analytics records from the database. Can optionally filter by category.",
    inputSchema: z.object({
      category: z
        .string()
        .optional()
        .describe(
          'The category of records to fetch (e.g., "sales", "users", "traffic")',
        ),
    }),
    outputSchema: z.object({
      records: z
        .array(z.any())
        .describe("The list of fetched analytics records"),
    }),
    tool: async ({ category }: { category?: string }) => {
      let query = supabase
        .from("analytics")
        .select("*")
        .order("created_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { records: data };
    },
  },
  {
    name: "updateRecord",
    description: "Updates an existing analytics record in the database.",
    inputSchema: z.object({
      id: z.string().describe("The ID of the record to update"),
      label: z.string().optional().describe("Updated label for the record"),
      value: z
        .number()
        .optional()
        .describe("Updated numeric value for the record"),
      category: z
        .string()
        .optional()
        .describe("Updated category for the record"),
    }),
    outputSchema: z.object({
      message: z.string().describe("Success message"),
      record: z.any().describe("The updated analytics record"),
    }),
    tool: async ({
      id,
      label,
      value,
      category,
    }: {
      id: string;
      label?: string;
      value?: number;
      category?: string;
    }) => {
      // Build update object with only provided fields
      const updateData: any = {};
      if (label !== undefined) updateData.label = label;
      if (value !== undefined) updateData.value = value;
      if (category !== undefined) updateData.category = category;

      if (Object.keys(updateData).length === 0) {
        throw new Error(
          "At least one field (label, value, or category) must be provided for update",
        );
      }

      const { data, error } = await supabase
        .from("analytics")
        .update(updateData)
        .eq("id", id)
        .select();

      if (error) {
        return {
          message: `Error updating record: ${error.message}`,
          record: null,
        };
      }

      if (!data || data.length === 0) {
        return {
          message: `Record with ID ${id} not found`,
          record: null,
        };
      }

      return {
        message: "Record updated successfully",
        record: data[0],
      };
    },
  },
  {
    name: "deleteRecord",
    description: "Deletes an analytics record from the database by ID.",
    inputSchema: z.object({
      id: z.string().describe("The ID of the record to delete"),
    }),
    outputSchema: z.object({
      message: z.string().describe("Success message"),
      deletedId: z.string().describe("The ID of the deleted record"),
    }),
    tool: async ({ id }: { id: string }) => {
      try {
        // Delete the record directly
        const { data, error } = await supabase
          .from("analytics")
          .delete()
          .eq("id", id)
          .select();

        if (error) {
          return {
            message: `Error deleting record: ${error.message}`,
            deletedId: id,
          };
        }

        if (!data || data.length === 0) {
          return {
            message: `Record with ID ${id} not found or already deleted`,
            deletedId: id,
          };
        }

        return {
          message: `Record with ID ${id} deleted successfully`,
          deletedId: id,
        };
      } catch (err: any) {
        return {
          message: `Error deleting record: ${err?.message || "Unknown error"}`,
          deletedId: id,
        };
      }
    },
  },
  {
    name: "addRecord",
    description: "Adds a new analytics record to the database.",
    inputSchema: z.object({
      label: z.string().describe("A descriptive label for the record"),
      value: z.number().describe("The numeric value for the record"),
      category: z
        .string()
        .describe(
          'The category for the record (e.g., "sales", "users", "traffic")',
        ),
    }),
    outputSchema: z.object({
      message: z.string().describe("Success message"),
      record: z.any().describe("The newly created analytics record"),
    }),
    tool: async ({
      label,
      value,
      category,
    }: {
      label: string;
      value: number;
      category: string;
    }) => {
      try {
        const { data, error } = await supabase
          .from("analytics")
          .insert([{ label, value, category }])
          .select();

        if (error) {
          return {
            message: `Error adding record: ${error.message}`,
            record: null,
          };
        }

        return {
          message: "Record added successfully",
          record: data?.[0] || null,
        };
      } catch (err: any) {
        return {
          message: `Error adding record: ${err?.message || "Unknown error"}`,
          record: null,
        };
      }
    },
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
  {
    name: "RecipeCard",
    description: "A component that renders a recipe card",
    component: RecipeCard,
    propsSchema: z.object({
      title: z.string().describe("The title of the recipe"),
      description: z.string().describe("The description of the recipe"),
      prepTime: z.number().describe("The prep time of the recipe in minutes"),
      cookTime: z.number().describe("The cook time of the recipe in minutes"),
      originalServings: z
        .number()
        .describe("The original servings of the recipe"),
      ingredients: z
        .array(
          z.object({
            name: z.string().describe("The name of the ingredient"),
            amount: z.number().describe("The amount of the ingredient"),
            unit: z.string().describe("The unit of the ingredient"),
          }),
        )
        .describe("The ingredients of the recipe"),
    }),
  },
  {
    name: "AnalyticsTable",
    description:
      "A component that displays analytics data in a table format with sorting and styling options.",
    component: AnalyticsTable,
    propsSchema: AnalyticsTableSchema,
  }
  // Add more components here
];
