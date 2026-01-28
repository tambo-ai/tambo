/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 * 
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 */

import { UserCard, userCardSchema } from "../components/tambo/UserCard";
import { z } from "zod";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { defineTool } from "@tambo-ai/react";

/**
 * components
 * 
 * This array contains all the Tambo components that are registered for use within the application.
 * Each component is defined with its name, description, and expected props. The components
 * can be controlled by AI to dynamically render UI elements based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "UserCard",
    description:
      "A professional user card component for displaying or creating user profiles. Use this to render a user card with the provided name, email, role, company, and status. When someone asks to 'create a user card for [name]', generate this component directly with the requested name and reasonable placeholder values for email (name.formatted@example.com), role, and company. Always render this component when a user card is requested.",
    component: UserCard,
    propsSchema: userCardSchema,
  },
];

/**
 * tools
 * 
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * can be controlled by AI to dynamically fetch data based on user interactions.
 */
export const tools: TamboTool[] = [
  defineTool({
    name: "getUserInfo",
    description:
      "Optional tool to look up existing user information by email or name. Returns user details if found, or null if not found. If null is returned, the AI should generate a UserCard component directly with the user-provided name.",
    inputSchema: z.object({
      email: z
        .string()
        .email()
        .optional()
        .describe("Email address of the user to look up"),
      name: z.string().optional().describe("Name of the user to look up"),
    }),
    outputSchema: z.object({
      name: z.string().describe("User's full name"),
      email: z.string().email().describe("User's email address"),
      role: z.string().describe("User's job role or position"),
      company: z.string().describe("Company the user works for"),
      status: z
        .enum(["active", "away", "offline"])
        .describe("User's current status"),
    }),
    tool: async (params) => {
      // Example mock data for demonstration
      const mockUsers = [
        {
          name: "Sarah Johnson",
          email: "sarah.johnson@example.com",
          role: "Senior Developer",
          company: "Tech Corp",
          status: "active" as const,
        },
        {
          name: "John Doe",
          email: "john.doe@example.com",
          role: "Product Manager",
          company: "Acme Inc",
          status: "active" as const,
        },
        {
          name: "Mike Chen",
          email: "mike.chen@example.com",
          role: "UX Designer",
          company: "Design Studio",
          status: "away" as const,
        },
      ];

      // Simple search logic
      if (params?.email) {
        return mockUsers.find((u) => u.email.includes(params.email!)) || mockUsers[0];
      }
      if (params?.name) {
        return (
          mockUsers.find((u) =>
            u.name.toLowerCase().includes(params.name!.toLowerCase())
          ) || mockUsers[0]
        );
      }

      return null;
    },
  }),
];
