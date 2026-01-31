import { z } from "zod";
import type { TamboTool } from "../../model/component-metadata";
import {
  executeClientTool,
  executeAllPendingTools,
  type PendingToolCall,
} from "./tool-executor";

describe("tool-executor", () => {
  describe("executeClientTool", () => {
    it("executes a tool and returns text result", async () => {
      const tool: TamboTool = {
        name: "get_weather",
        description: "Gets weather",
        tool: async ({ city }: { city: string }) =>
          `Weather in ${city} is sunny`,
        inputSchema: z.object({ city: z.string() }),
        outputSchema: z.string(),
      };

      const result = await executeClientTool(tool, "call-1", {
        city: "Seattle",
      });

      expect(result).toEqual({
        type: "tool_result",
        toolUseId: "call-1",
        content: [{ type: "text", text: "Weather in Seattle is sunny" }],
      });
    });

    it("stringifies non-string results", async () => {
      const tool: TamboTool = {
        name: "get_data",
        description: "Gets data",
        tool: async () => ({ value: 42 }),
        inputSchema: z.object({}),
        outputSchema: z.object({ value: z.number() }),
      };

      const result = await executeClientTool(tool, "call-2", {});

      expect(result).toEqual({
        type: "tool_result",
        toolUseId: "call-2",
        content: [{ type: "text", text: '{"value":42}' }],
      });
    });

    it("uses transformToContent when provided", async () => {
      const tool: TamboTool = {
        name: "custom_tool",
        description: "Custom tool",
        tool: async () => "custom result",
        inputSchema: z.object({}),
        outputSchema: z.string(),
        transformToContent: (result) => [
          { type: "text", text: `Transformed: ${result}` },
        ],
      };

      const result = await executeClientTool(tool, "call-3", {});

      expect(result).toEqual({
        type: "tool_result",
        toolUseId: "call-3",
        content: [{ type: "text", text: "Transformed: custom result" }],
      });
    });

    it("handles transformToContent with non-text types by stringifying", async () => {
      const tool: TamboTool = {
        name: "image_tool",
        description: "Image tool",
        tool: async () => "image data",
        inputSchema: z.object({}),
        outputSchema: z.string(),
        transformToContent: () => [
          {
            type: "image_url",
            image_url: { url: "https://example.com/image.png" },
          },
        ],
      };

      const result = await executeClientTool(tool, "call-4", {});

      expect(result).toEqual({
        type: "tool_result",
        toolUseId: "call-4",
        content: [
          {
            type: "text",
            text: '{"type":"image_url","image_url":{"url":"https://example.com/image.png"}}',
          },
        ],
      });
    });

    it("handles tool execution errors gracefully", async () => {
      const tool: TamboTool = {
        name: "failing_tool",
        description: "A tool that fails",
        tool: async () => {
          throw new Error("Tool failed!");
        },
        inputSchema: z.object({}),
        outputSchema: z.void(),
      };

      const result = await executeClientTool(tool, "call-5", {});

      expect(result).toEqual({
        type: "tool_result",
        toolUseId: "call-5",
        content: [{ type: "text", text: "Tool failed!" }],
      });
    });

    it("handles non-Error throws gracefully", async () => {
      const tool: TamboTool = {
        name: "throwing_tool",
        description: "A tool that throws a string",
        tool: async () => {
          throw "string error";
        },
        inputSchema: z.object({}),
        outputSchema: z.void(),
      };

      const result = await executeClientTool(tool, "call-6", {});

      expect(result).toEqual({
        type: "tool_result",
        toolUseId: "call-6",
        content: [{ type: "text", text: "Tool execution failed" }],
      });
    });
  });

  describe("executeAllPendingTools", () => {
    it("executes multiple tools with Map registry", async () => {
      const registry = new Map<string, TamboTool>([
        [
          "add",
          {
            name: "add",
            description: "Adds numbers",
            tool: async ({ a, b }: { a: number; b: number }) => a + b,
            inputSchema: z.object({ a: z.number(), b: z.number() }),
            outputSchema: z.number(),
          },
        ],
        [
          "multiply",
          {
            name: "multiply",
            description: "Multiplies numbers",
            tool: async ({ a, b }: { a: number; b: number }) => a * b,
            inputSchema: z.object({ a: z.number(), b: z.number() }),
            outputSchema: z.number(),
          },
        ],
      ]);

      const toolCalls = new Map<string, PendingToolCall>([
        ["call-1", { name: "add", input: { a: 2, b: 3 } }],
        ["call-2", { name: "multiply", input: { a: 4, b: 5 } }],
      ]);

      const results = await executeAllPendingTools(toolCalls, registry);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        type: "tool_result",
        toolUseId: "call-1",
        content: [{ type: "text", text: "5" }],
      });
      expect(results[1]).toEqual({
        type: "tool_result",
        toolUseId: "call-2",
        content: [{ type: "text", text: "20" }],
      });
    });

    it("executes tools with Record registry", async () => {
      const registry: Record<string, TamboTool> = {
        greet: {
          name: "greet",
          description: "Greets user",
          tool: async ({ name }: { name: string }) => `Hello, ${name}!`,
          inputSchema: z.object({ name: z.string() }),
          outputSchema: z.string(),
        },
      };

      const toolCalls = new Map<string, PendingToolCall>([
        ["call-1", { name: "greet", input: { name: "World" } }],
      ]);

      const results = await executeAllPendingTools(toolCalls, registry);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        type: "tool_result",
        toolUseId: "call-1",
        content: [{ type: "text", text: "Hello, World!" }],
      });
    });

    it("returns error result for unknown tools", async () => {
      const registry = new Map<string, TamboTool>();

      const toolCalls = new Map<string, PendingToolCall>([
        ["call-1", { name: "unknown_tool", input: {} }],
      ]);

      const results = await executeAllPendingTools(toolCalls, registry);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        type: "tool_result",
        toolUseId: "call-1",
        content: [
          { type: "text", text: 'Tool "unknown_tool" not found in registry' },
        ],
      });
    });

    it("handles mixed known and unknown tools", async () => {
      const registry = new Map<string, TamboTool>([
        [
          "known",
          {
            name: "known",
            description: "Known tool",
            tool: async () => "success",
            inputSchema: z.object({}),
            outputSchema: z.string(),
          },
        ],
      ]);

      const toolCalls = new Map<string, PendingToolCall>([
        ["call-1", { name: "known", input: {} }],
        ["call-2", { name: "unknown", input: {} }],
      ]);

      const results = await executeAllPendingTools(toolCalls, registry);

      expect(results).toHaveLength(2);
      expect(results[0].content[0]).toEqual({ type: "text", text: "success" });
      expect(results[1].content[0]).toEqual({
        type: "text",
        text: 'Tool "unknown" not found in registry',
      });
    });
  });
});
