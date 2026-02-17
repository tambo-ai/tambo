/**
 * Tool registry for client-side tool registration and execution
 */

import { zodToJsonSchema } from "zod-to-json-schema";
import type { ToolDefinition, ToolResult } from "./types.js";

export interface ToolRegistry {
  /** Register a tool */
  register<TInput, TOutput>(tool: ToolDefinition<TInput, TOutput>): void;
  /** Check if a tool is registered */
  has(name: string): boolean;
  /** Execute a tool by name with raw JSON args string */
  execute(
    name: string,
    toolUseId: string,
    rawArgs: string,
  ): Promise<ToolResult>;
  /** Convert registered tools to API format (JSON Schema) */
  toApiFormat(): Array<{
    name: string;
    description: string;
    inputSchema: unknown;
    outputSchema?: unknown;
  }>;
  /** Remove all registered tools */
  clear(): void;
}

/**
 * Create a tool registry for registering and executing client-side tools
 *
 * @returns ToolRegistry instance
 */
export function createToolRegistry(): ToolRegistry {
  const tools = new Map<string, ToolDefinition>();

  return {
    register(tool) {
      if (tools.has(tool.name)) {
        throw new Error(`Tool "${tool.name}" is already registered`);
      }
      tools.set(tool.name, tool as ToolDefinition);
    },

    has(name) {
      return tools.has(name);
    },

    async execute(name, toolUseId, rawArgs) {
      const tool = tools.get(name);
      if (!tool) {
        return {
          toolUseId,
          content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
          isError: true,
        };
      }

      try {
        const parsed = JSON.parse(rawArgs) as unknown;
        const validated = tool.inputSchema.parse(parsed);
        const result = await tool.execute(validated);
        return {
          toolUseId,
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          toolUseId,
          content: [{ type: "text" as const, text: message }],
          isError: true,
        };
      }
    },

    toApiFormat() {
      return [...tools.values()].map((tool) => ({
        name: tool.name,
        description: tool.description,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- infinitely deep type issue with zod schemas
        inputSchema: zodToJsonSchema(tool.inputSchema as any) as unknown,
        ...(tool.outputSchema
          ? {
              outputSchema: zodToJsonSchema(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- infinitely deep type issue with zod schemas
                tool.outputSchema as any,
              ) as unknown,
            }
          : {}),
      }));
    },

    clear() {
      tools.clear();
    },
  };
}
