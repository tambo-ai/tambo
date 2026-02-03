import { z } from "zod";
import type {
  RegisteredComponent,
  TamboTool,
} from "../../model/component-metadata.js";
import {
  toAvailableComponent,
  toAvailableComponents,
  toAvailableTool,
  toAvailableTools,
} from "./registry-conversion.js";

describe("registry-conversion", () => {
  describe("toAvailableComponent", () => {
    it("converts a component with props (JSON Schema)", () => {
      // RegisteredComponent has props already converted to JSON Schema
      const component: RegisteredComponent = {
        name: "WeatherCard",
        description: "Displays weather information",
        component: () => null,
        props: {
          type: "object",
          properties: {
            city: { type: "string" },
            temperature: { type: "number" },
          },
          required: ["city", "temperature"],
        },
        contextTools: [],
      };

      const result = toAvailableComponent(component);

      expect(result.name).toBe("WeatherCard");
      expect(result.description).toBe("Displays weather information");
      expect(result.propsSchema).toBeDefined();
      expect((result.propsSchema as Record<string, unknown>).type).toBe(
        "object",
      );
    });

    it("throws when props is missing", () => {
      const component = {
        name: "BadComponent",
        description: "Missing schema",
        component: () => null,
        contextTools: [],
      } as unknown as RegisteredComponent;

      expect(() => toAvailableComponent(component)).toThrow(
        'Component "BadComponent" missing props',
      );
    });
  });

  describe("toAvailableComponents", () => {
    it("converts a Record of components", () => {
      const components: Record<string, RegisteredComponent> = {
        Card: {
          name: "Card",
          description: "A card component",
          component: () => null,
          props: {
            type: "object",
            properties: { title: { type: "string" } },
            required: ["title"],
          },
          contextTools: [],
        },
        Button: {
          name: "Button",
          description: "A button component",
          component: () => null,
          props: {
            type: "object",
            properties: { label: { type: "string" } },
            required: ["label"],
          },
          contextTools: [],
        },
      };

      const result = toAvailableComponents(components);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.name)).toContain("Card");
      expect(result.map((c) => c.name)).toContain("Button");
    });

    it("converts a Map of components", () => {
      const components = new Map<string, RegisteredComponent>([
        [
          "Card",
          {
            name: "Card",
            description: "A card",
            component: () => null,
            props: {
              type: "object",
              properties: { title: { type: "string" } },
              required: ["title"],
            },
            contextTools: [],
          },
        ],
      ]);

      const result = toAvailableComponents(components);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Card");
    });

    it("skips invalid components and logs warning", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      const components: Record<string, RegisteredComponent> = {
        Valid: {
          name: "Valid",
          description: "Valid component",
          component: () => null,
          props: {
            type: "object",
            properties: { x: { type: "string" } },
            required: ["x"],
          },
          contextTools: [],
        },
        Invalid: {
          name: "Invalid",
          description: "Missing schema",
          component: () => null,
          contextTools: [],
        } as unknown as RegisteredComponent,
      };

      const result = toAvailableComponents(components);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Valid");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping component "Invalid"'),
      );

      warnSpy.mockRestore();
    });
  });

  describe("toAvailableTool", () => {
    it("converts a tool with inputSchema", () => {
      const tool: TamboTool = {
        name: "get_weather",
        description: "Gets weather for a city",
        tool: async () => ({ temp: 72 }),
        inputSchema: z.object({ city: z.string() }),
        outputSchema: z.any(),
      };

      const result = toAvailableTool(tool);

      expect(result.name).toBe("get_weather");
      expect(result.description).toBe("Gets weather for a city");
      expect(result.inputSchema).toBeDefined();
      expect((result.inputSchema as Record<string, unknown>).type).toBe(
        "object",
      );
    });

    it("throws when schema is missing", () => {
      const tool = {
        name: "bad_tool",
        description: "Missing schema",
        tool: async () => ({}),
      } as unknown as TamboTool;

      expect(() => toAvailableTool(tool)).toThrow(
        'Tool "bad_tool" missing inputSchema or toolSchema',
      );
    });
  });

  describe("toAvailableTools", () => {
    it("converts a Record of tools", () => {
      const tools: Record<string, TamboTool> = {
        search: {
          name: "search",
          description: "Search the web",
          tool: async () => [],
          inputSchema: z.object({ query: z.string() }),
          outputSchema: z.any(),
        },
        calculate: {
          name: "calculate",
          description: "Calculate expression",
          tool: async () => 0,
          inputSchema: z.object({ expr: z.string() }),
          outputSchema: z.any(),
        },
      };

      const result = toAvailableTools(tools);

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name)).toContain("search");
      expect(result.map((t) => t.name)).toContain("calculate");
    });

    it("converts a Map of tools", () => {
      const tools = new Map<string, TamboTool>([
        [
          "fetch",
          {
            name: "fetch",
            description: "Fetch data",
            tool: async () => null,
            inputSchema: z.object({ url: z.string() }),
            outputSchema: z.any(),
          },
        ],
      ]);

      const result = toAvailableTools(tools);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("fetch");
    });

    it("skips invalid tools and logs warning", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      const tools: Record<string, TamboTool> = {
        valid: {
          name: "valid",
          description: "Valid tool",
          tool: async () => null,
          inputSchema: z.object({ x: z.number() }),
          outputSchema: z.any(),
        },
        invalid: {
          name: "invalid",
          description: "Missing schema",
          tool: async () => null,
        } as unknown as TamboTool,
      };

      const result = toAvailableTools(tools);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("valid");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping tool "invalid"'),
      );

      warnSpy.mockRestore();
    });
  });
});
