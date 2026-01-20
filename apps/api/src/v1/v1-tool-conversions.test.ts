import {
  convertV1ToolToInternal,
  convertV1ToolsToInternal,
  convertV1ComponentToInternal,
  convertV1ComponentsToInternal,
} from "./v1-tool-conversions";
import type { V1ToolDto, V1AvailableComponentDto } from "./dto/tool.dto";

describe("v1-tool-conversions", () => {
  describe("convertV1ToolToInternal", () => {
    it("converts a simple tool with string parameters", () => {
      const v1Tool: V1ToolDto = {
        name: "get_weather",
        description: "Get the current weather",
        inputSchema: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "City name",
            },
          },
          required: ["location"],
        },
      };

      const result = convertV1ToolToInternal(v1Tool);

      expect(result.name).toBe("get_weather");
      expect(result.description).toBe("Get the current weather");
      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].name).toBe("location");
      expect(result.parameters[0].type).toBe("string");
      expect(result.parameters[0].description).toBe("City name");
      expect(result.parameters[0].isRequired).toBe(true);
    });

    it("converts a tool with multiple parameter types", () => {
      const v1Tool: V1ToolDto = {
        name: "search",
        description: "Search for items",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            limit: {
              type: "number",
              description: "Max results",
            },
            includeArchived: {
              type: "boolean",
              description: "Include archived items",
            },
          },
          required: ["query"],
        },
      };

      const result = convertV1ToolToInternal(v1Tool);

      expect(result.parameters).toHaveLength(3);

      const queryParam = result.parameters.find((p) => p.name === "query");
      expect(queryParam?.type).toBe("string");
      expect(queryParam?.isRequired).toBe(true);

      const limitParam = result.parameters.find((p) => p.name === "limit");
      expect(limitParam?.type).toBe("number");
      expect(limitParam?.isRequired).toBe(false);

      const archivedParam = result.parameters.find(
        (p) => p.name === "includeArchived",
      );
      expect(archivedParam?.type).toBe("boolean");
      expect(archivedParam?.isRequired).toBe(false);
    });

    it("converts a tool with enum values", () => {
      const v1Tool: V1ToolDto = {
        name: "set_unit",
        description: "Set the temperature unit",
        inputSchema: {
          type: "object",
          properties: {
            unit: {
              type: "string",
              enum: ["celsius", "fahrenheit", "kelvin"],
              description: "Temperature unit",
            },
          },
          required: ["unit"],
        },
      };

      const result = convertV1ToolToInternal(v1Tool);

      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].enumValues).toEqual([
        "celsius",
        "fahrenheit",
        "kelvin",
      ]);
    });

    it("converts a tool with array parameters", () => {
      const v1Tool: V1ToolDto = {
        name: "process_items",
        description: "Process a list of items",
        inputSchema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: { type: "string" },
              description: "List of item IDs",
            },
          },
          required: ["items"],
        },
      };

      const result = convertV1ToolToInternal(v1Tool);

      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].type).toBe("array");
      expect(result.parameters[0].items).toEqual({ type: "string" });
    });

    it("handles tool with no required parameters", () => {
      const v1Tool: V1ToolDto = {
        name: "get_all",
        description: "Get all items",
        inputSchema: {
          type: "object",
          properties: {
            filter: {
              type: "string",
              description: "Optional filter",
            },
          },
        },
      };

      const result = convertV1ToolToInternal(v1Tool);

      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].isRequired).toBe(false);
    });

    it("handles tool with empty properties", () => {
      const v1Tool: V1ToolDto = {
        name: "ping",
        description: "Ping the server",
        inputSchema: {
          type: "object",
          properties: {},
        },
      };

      const result = convertV1ToolToInternal(v1Tool);

      expect(result.parameters).toHaveLength(0);
    });

    it("handles non-object schema gracefully", () => {
      const v1Tool: V1ToolDto = {
        name: "simple",
        description: "A simple tool",
        inputSchema: {
          type: "string",
        } as unknown as object,
      };

      const result = convertV1ToolToInternal(v1Tool);

      expect(result.parameters).toHaveLength(0);
    });

    it("preserves original schema in parameter", () => {
      const v1Tool: V1ToolDto = {
        name: "complex",
        description: "Complex tool",
        inputSchema: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                nested: { type: "string" },
              },
            },
          },
        },
      };

      const result = convertV1ToolToInternal(v1Tool);

      expect(result.parameters[0].schema).toBeDefined();
      expect(result.parameters[0].schema).toEqual({
        type: "object",
        properties: {
          nested: { type: "string" },
        },
      });
    });
  });

  describe("convertV1ToolsToInternal", () => {
    it("returns undefined for undefined input", () => {
      expect(convertV1ToolsToInternal(undefined)).toBeUndefined();
    });

    it("returns undefined for empty array", () => {
      expect(convertV1ToolsToInternal([])).toBeUndefined();
    });

    it("converts multiple tools", () => {
      const tools: V1ToolDto[] = [
        {
          name: "tool1",
          description: "First tool",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "tool2",
          description: "Second tool",
          inputSchema: { type: "object", properties: {} },
        },
      ];

      const result = convertV1ToolsToInternal(tools);

      expect(result).toHaveLength(2);
      expect(result?.[0].name).toBe("tool1");
      expect(result?.[1].name).toBe("tool2");
    });
  });

  describe("convertV1ComponentToInternal", () => {
    it("converts a simple component", () => {
      const v1Component: V1AvailableComponentDto = {
        name: "WeatherCard",
        description: "Displays weather information",
        propsSchema: {
          type: "object",
          properties: {
            temperature: { type: "number" },
            location: { type: "string" },
          },
          required: ["temperature", "location"],
        },
      };

      const result = convertV1ComponentToInternal(v1Component);

      expect(result.name).toBe("WeatherCard");
      expect(result.description).toBe("Displays weather information");
      expect(result.contextTools).toEqual([]);
      expect(result.props).toEqual(v1Component.propsSchema);
    });

    it("handles component with stateSchema (ignored in conversion)", () => {
      const v1Component: V1AvailableComponentDto = {
        name: "Counter",
        description: "A counter component",
        propsSchema: {
          type: "object",
          properties: {
            initialValue: { type: "number" },
          },
        },
        stateSchema: {
          type: "object",
          properties: {
            count: { type: "number" },
          },
        },
      };

      const result = convertV1ComponentToInternal(v1Component);

      // stateSchema is not used in internal format currently
      expect(result.name).toBe("Counter");
      expect(result.contextTools).toEqual([]);
    });
  });

  describe("convertV1ComponentsToInternal", () => {
    it("returns undefined for undefined input", () => {
      expect(convertV1ComponentsToInternal(undefined)).toBeUndefined();
    });

    it("returns undefined for empty array", () => {
      expect(convertV1ComponentsToInternal([])).toBeUndefined();
    });

    it("converts multiple components", () => {
      const components: V1AvailableComponentDto[] = [
        {
          name: "Card",
          description: "A card component",
          propsSchema: { type: "object", properties: {} },
        },
        {
          name: "Chart",
          description: "A chart component",
          propsSchema: { type: "object", properties: {} },
        },
      ];

      const result = convertV1ComponentsToInternal(components);

      expect(result).toHaveLength(2);
      expect(result?.[0].name).toBe("Card");
      expect(result?.[1].name).toBe("Chart");
    });
  });
});
