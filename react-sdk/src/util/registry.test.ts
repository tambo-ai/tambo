/**
 * Tests for getParametersFromToolSchema via mapTamboToolToContextTool.
 *
 * These tests verify that tool schemas are correctly converted to parameter specifications
 * in a library-agnostic way:
 * - Zod 3 function schemas → individual params (param1, param2, etc.) [deprecated]
 * - Object with {args: tuple, returns} → individual params (preserves tuple structure, recommended)
 * - Valibot tuples → individual params (via JSON Schema conversion)
 * - JSON Schema with prefixItems (draft 2020-12) → individual params
 * - JSON Schema with items array (draft-07) → individual params
 * - Other Standard Schema → "args" wrapper
 */
import type { JSONSchema7 } from "json-schema";
import * as v from "valibot";
import * as z3 from "zod/v3";
import * as z4 from "zod/v4";
import { TamboTool } from "../model/component-metadata";
import { mapTamboToolToContextTool } from "./registry";

/**
 * Extended JSON Schema type that includes draft 2020-12 features like prefixItems.
 */
type JSONSchema7Extended = JSONSchema7 & {
  prefixItems?: JSONSchema7[];
};

// Helper to create a minimal TamboTool for testing
function createTool(toolSchema: unknown): TamboTool {
  return {
    name: "testTool",
    description: "A test tool",
    tool: () => {},
    toolSchema,
  };
}

describe("getParametersFromToolSchema (via mapTamboToolToContextTool)", () => {
  describe("Zod 3 function schemas", () => {
    it("should extract individual parameters from single arg", () => {
      const tool = createTool(
        z3.function().args(z3.string().describe("The name")).returns(z3.void()),
      );
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });

    it("should extract individual parameters from multiple args", () => {
      const tool = createTool(
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
      expect(result.parameters).toMatchSnapshot();
    });

    it("should handle optional parameters", () => {
      const tool = createTool(
        z3
          .function()
          .args(
            z3.string().describe("Required name"),
            z3.number().optional().describe("Optional age"),
          )
          .returns(z3.void()),
      );
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });

    it("should handle complex types", () => {
      const tool = createTool(
        z3
          .function()
          .args(
            z3.object({ x: z3.number(), y: z3.number() }).describe("Point"),
            z3.array(z3.string()).describe("Tags"),
            z3.enum(["red", "green", "blue"]).describe("Color"),
          )
          .returns(z3.void()),
      );
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });
  });

  describe("Object with {args, returns} format", () => {
    it("should extract individual parameters from Zod 4 tuple", () => {
      const tool = createTool({
        args: z4.tuple([
          z4.string().describe("Name"),
          z4.number().describe("Age"),
        ]),
        returns: z4.boolean(),
      });
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });

    it("should extract individual parameters from Zod 3 tuple", () => {
      const tool = createTool({
        args: z3.tuple([
          z3.string().describe("Name"),
          z3.number().describe("Age"),
        ]),
        returns: z3.boolean(),
      });
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });

    it("should handle complex Zod 4 tuple types", () => {
      const tool = createTool({
        args: z4.tuple([
          z4.object({ x: z4.number(), y: z4.number() }).describe("Point"),
          z4.array(z4.string()).describe("Tags"),
          z4.enum(["red", "green", "blue"]).describe("Color"),
        ]),
        returns: z4.void(),
      });
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });

    it("should fall back to args wrapper for non-tuple Standard Schema", () => {
      const tool = createTool({
        args: z4.object({
          name: z4.string(),
          age: z4.number(),
        }),
        returns: z4.boolean(),
      });
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });
  });

  describe("Valibot schemas (library-agnostic)", () => {
    it("should extract individual parameters from Valibot tuple via {args, returns}", () => {
      const tool = createTool({
        args: v.tuple([
          v.pipe(v.string(), v.description("Name")),
          v.pipe(v.number(), v.description("Age")),
        ]),
        returns: v.boolean(),
      });
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });

    it("should handle complex Valibot tuple types", () => {
      const tool = createTool({
        args: v.tuple([
          v.pipe(
            v.object({ x: v.number(), y: v.number() }),
            v.description("Point"),
          ),
          v.pipe(v.array(v.string()), v.description("Tags")),
          v.pipe(v.picklist(["red", "green", "blue"]), v.description("Color")),
        ]),
        returns: v.undefined(),
      });
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });

    it("should fall back to args wrapper for non-tuple Valibot schema", () => {
      const tool = createTool({
        args: v.object({
          name: v.string(),
          age: v.number(),
        }),
        returns: v.boolean(),
      });
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });

    it("should wrap Valibot object as args parameter when used directly", () => {
      const tool = createTool(
        v.object({
          name: v.string(),
          age: v.number(),
        }),
      );
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });
  });

  describe("JSON Schema", () => {
    it("should extract individual parameters from prefixItems (draft 2020-12)", () => {
      const schema: JSONSchema7Extended = {
        type: "array",
        prefixItems: [
          { type: "string", description: "Name" },
          { type: "number", description: "Age" },
        ],
      };
      const tool = createTool(schema);
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });

    it("should extract individual parameters from items array (draft-07)", () => {
      const schema: JSONSchema7 = {
        type: "array",
        items: [
          { type: "string", description: "Name" },
          { type: "number", description: "Age" },
        ],
        minItems: 2,
      };
      const tool = createTool(schema);
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });

    it("should wrap as args for object schema without prefixItems", () => {
      const schema: JSONSchema7Extended = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name"],
        description: "User data",
      };
      const tool = createTool(schema);
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });

    it("should wrap as args for array schema with single items (not tuple)", () => {
      const schema: JSONSchema7Extended = {
        type: "array",
        items: { type: "string" },
        description: "List of names",
      };
      const tool = createTool(schema);
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });
  });

  describe("Other Standard Schema (non-function)", () => {
    it("should wrap Zod 4 object as args parameter", () => {
      const tool = createTool(
        z4.object({
          name: z4.string(),
          age: z4.number(),
        }),
      );
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });

    it("should wrap Zod 3 object as args parameter", () => {
      const tool = createTool(
        z3.object({
          name: z3.string(),
          age: z3.number(),
        }),
      );
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });
  });

  describe("Edge cases", () => {
    it("should handle empty tuple", () => {
      const tool = createTool(z3.function().args().returns(z3.void()));
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });

    it("should handle single parameter without description", () => {
      const tool = createTool(
        z3.function().args(z3.string()).returns(z3.void()),
      );
      const result = mapTamboToolToContextTool(tool);
      expect(result.parameters).toMatchSnapshot();
    });
  });
});
