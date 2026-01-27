import type { RunCreateParams } from "@tambo-ai/typescript-sdk/resources/threads/runs.js";

/**
 * Backend Tool Definitions
 * These definitions tell the AI which UI components it can render.
 * They match the names in `apps/web/src/tambo/registry.ts`.
 */
export const tools: RunCreateParams.Tool[] = [
  {
    name: "dataTable",
    description: "Display a professional table of structured data.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "The title of the table" },
        columns: {
          type: "array",
          items: { type: "string" },
          description: "Column headers",
        },
        rows: {
          type: "array",
          items: { type: "array", items: { type: "any" } },
          description: "Data rows as arrays of values",
        },
      },
      required: ["columns", "rows"],
    },
  },
  {
    name: "simpleChart",
    description: "Display a bar chart to visualize numerical trends.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Label for the chart" },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              value: { type: "number" },
            },
          },
          description: "Array of data points with label and value",
        },
      },
      required: ["data"],
    },
  },
  {
    name: "pricingTable",
    description: "Show a pricing plan card to the user.",
    inputSchema: {
      type: "object",
      properties: {
        planName: { type: "string" },
        price: { type: "string" },
        period: { type: "string", description: "e.g. /month or /year" },
        features: { type: "array", items: { type: "string" } },
        isPopular: { type: "boolean" },
        ctaText: { type: "string" },
      },
      required: ["planName", "price", "features"],
    },
  },
  {
    name: "notification",
    description: "Send a status alert or notification card.",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["success", "warning", "error", "info"] },
        title: { type: "string" },
        message: { type: "string" },
      },
      required: ["type", "title", "message"],
    },
  },
  {
    name: "taskList",
    description: "Display a list of actionable tasks.",
    inputSchema: {
      type: "object",
      properties: {
        initialTasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              text: { type: "string" },
              completed: { type: "boolean" },
            },
          },
        },
      },
    },
  },
];
