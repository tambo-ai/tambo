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
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";

import {
  executeDuckDBQuery,
  getAvailableTablesInfo,
  getTableStats,
} from "@/services/duckdb-query";
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
    name: "executeDuckDBQuery",
    description: "Execute a SQL query on the in-browser DuckDB instance",
    tool: executeDuckDBQuery,
    toolSchema: z
      .function()
      .args(
        z.object({
          sql: z.string().describe(" The SQL query to execute"),
          limit: z.number().optional().describe("Optional limit for the number of rows to return"),
        })
      )
      .returns(
        z.object({
          success: z.boolean(),
          data: z.array(z.record(z.any())).optional(),
          rowCount: z.number().optional(),
          error: z.string().optional(),
        })
      ),
  },
  {
    name: "getAvailableTablesInfo",
    description: "Get information about all available tables in DuckDB",
    tool: getAvailableTablesInfo,
    toolSchema: z
      .function()
      .returns(
        z.object({
          tables: z.array(
            z.object({
              tableName: z.string(),
              columns: z.array(
                z.object({
                  column_name: z.string(),
                  data_type: z.string(),
                })
              ),
              rowCount: z.number(),
            })
          ),
          totalTables: z.number(),
        })
      ),
  },
  {
    name: "getTableStats",
    description: "Get summary statistics for a specific table",
    tool: getTableStats,
    toolSchema: z
      .function()
      .args(
        z.object({
          tableName: z.string().describe("The name of the table to analyze"),
        })
      )
      .returns(
        z.object({
          success: z.boolean(),
          stats: z.array(z.record(z.any())).optional(),
          error: z.string().optional(),
        })
      ),
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
];
