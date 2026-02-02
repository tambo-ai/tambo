import type { TamboTool } from "../types.js";

/**
 * Type helper for defining a Tambo tool with proper type inference.
 *
 * Tambo uses the standard-schema.dev spec which means you can use any
 * Standard Schema compliant validator (Zod 3.25+, Zod 4.x, Valibot, ArkType, etc.).
 * @param tool - The tool definition
 * @returns The same tool definition with proper types
 * @example
 * ```typescript
 * import { z } from "zod";
 * import { defineTool } from "@tambo-ai/svelte";
 *
 * const weatherTool = defineTool({
 *   name: "get_weather",
 *   description: "Get current weather for a location",
 *   tool: async ({ location }) => {
 *     // Implementation
 *     return { temperature: 72, conditions: "sunny" };
 *   },
 *   inputSchema: z.object({
 *     location: z.string().describe("City name"),
 *   }),
 *   outputSchema: z.object({
 *     temperature: z.number(),
 *     conditions: z.string(),
 *   }),
 * });
 * ```
 */
export function defineTool<T extends TamboTool>(tool: T): T {
  // Provide default schemas if not specified
  const result = { ...tool };

  if (!result.inputSchema) {
    result.inputSchema = { type: "object", properties: {}, required: [] };
  }

  if (!result.outputSchema) {
    result.outputSchema = { type: "object", properties: {}, required: [] };
  }

  return result as T;
}

/**
 * Validate that a component or tool name follows naming conventions
 * @param name - Name to validate
 * @param type - Type of entity (for error messages)
 */
export function assertValidName(
  name: string,
  type: "component" | "tool",
): void {
  if (!name || typeof name !== "string") {
    throw new Error(`${type} name must be a non-empty string`);
  }

  // Check for valid characters (alphanumeric, underscores, hyphens)
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
    throw new Error(
      `${type} name "${name}" is invalid. Names must start with a letter and contain only alphanumeric characters, underscores, and hyphens.`,
    );
  }

  // Check length
  if (name.length > 60) {
    throw new Error(
      `${type} name "${name}" is too long. Names must be 60 characters or less.`,
    );
  }
}
