/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * How it works:
 * 1. Components are registered here with their Zod schemas
 * 2. TamboProvider makes them available to the AI runtime
 * 3. AI decides when to render components based on user intent (runtime-driven UI)
 * 4. Props are validated via Zod schemas before rendering (type safety)
 * 5. Components render inline with streaming chat messages
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import {
  ShowUserProfile,
  showUserProfileSchema,
} from "@/components/tambo/show-user-profile";
import type { TamboComponent } from "@tambo-ai/react";

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * can be controlled by AI to dynamically fetch data based on user interactions.
 *
 * Tools are functions that the AI can call to perform actions.
 * Unlike components (which render UI), tools execute side effects.
 *
 * Example tools might include:
 * - Sending emails
 * - Creating database records
 * - Calling external APIs
 * - Performing calculations
 *
 * All tools are authenticated via the userToken passed to TamboProvider.
 */
export const tools = [];

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 * Each component is defined with its name, description, and expected props. The components
 * can be controlled by AI to dynamically render UI elements based on user interactions.
 *
 * Key points:
 * - AI decides when to render components (runtime-driven UI)
 * - Props are validated via Zod schemas before rendering
 * - Components render inline with streaming chat messages
 * - All components have access to authenticated user context
 */
export const components: TamboComponent[] = [
  {
    name: "ShowUserProfile",
    description:
      "Displays the current authenticated user's profile information from Clerk, including User ID and email address. Use this when the user asks to see their profile, user info, account details, or wants to know their user ID or email.",
    component: ShowUserProfile,
    propsSchema: showUserProfileSchema,
  },
  // Add more components here
];
