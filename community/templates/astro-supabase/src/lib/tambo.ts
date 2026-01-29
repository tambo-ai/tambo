import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { DataTable, dataTableSchema } from "../components/tambo/DataTable";
import { Graph, graphSchema } from "../components/tambo/Graph";
import { supabase } from "./supabase";

// Register your components
export const components: TamboComponent[] = [
  {
    name: "DataTable",
    description:
      "Displays data from Supabase in a formatted table with columns and rows",
    component: DataTable,
    propsSchema: dataTableSchema,
  },
  {
    name: "Graph",
    description:
      "Renders interactive charts (bar, line, pie) for data visualization with customizable styling",
    component: Graph,
    propsSchema: graphSchema,
  },
];

// Register your tools (functions Tambo can call)
export const tools: TamboTool[] = [
  {
    name: "fetchUsers",
    description: "Fetches all users from the Supabase database",
    inputSchema: z.object({}),
    outputSchema: z.array(z.record(z.any())),
    tool: async () => {
      const { data, error } = await supabase.from("users").select("*");

      if (error) throw error;
      return data;
    },
  },
  {
    name: "addUser",
    description: "Adds a new user to the Supabase database",
    inputSchema: z.object({
      name: z.string().describe("User's full name"),
      email: z.string().email().describe("User's email address"),
    }),
    outputSchema: z.array(z.record(z.any())),
    tool: async (params: { name: string; email: string }) => {
      const { data, error } = await supabase
        .from("users")
        .insert([{ name: params.name, email: params.email }])
        .select();

      if (error) throw error;
      return data;
    },
  },
  {
    name: "getUserCount",
    description: "Gets the total count of users in the database",
    inputSchema: z.object({}),
    outputSchema: z.object({
      count: z.number(),
    }),
    tool: async () => {
      const { count, error } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return { count: count || 0 };
    },
  },
  {
    name: "deleteUser",
    description: "Deletes a user from the database by email",
    inputSchema: z.object({
      email: z.string().email().describe("Email of the user to delete"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
    tool: async (params: { email: string }) => {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("email", params.email);

      if (error) throw error;
      return {
        success: true,
        message: `User with email ${params.email} deleted successfully`,
      };
    },
  },
];
