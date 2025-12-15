import * as z3 from "zod/v3";
import * as z4 from "zod/v4";
import { handleZodSchemaToJson, isZod3Schema, isZod4Schema } from "./zod";

// Test helper: assumes `value` is JSON-serializable (plain objects/arrays/primitives).
// Conservative helper: returns true if any object in the tree has an own `key`
// property at any depth. This lets us assert against JSON Schema `$ref` keys
// structurally (not via incidental substrings in string values).
function hasKeyDeep(value: unknown, key: string): boolean {
  const seen = new Set<object>();

  function isPlainObject(v: unknown): v is Record<string, unknown> {
    if (!v || typeof v !== "object" || Array.isArray(v)) return false;
    const proto = Object.getPrototypeOf(v);
    return proto === Object.prototype || proto === null;
  }

  function visit(node: unknown): boolean {
    if (!node || typeof node !== "object") return false;
    if (seen.has(node)) return false;
    seen.add(node);

    if (Array.isArray(node)) {
      return node.some(visit);
    }

    if (!isPlainObject(node)) return false;

    if (Object.prototype.hasOwnProperty.call(node, key)) return true;
    return Object.values(node).some(visit);
  }

  return visit(value);
}

function resolveJsonPointer(doc: unknown, pointer: string): unknown {
  if (!pointer.startsWith("#")) return undefined;
  if (pointer === "#") return doc;
  if (!pointer.startsWith("#/")) return undefined;

  return pointer
    .slice(2)
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce<unknown>((current, segment) => {
      if (!current || typeof current !== "object") return undefined;

      if (Array.isArray(current)) {
        const index = Number(segment);
        if (!Number.isInteger(index)) return undefined;
        return current[index];
      }

      return (current as Record<string, unknown>)[segment];
    }, doc);
}

function createRecursiveZod4NodeSchema(): z4.ZodTypeAny {
  // Placeholder schema so we can self-reference via `z4.lazy` without
  // fighting ESLint `prefer-const`.
  let nodeSchema: z4.ZodTypeAny = z4.any();
  nodeSchema = z4.object({ next: z4.lazy(() => nodeSchema).optional() });
  return nodeSchema;
}

describe("zod schema utilities", () => {
  describe("isZod3Schema", () => {
    it("returns true for Zod 3 schemas", () => {
      const schema = z3.object({ name: z3.string() });
      expect(isZod3Schema(schema)).toBe(true);
      expect(isZod4Schema(schema)).toBe(false);
    });

    it("returns true for Zod 4 schemas (they also have _def)", () => {
      // Note: Zod 4 schemas have both _def and _zod, so isZod3Schema returns true.
      // This is fine because handleZodSchemaToJson checks isZod4Schema first.
      const schema = z4.object({ name: z4.string() });
      expect(isZod4Schema(schema)).toBe(true);
      expect(isZod3Schema(schema)).toBe(false);
    });

    it("returns false for non-Zod values", () => {
      expect(isZod3Schema({})).toBe(false);
      expect(isZod3Schema(null)).toBe(false);
      expect(isZod3Schema("string")).toBe(false);
    });
  });

  describe("isZod4Schema", () => {
    it("returns true for Zod 4 schemas", () => {
      const schema = z4.object({ name: z4.string() });
      expect(isZod4Schema(schema)).toBe(true);
    });

    it("returns false for Zod 3 schemas", () => {
      const schema = z3.object({ name: z3.string() });
      expect(isZod4Schema(schema)).toBe(false);
    });

    it("returns false for non-Zod values", () => {
      expect(isZod4Schema({})).toBe(false);
      expect(isZod4Schema(null)).toBe(false);
      expect(isZod4Schema("string")).toBe(false);
    });
  });

  describe("handleZodSchemaToJson", () => {
    describe("basic conversion", () => {
      it("converts Zod 3 schema to JSON Schema", () => {
        const schema = z3.object({
          name: z3.string(),
          age: z3.number(),
        });

        const result = handleZodSchemaToJson(schema);

        expect(result).toMatchObject({
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
        });
      });

      it("converts Zod 4 schema to JSON Schema", () => {
        const schema = z4.object({
          name: z4.string(),
          age: z4.number(),
        });

        const result = handleZodSchemaToJson(schema);

        expect(result).toMatchObject({
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
        });
      });
    });

    describe("reused schemas - no $ref references", () => {
      it("inlines reused Zod 3 schemas without any $ref in output", () => {
        // Define a shared schema that will be reused
        const dataSchema = z3.object({
          name: z3.string(),
          value: z3.number(),
        });

        // Use the same schema in multiple places
        const props = z3.object({
          data: z3.array(dataSchema),
          historicalData: z3.array(dataSchema),
        });

        const result = handleZodSchemaToJson(props);

        // Ensure there are no JSON Schema `$ref` keys anywhere in the produced schema.
        expect(hasKeyDeep(result, "$ref")).toBe(false);

        // Both arrays should have the full schema inline
        expect(result).toMatchObject({
          type: "object",
          properties: {
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "number" },
                },
              },
            },
            historicalData: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "number" },
                },
              },
            },
          },
        });
      });

      it("inlines reused Zod 4 schemas without any $ref in output", () => {
        // Define a shared schema that will be reused
        const dataSchema = z4.object({
          name: z4.string(),
          value: z4.number(),
        });

        // Use the same schema in multiple places
        const props = z4.object({
          data: z4.array(dataSchema),
          historicalData: z4.array(dataSchema),
        });

        const result = handleZodSchemaToJson(props);

        expect(hasKeyDeep(result, "$ref")).toBe(false);

        // Both arrays should have the full schema inline
        expect(result).toMatchObject({
          type: "object",
          properties: {
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "number" },
                },
              },
            },
            historicalData: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "number" },
                },
              },
            },
          },
        });
      });

      it("handles deeply nested reused Zod 3 schemas without any $ref", () => {
        const addressSchema = z3.object({
          street: z3.string(),
          city: z3.string(),
        });

        const personSchema = z3.object({
          name: z3.string(),
          homeAddress: addressSchema,
          workAddress: addressSchema,
        });

        const result = handleZodSchemaToJson(personSchema);

        expect(hasKeyDeep(result, "$ref")).toBe(false);
        expect(result).toMatchObject({
          type: "object",
          properties: {
            name: { type: "string" },
            homeAddress: {
              type: "object",
              properties: {
                street: { type: "string" },
                city: { type: "string" },
              },
            },
            workAddress: {
              type: "object",
              properties: {
                street: { type: "string" },
                city: { type: "string" },
              },
            },
          },
        });
      });

      it("handles deeply nested reused Zod 4 schemas without any $ref", () => {
        const addressSchema = z4.object({
          street: z4.string(),
          city: z4.string(),
        });

        const personSchema = z4.object({
          name: z4.string(),
          homeAddress: addressSchema,
          workAddress: addressSchema,
        });

        const result = handleZodSchemaToJson(personSchema);

        expect(hasKeyDeep(result, "$ref")).toBe(false);
        expect(result).toMatchObject({
          type: "object",
          properties: {
            name: { type: "string" },
            homeAddress: {
              type: "object",
              properties: {
                street: { type: "string" },
                city: { type: "string" },
              },
            },
            workAddress: {
              type: "object",
              properties: {
                street: { type: "string" },
                city: { type: "string" },
              },
            },
          },
        });
      });

      it("handles triple-nested reused Zod 4 schemas without any $ref", () => {
        const pointSchema = z4.object({
          x: z4.number(),
          y: z4.number(),
        });

        const lineSchema = z4.object({
          start: pointSchema,
          end: pointSchema,
        });

        const shapeSchema = z4.object({
          outline: z4.array(lineSchema),
          boundingBox: z4.object({
            topLeft: pointSchema,
            bottomRight: pointSchema,
          }),
        });

        const result = handleZodSchemaToJson(shapeSchema);

        expect(result).toMatchInlineSnapshot(`
          {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "additionalProperties": false,
            "properties": {
              "boundingBox": {
                "additionalProperties": false,
                "properties": {
                  "bottomRight": {
                    "additionalProperties": false,
                    "properties": {
                      "x": {
                        "type": "number",
                      },
                      "y": {
                        "type": "number",
                      },
                    },
                    "required": [
                      "x",
                      "y",
                    ],
                    "type": "object",
                  },
                  "topLeft": {
                    "additionalProperties": false,
                    "properties": {
                      "x": {
                        "type": "number",
                      },
                      "y": {
                        "type": "number",
                      },
                    },
                    "required": [
                      "x",
                      "y",
                    ],
                    "type": "object",
                  },
                },
                "required": [
                  "topLeft",
                  "bottomRight",
                ],
                "type": "object",
              },
              "outline": {
                "items": {
                  "additionalProperties": false,
                  "properties": {
                    "end": {
                      "additionalProperties": false,
                      "properties": {
                        "x": {
                          "type": "number",
                        },
                        "y": {
                          "type": "number",
                        },
                      },
                      "required": [
                        "x",
                        "y",
                      ],
                      "type": "object",
                    },
                    "start": {
                      "additionalProperties": false,
                      "properties": {
                        "x": {
                          "type": "number",
                        },
                        "y": {
                          "type": "number",
                        },
                      },
                      "required": [
                        "x",
                        "y",
                      ],
                      "type": "object",
                    },
                  },
                  "required": [
                    "start",
                    "end",
                  ],
                  "type": "object",
                },
                "type": "array",
              },
            },
            "required": [
              "outline",
              "boundingBox",
            ],
            "type": "object",
          }
        `);
        expect(hasKeyDeep(result, "$ref")).toBe(false);
      });
    });

    describe("recursive schemas", () => {
      it("represents Zod 4 recursive schemas using $ref", () => {
        const nodeSchema = createRecursiveZod4NodeSchema();
        const result = handleZodSchemaToJson(nodeSchema);
        const schema = result as Record<string, unknown>;
        const properties = schema.properties as
          | Record<string, unknown>
          | undefined;
        const next = properties?.next as Record<string, unknown> | undefined;
        const ref = next?.$ref;

        expect(hasKeyDeep(result, "$ref")).toBe(true);
        expect(result).toMatchObject({
          type: "object",
          properties: {
            next: {
              $ref: expect.stringMatching(/^#(\/.*)?$/),
            },
          },
        });
        expect(ref).toEqual(expect.stringMatching(/^#(\/.*)?$/));

        const resolved =
          typeof ref === "string" ? resolveJsonPointer(result, ref) : undefined;
        expect(resolved).toBe(result);
        expect(resolved).toMatchObject({
          type: "object",
        });
      });
    });

    describe("complex schemas", () => {
      it("handles optional fields in Zod 3", () => {
        const schema = z3.object({
          required: z3.string(),
          optional: z3.string().optional(),
        });

        const result = handleZodSchemaToJson(schema);

        expect(result).toMatchObject({
          type: "object",
          properties: {
            required: { type: "string" },
            optional: { type: "string" },
          },
          required: ["required"],
        });
      });

      it("handles optional fields in Zod 4", () => {
        const schema = z4.object({
          required: z4.string(),
          optional: z4.string().optional(),
        });

        const result = handleZodSchemaToJson(schema);

        expect(result).toMatchObject({
          type: "object",
          properties: {
            required: { type: "string" },
            optional: { type: "string" },
          },
          required: ["required"],
        });
      });

      it("handles enums in Zod 3", () => {
        const schema = z3.object({
          status: z3.enum(["active", "inactive", "pending"]),
        });

        const result = handleZodSchemaToJson(schema);

        expect(result).toMatchObject({
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["active", "inactive", "pending"],
            },
          },
        });
      });

      it("handles enums in Zod 4", () => {
        const schema = z4.object({
          status: z4.enum(["active", "inactive", "pending"]),
        });

        const result = handleZodSchemaToJson(schema);

        expect(result).toMatchObject({
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["active", "inactive", "pending"],
            },
          },
        });
      });

      it("handles descriptions in Zod 3", () => {
        const schema = z3.object({
          name: z3.string().describe("The user name"),
        });

        const result = handleZodSchemaToJson(schema);

        expect(result).toMatchObject({
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The user name",
            },
          },
        });
      });

      it("handles descriptions in Zod 4", () => {
        const schema = z4.object({
          name: z4.string().describe("The user name"),
        });

        const result = handleZodSchemaToJson(schema);

        expect(result).toMatchObject({
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The user name",
            },
          },
        });
      });
    });
  });
});
