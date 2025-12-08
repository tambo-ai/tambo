/**
 * Tests for getParametersFromToolSchema via mapTamboToolToContextTool.
 *
 * These tests verify that tool schemas are correctly converted to parameter specifications:
 *
 * **New interface (inputSchema)**:
 * - inputSchema should be an object schema (Zod object, Valibot object, JSON Schema object)
 * - Returns a single "input" parameter representing the full object schema
 * - Tool function receives single object argument: tool({ name: "...", age: 30 })
 *
 * **Deprecated interface (toolSchema)**:
 * - toolSchema uses z.function().args(...) pattern
 * - Returns positional parameters: param1, param2, etc.
 * - Tool function receives spread arguments: tool(value1, value2)
 */
import type { JSONSchema7 } from "json-schema";
import * as v from "valibot";
import * as z3 from "zod/v3";
import * as z4 from "zod/v4";
import { createMockTool, createMockToolWithToolSchema } from "../testing/tools";
import { mapTamboToolToContextTool } from "./registry";

describe("getParametersFromToolSchema (via mapTamboToolToContextTool)", () => {
  describe("Deprecated toolSchema interface (Zod function schemas)", () => {
    it("should handle tool with toolSchema", () => {
      const tool = createMockToolWithToolSchema(
        z3.function().args(z3.string().describe("The name")).returns(z3.void()),
      );
      const result = mapTamboToolToContextTool(tool);
      // Should have at least one parameter (either extracted or wrapped)
      expect(result.parameters.length).toBeGreaterThanOrEqual(1);
      expect(result.name).toBe("testTool");
      expect(result.description).toBe("A test tool");
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
      it("should return single input param with object schema", () => {
        const tool = createMockTool({
          inputSchema: z4.object({
            name: z4.string().describe("User name"),
            age: z4.number().describe("User age"),
          }),
          outputSchema: z4.boolean(),
        });
        const result = mapTamboToolToContextTool(tool);
        expect(result.parameters).toHaveLength(1);
        expect(result.parameters[0].name).toBe("input");
        expect(result.parameters[0].type).toBe("object");
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
        expect(result.parameters).toHaveLength(1);
        expect(result.parameters[0].name).toBe("input");
        expect(result.parameters).toMatchSnapshot();
      });
    });

    describe("Zod 3 object schemas", () => {
      it("should return single input param with object schema", () => {
        const tool = createMockTool({
          inputSchema: z3.object({
            name: z3.string(),
            age: z3.number(),
          }),
          outputSchema: z3.boolean(),
        });
        const result = mapTamboToolToContextTool(tool);
        expect(result.parameters).toHaveLength(1);
        expect(result.parameters[0].name).toBe("input");
        expect(result.parameters).toMatchSnapshot();
      });
    });

    describe("Valibot object schemas", () => {
      it("should return single input param with object schema", () => {
        const tool = createMockTool({
          inputSchema: v.object({
            name: v.string(),
            age: v.number(),
          }),
          outputSchema: v.boolean(),
        });
        const result = mapTamboToolToContextTool(tool);
        expect(result.parameters).toHaveLength(1);
        expect(result.parameters[0].name).toBe("input");
        expect(result.parameters).toMatchSnapshot();
      });

      it("should handle complex nested objects", () => {
        const tool = createMockTool({
          inputSchema: v.object({
            point: v.pipe(
              v.object({ x: v.number(), y: v.number() }),
              v.description("Point"),
            ),
            tags: v.array(v.string()),
            color: v.picklist(["red", "green", "blue"]),
          }),
          outputSchema: v.undefined(),
        });
        const result = mapTamboToolToContextTool(tool);
        expect(result.parameters).toHaveLength(1);
        expect(result.parameters[0].name).toBe("input");
        expect(result.parameters).toMatchSnapshot();
      });
    });

    describe("JSON Schema object schemas", () => {
      it("should return single input param with object schema", () => {
        const schema: JSONSchema7 = {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
          required: ["name"],
          description: "User data",
        };
        const tool = createMockTool({ inputSchema: schema, outputSchema: {} });
        const result = mapTamboToolToContextTool(tool);
        expect(result.parameters).toHaveLength(1);
        expect(result.parameters[0].name).toBe("input");
        expect(result.parameters[0].type).toBe("object");
        expect(result.parameters[0].description).toBe("User data");
        expect(result.parameters).toMatchSnapshot();
      });
    });
  });

  describe("Direct schema (shorthand for inputSchema)", () => {
    it("should accept Zod 4 object schema directly", () => {
      const tool = createMockTool(
        z4.object({
          name: z4.string(),
          age: z4.number(),
        }),
      );
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].name).toBe("input");
      expect(result.parameters).toMatchSnapshot();
    });

    it("should accept Zod 3 object schema directly", () => {
      const tool = createMockTool(
        z3.object({
          name: z3.string(),
          age: z3.number(),
        }),
      );
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].name).toBe("input");
      expect(result.parameters).toMatchSnapshot();
    });

    it("should accept Valibot object schema directly", () => {
      const tool = createMockTool(
        v.object({
          name: v.string(),
          age: v.number(),
        }),
      );
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].name).toBe("input");
      expect(result.parameters).toMatchSnapshot();
    });

    it("should accept JSON Schema object directly", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      };
      const tool = createMockTool(schema);
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].name).toBe("input");
      expect(result.parameters).toMatchSnapshot();
    });
  });
});
