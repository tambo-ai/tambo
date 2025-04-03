/**
 * Template for the tambo.ts file
 * This template will be used to generate a tambo.ts file with empty registries
 */

export const tamboTsTemplate = `/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 * 
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 * 
 * Read more about Tambo at https://tambo.co/docs
 */

import type { TamboComponent } from "@tambo-ai/react";


/**
 * Components Array - A collection of Tambo components to register
 * 
 * Components represent UI elements that can be generated or controlled by AI.
 * Register your custom components here to make them available to the AI.
 * 
 * Example of adding a component:
 * 
 * \`\`\`typescript
 * import { z } from "zod";
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
 * \`\`\`
 */
export const components: TamboComponent[] = [];
`;
