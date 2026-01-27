import type { RunCreateParams } from "@tambo-ai/typescript-sdk/resources/threads/runs.js";

/**
 * Backend Tool Definitions
 * These definitions tell the AI which UI components it can render.
 * They match the names in `apps/web/src/tambo/registry.ts`.
 */
export const tools: RunCreateParams.Tool[] = [
  {
    name: "chart",
    description: "Display a visual chart to the user.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "The title of the chart" },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              value: { type: "number" },
            },
          },
          description: "Data points for the chart",
        },
        type: {
          type: "string",
          enum: ["bar", "line", "area"],
          description: "Type of chart",
        },
      },
      required: ["data"],
    },
  },
  {
    name: "todo",
    description: "Create a todo list.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        initialItems: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              text: { type: "string" },
              completed: { type: "boolean" },
            },
            required: ["id", "text", "completed"],
          },
        },
      },
      required: ["title"],
    },
  },
];
