/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * IMPORTANT: If you have components in different directories (e.g., both ui/ and tambo/),
 * make sure all import paths are consistent. Run 'npx tambo migrate' to consolidate.
 *
 * Read more about Tambo at https://docs.tambo.co
 */

import { AddUserForm } from "@/components/tambo/add-user-form";
import { ChartBarLabelCustom } from "@/components/ui/chart-bar";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod/v4";

// this is an interface aligned with the prisma schema
interface UserWithPosts {
  id: number;
  name: string | null;
  email: string;
  posts: Array<{ id: number }>;
}

async function getUsersData() {
  console.log("getUsersData function called");
  try {
    const response = await fetch("/api/getUser");
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }
    const users: UserWithPosts[] = await response.json();

    // Map the data to match the BarChart props
    const chartData = users.map((user) => ({
      User: user.name || user.email,
      Posts: user.posts.length,
    }));

    // Return the data in the format expected by ChartBarLabelCustom component
    return {
      data: chartData,
      title: "User Posts Summary",
      description: "Total posts per user",
    };
  } catch (error) {
    console.error("Error fetching users data:", error);
    return {
      data: [],
      title: "Error",
      description: "Failed to fetch data",
    };
  }
}

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * can be controlled by AI to dynamically fetch data based on user interactions.
 */

export const tools: TamboTool[] = [
  {
    name: "getUsersData",
    description:
      "Fetches the summary of posts for each user. Returns data formatted for displaying in a bar chart showing user names and their post counts. After calling this tool, you MUST render the BarChart component with the returned data. Use this when the user asks for a summary of users, user table summary, or wants to see user statistics.",
    tool: getUsersData,
    inputSchema: z.object({}),
    outputSchema: z.object({
      data: z
        .array(
          z.object({
            User: z.string(),
            Posts: z.number(),
          }),
        )
        .describe("Array of user data with their post counts"),
    }),
  },
];

/**
 * Components Array - A collection of Tambo components to register
 *
 * Components represent UI elements that can be generated or controlled by AI.
 * Register your custom components here to make them available to the AI.
 *
 * Example of adding a component:
 *
 * ```typescript
 * import { z } from "zod/v4";
 * import { CustomChart } from "../components/ui/custom-chart";
 *
 * // Define and add your component
 * export const components: TamboComponent[] = [
 *   {
 *     name: "CustomChart",
 *     description: "Renders a custom chart with the provided data",
 *     component: CustomChart,
 *     propsSchema: z.object({
 *       data: z.array(z.number()),
 *       title: z.string().optional(),
 *     })
 *   }
 * ];
 * ```
 */
export const components: TamboComponent[] = [
  {
    name: "BarChart",
    description:
      "Renders a bar chart displaying user statistics. Use this component to visualize user data with their post counts. Always use this component when displaying user summary data, user table summaries, or user statistics. The component accepts an array of user data with User names and Posts counts, along with optional title and description. When you receive data from getUsersData tool, immediately render this BarChart component with that data.",
    component: ChartBarLabelCustom,
    propsSchema: z.object({
      data: z
        .array(
          z.object({
            User: z.string().describe("User name"),
            Posts: z.number().describe("Number of posts"),
          }),
        )
        .describe("Array of user data with User names and Posts counts"),
      title: z.string().optional().describe("Optional chart title"),
      description: z.string().optional().describe("Optional chart description"),
    }),
  },
  {
    name: "AddUserForm",
    description:
      "MANDATORY RENDERING: When user says 'wanted to add data into users table', 'add data into the user', 'add some data into users table', 'add data into users', 'create a new user', 'add user information', 'insert user data', 'add user', or ANY request to add/create/insert user data - you MUST IMMEDIATELY call show_component_AddUserForm with empty props {}. DO NOT just describe or mention the form - you MUST actually render it. This form allows adding a user with email (required), name (optional, placeholder: 'user.name'), and their first post with title (required), content (optional), and published status (checkbox). The form submits to /api/addUser and handles all validation. Render it NOW when user wants to add data.",
    component: AddUserForm,
    propsSchema: z.object({}),
  },
];

// Import your custom components that utilize the Tambo SDK
// import { CustomChart } from "../components/tambo/custom-chart";
