/**
 * Tests for getParametersFromToolSchema via mapTamboToolToContextTool.
 *
 * These tests verify that tool schemas are correctly converted to parameter specifications:
 *
 * **New interface (inputSchema)**:
 * - inputSchema should be an object schema (Zod object, Valibot object, JSON Schema object)
 * - Returns an array of parameters extracted from the object's properties
 * - Tool function receives single object argument: tool({ name: "...", age: 30 })
 *
 * **Deprecated interface (toolSchema)**:
 * - toolSchema uses z.function().args(...) pattern
 * - Returns positional parameters: param1, param2, etc.
 * - Tool function receives spread arguments: tool(value1, value2)
 */
import type { JSONSchema7 } from "json-schema";
import * as z3 from "zod/v3";
import * as z4 from "zod/v4";
import { createMockTool, createMockToolWithToolSchema } from "../testing/tools";
import {
  adaptToolFromFnSchema,
  getUnassociatedTools,
  mapTamboToolToContextTool,
} from "./registry";

describe("getParametersFromToolSchema (via mapTamboToolToContextTool)", () => {
  describe("Deprecated toolSchema interface (Zod function schemas)", () => {
    it("should handle tool with toolSchema", () => {
      const tool = createMockToolWithToolSchema(
        z3.function().args(z3.string().describe("The name")).returns(z3.void()),
        3,
      );
      const result = mapTamboToolToContextTool(tool);
      // Should have at least one parameter (either extracted or wrapped)
      expect(result.parameters.length).toBeGreaterThanOrEqual(1);
      expect(result.name).toBe("testTool");
      expect(result.description).toBe("A test tool");
      expect(result.maxCalls).toBe(3);
    });

    it("should handle toolSchema with multiple args", () => {
      const tool = createMockToolWithToolSchema(
        z3
          .function()
          .args(
            z3.string().describe("First name"),
            z3.number().describe("Age"),
            z3.boolean().describe("Is active"),
          )
          .returns(z3.void()),
      );
      const result = mapTamboToolToContextTool(tool);
      // Should have parameters (extraction depends on JSON Schema conversion)
      expect(result.parameters.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("New inputSchema interface (object schemas)", () => {
    describe("Zod 4 object schemas", () => {
      it("should extract parameters from object schema properties", () => {
        const tool = createMockTool({
          inputSchema: z4.object({
            name: z4.string().describe("User name"),
            age: z4.number().describe("User age"),
          }),
          outputSchema: z4.boolean(),
          maxCalls: 10,
        });
        const result = mapTamboToolToContextTool(tool);
        expect(result.maxCalls).toBe(10);
        expect(result.parameters).toHaveLength(2);

        // Parameters should be extracted from object properties
        const nameParam = result.parameters.find((p) => p.name === "name");
        const ageParam = result.parameters.find((p) => p.name === "age");

        expect(nameParam).toBeDefined();
        expect(nameParam?.type).toBe("string");
        expect(nameParam?.description).toBe("User name");
        expect(nameParam?.isRequired).toBe(true);

        expect(ageParam).toBeDefined();
        expect(ageParam?.type).toBe("number");
        expect(ageParam?.description).toBe("User age");
        expect(ageParam?.isRequired).toBe(true);

        expect(result.parameters).toMatchSnapshot();
      });

      it("should handle complex nested objects", () => {
        const tool = createMockTool({
          inputSchema: z4.object({
            point: z4.object({ x: z4.number(), y: z4.number() }),
            tags: z4.array(z4.string()),
            color: z4.enum(["red", "green", "blue"]),
          }),
          outputSchema: z4.void(),
        });
        const result = mapTamboToolToContextTool(tool);
        expect(result.parameters).toHaveLength(3);

        const pointParam = result.parameters.find((p) => p.name === "point");
        const tagsParam = result.parameters.find((p) => p.name === "tags");
        const colorParam = result.parameters.find((p) => p.name === "color");

        expect(pointParam).toBeDefined();
        expect(pointParam?.type).toBe("object");

        expect(tagsParam).toBeDefined();
        expect(tagsParam?.type).toBe("array");

        expect(colorParam).toBeDefined();
        expect(colorParam?.type).toBe("string");

        expect(result.parameters).toMatchSnapshot();
      });
    });

    describe("Zod 3 object schemas", () => {
      it("should extract parameters from object schema properties", () => {
        const tool = createMockTool({
          inputSchema: z3.object({
            name: z3.string().describe("User name"),
            age: z3.number().describe("User age"),
          }),
          outputSchema: z3.boolean(),
        });
        const result = mapTamboToolToContextTool(tool);
        expect(result.parameters).toHaveLength(2);

        const nameParam = result.parameters.find((p) => p.name === "name");
        const ageParam = result.parameters.find((p) => p.name === "age");

        expect(nameParam).toBeDefined();
        expect(nameParam?.type).toBe("string");
        expect(nameParam?.isRequired).toBe(true);

        expect(ageParam).toBeDefined();
        expect(ageParam?.type).toBe("number");
        expect(ageParam?.isRequired).toBe(true);

        expect(result.parameters).toMatchSnapshot();
      });
    });

    describe("JSON Schema object schemas", () => {
      it("should extract parameters from object schema properties", () => {
        const schema: JSONSchema7 = {
          type: "object",
          properties: {
            name: { type: "string", description: "User name" },
            age: { type: "number", description: "User age" },
          },
          required: ["name"],
          description: "User data",
        };
        const tool = createMockTool({ inputSchema: schema, outputSchema: {} });
        const result = mapTamboToolToContextTool(tool);
        expect(result.parameters).toHaveLength(2);

        const nameParam = result.parameters.find((p) => p.name === "name");
        const ageParam = result.parameters.find((p) => p.name === "age");

        expect(nameParam).toBeDefined();
        expect(nameParam?.type).toBe("string");
        expect(nameParam?.description).toBe("User name");
        expect(nameParam?.isRequired).toBe(true);

        expect(ageParam).toBeDefined();
        expect(ageParam?.type).toBe("number");
        expect(ageParam?.description).toBe("User age");
        expect(ageParam?.isRequired).toBe(false);

        expect(result.parameters).toMatchSnapshot();
      });

      it("should handle empty object schema", () => {
        const schema: JSONSchema7 = {
          type: "object",
          properties: {},
        };
        const tool = createMockTool({ inputSchema: schema, outputSchema: {} });
        const result = mapTamboToolToContextTool(tool);
        expect(result.parameters).toHaveLength(0);
      });
    });
  });

  describe("Direct schema (shorthand for inputSchema)", () => {
    it("should accept Zod 4 object schema directly and extract parameters", () => {
      const tool = createMockTool(
        z4.object({
          name: z4.string(),
          age: z4.number(),
        }),
      );
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toHaveLength(2);

      const nameParam = result.parameters.find((p) => p.name === "name");
      const ageParam = result.parameters.find((p) => p.name === "age");

      expect(nameParam).toBeDefined();
      expect(nameParam?.type).toBe("string");

      expect(ageParam).toBeDefined();
      expect(ageParam?.type).toBe("number");

      expect(result.parameters).toMatchSnapshot();
    });

    it("should accept Zod 3 object schema directly and extract parameters", () => {
      const tool = createMockTool(
        z3.object({
          name: z3.string(),
          age: z3.number(),
        }),
      );
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toHaveLength(2);

      const nameParam = result.parameters.find((p) => p.name === "name");
      const ageParam = result.parameters.find((p) => p.name === "age");

      expect(nameParam).toBeDefined();
      expect(ageParam).toBeDefined();

      expect(result.parameters).toMatchSnapshot();
    });

    it("should accept JSON Schema object directly and extract parameters", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      };
      const tool = createMockTool(schema);
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toHaveLength(2);

      const nameParam = result.parameters.find((p) => p.name === "name");
      const ageParam = result.parameters.find((p) => p.name === "age");

      expect(nameParam).toBeDefined();
      expect(nameParam?.type).toBe("string");

      expect(ageParam).toBeDefined();
      expect(ageParam?.type).toBe("number");

      expect(result.parameters).toMatchSnapshot();
    });
  });

  describe("registry util: maxCalls", () => {
    it("adaptToolFromFnSchema preserves maxCalls for legacy toolSchema", () => {
      const legacy = createMockToolWithToolSchema(
        z3.function().args(z3.string()).returns(z3.string()),
      ) as any;
      legacy.maxCalls = 2;
      const adapted = adaptToolFromFnSchema(legacy);
      expect((adapted as any).maxCalls).toBe(2);
    });

    it("mapTamboToolToContextTool includes maxCalls when present", () => {
      const tool = createMockTool(z3.object({ q: z3.string() })) as any;
      tool.maxCalls = 5;
      const meta = mapTamboToolToContextTool(tool);
      expect(meta.maxCalls).toBe(5);
    });

    it("getUnassociatedTools does not drop unassociated tools and preserves maxCalls", () => {
      const t1 = {
        name: "a",
        description: "a",
        tool: () => {},
        inputSchema: {},
        outputSchema: {},
        maxCalls: 3,
      } as any;
      const registry = { a: t1 } as any;
      const associations = { SomeComponent: [] as string[] } as any;
      const out = getUnassociatedTools(registry, associations);
      expect(out.find((t) => t.name === "a")?.maxCalls).toBe(3);
    });
  });
});
