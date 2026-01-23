import type { JSONSchema7 } from "json-schema";
import * as z3 from "zod/v3";
import * as z4 from "zod/v4";
import { TamboTool } from "../model/component-metadata";
import { looksLikeJSONSchema } from "./json-schema";
import {
  getParametersFromToolSchema,
  safeSchemaToJsonSchema,
  schemaToJsonSchema,
} from "./schema";
import { isStandardSchema } from "./standard-schema";

describe("schema utilities", () => {
  describe("looksLikeJSONSchema", () => {
    it("returns true for a basic JSON Schema object", () => {
      const jsonSchema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "integer" },
        },
        required: ["name"],
      };

      expect(looksLikeJSONSchema(jsonSchema)).toBe(true);
    });

    it("returns true for a union type JSON Schema", () => {
      const jsonSchema: JSONSchema7 = {
        type: ["string", "null"],
      };

      expect(looksLikeJSONSchema(jsonSchema)).toBe(true);
    });

    it("returns false for Standard Schema validators", () => {
      const zodSchema = z4.object({
        name: z4.string(),
      });

      expect(isStandardSchema(zodSchema)).toBe(true);
      expect(looksLikeJSONSchema(zodSchema)).toBe(false);
    });

    it("returns false for arbitrary objects that do not resemble JSON Schema", () => {
      const notSchema = {
        type: "foo",
        other: "bar",
      };

      expect(looksLikeJSONSchema(notSchema)).toBe(false);
    });
  });

  describe("getParametersFromToolSchema", () => {
    describe("inputSchema interface (object schemas)", () => {
      it("extracts parameters from Zod 4 object schema properties", () => {
        const tool: TamboTool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          inputSchema: z4.object({
            query: z4.string().describe("Search query"),
            limit: z4.number().describe("Max results"),
            enabled: z4.boolean().optional().describe("Whether enabled"),
          }),
          outputSchema: z4.void(),
        };

        const params = getParametersFromToolSchema(tool);

        expect(params).toHaveLength(3);

        const queryParam = params.find((p) => p.name === "query");
        expect(queryParam).toBeDefined();
        expect(queryParam?.type).toBe("string");
        expect(queryParam?.description).toBe("Search query");
        expect(queryParam?.isRequired).toBe(true);

        const limitParam = params.find((p) => p.name === "limit");
        expect(limitParam).toBeDefined();
        expect(limitParam?.type).toBe("number");
        expect(limitParam?.description).toBe("Max results");
        expect(limitParam?.isRequired).toBe(true);

        const enabledParam = params.find((p) => p.name === "enabled");
        expect(enabledParam).toBeDefined();
        expect(enabledParam?.type).toBe("boolean");
        // Optional fields are not required
        expect(enabledParam?.isRequired).toBe(false);
      });

      it("extracts parameters from Zod 3 object schema properties", () => {
        const tool: TamboTool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          inputSchema: z3.object({
            name: z3.string().describe("User name"),
            age: z3.number().optional(),
          }),
          outputSchema: z3.void(),
        };

        const params = getParametersFromToolSchema(tool);

        expect(params).toHaveLength(2);

        const nameParam = params.find((p) => p.name === "name");
        expect(nameParam).toBeDefined();
        expect(nameParam?.type).toBe("string");
        expect(nameParam?.isRequired).toBe(true);

        const ageParam = params.find((p) => p.name === "age");
        expect(ageParam).toBeDefined();
        expect(ageParam?.type).toBe("number");
        expect(ageParam?.isRequired).toBe(false);
      });

      it("extracts parameters from JSON Schema object properties", () => {
        const tool: TamboTool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Item ID" },
              count: { type: "number", description: "Item count" },
              active: { type: "boolean" },
            },
            required: ["id"],
          } as JSONSchema7,
          outputSchema: {},
        };

        const params = getParametersFromToolSchema(tool);

        expect(params).toHaveLength(3);

        const idParam = params.find((p) => p.name === "id");
        expect(idParam).toBeDefined();
        expect(idParam?.type).toBe("string");
        expect(idParam?.description).toBe("Item ID");
        expect(idParam?.isRequired).toBe(true);

        const countParam = params.find((p) => p.name === "count");
        expect(countParam).toBeDefined();
        expect(countParam?.type).toBe("number");
        expect(countParam?.isRequired).toBe(false);

        const activeParam = params.find((p) => p.name === "active");
        expect(activeParam).toBeDefined();
        expect(activeParam?.type).toBe("boolean");
        expect(activeParam?.isRequired).toBe(false);
      });

      it("handles empty object schema", () => {
        const tool: TamboTool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          inputSchema: z4.object({}),
          outputSchema: z4.void(),
        };

        const params = getParametersFromToolSchema(tool);
        expect(params).toHaveLength(0);
      });

      it("handles nested object schemas", () => {
        const tool: TamboTool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          inputSchema: z4.object({
            user: z4
              .object({
                name: z4.string(),
                email: z4.string(),
              })
              .describe("User info"),
            options: z4.object({
              notify: z4.boolean(),
            }),
          }),
          outputSchema: z4.void(),
        };

        const params = getParametersFromToolSchema(tool);

        expect(params).toHaveLength(2);

        const userParam = params.find((p) => p.name === "user");
        expect(userParam).toBeDefined();
        expect(userParam?.type).toBe("object");
        expect(userParam?.description).toBe("User info");

        const optionsParam = params.find((p) => p.name === "options");
        expect(optionsParam).toBeDefined();
        expect(optionsParam?.type).toBe("object");
      });

      it("handles array properties", () => {
        const tool: TamboTool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          inputSchema: z4.object({
            tags: z4.array(z4.string()).describe("List of tags"),
            items: z4.array(z4.object({ id: z4.number() })),
          }),
          outputSchema: z4.void(),
        };

        const params = getParametersFromToolSchema(tool);

        expect(params).toHaveLength(2);

        const tagsParam = params.find((p) => p.name === "tags");
        expect(tagsParam).toBeDefined();
        expect(tagsParam?.type).toBe("array");
        expect(tagsParam?.description).toBe("List of tags");

        const itemsParam = params.find((p) => p.name === "items");
        expect(itemsParam).toBeDefined();
        expect(itemsParam?.type).toBe("array");
      });
    });

    describe("realistic inputSchema scenarios", () => {
      it("handles enum properties", () => {
        const tool: TamboTool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          inputSchema: z4.object({
            status: z4.enum(["pending", "active", "completed"]),
            priority: z4
              .enum(["low", "medium", "high"])
              .describe("Task priority"),
          }),
          outputSchema: z4.void(),
        };

        const params = getParametersFromToolSchema(tool);

        expect(params).toHaveLength(2);

        const statusParam = params.find((p) => p.name === "status");
        expect(statusParam).toBeDefined();
        expect(statusParam?.type).toBe("string");
        expect(statusParam?.isRequired).toBe(true);

        const priorityParam = params.find((p) => p.name === "priority");
        expect(priorityParam).toBeDefined();
        expect(priorityParam?.type).toBe("string");
        expect(priorityParam?.description).toBe("Task priority");
      });

      it("handles nullable properties", () => {
        const tool: TamboTool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          inputSchema: z4.object({
            name: z4.string().nullable().describe("Optional name"),
            count: z4.number().nullable(),
          }),
          outputSchema: z4.void(),
        };

        const params = getParametersFromToolSchema(tool);

        expect(params).toHaveLength(2);

        const nameParam = params.find((p) => p.name === "name");
        expect(nameParam).toBeDefined();
        expect(nameParam?.description).toBe("Optional name");
        // Nullable fields are still required (they must be provided, even if null)
        expect(nameParam?.isRequired).toBe(true);
      });

      it("handles deeply nested schemas and preserves full schema", () => {
        const tool: TamboTool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          inputSchema: z4.object({
            config: z4.object({
              database: z4.object({
                host: z4.string(),
                port: z4.number().optional(),
              }),
            }),
          }),
          outputSchema: z4.void(),
        };

        const params = getParametersFromToolSchema(tool);

        expect(params).toHaveLength(1);
        expect(params[0].name).toBe("config");
        expect(params[0].type).toBe("object");
        // The full nested schema should be preserved
        expect(params[0].schema).toHaveProperty("properties");
      });

      it("handles mixed required and optional fields correctly", () => {
        const tool: TamboTool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          inputSchema: z4.object({
            required1: z4.string(),
            optional1: z4.string().optional(),
            required2: z4.number(),
          }),
          outputSchema: z4.void(),
        };

        const params = getParametersFromToolSchema(tool);

        expect(params).toHaveLength(3);

        const required1 = params.find((p) => p.name === "required1");
        const optional1 = params.find((p) => p.name === "optional1");
        const required2 = params.find((p) => p.name === "required2");

        expect(required1?.isRequired).toBe(true);
        expect(optional1?.isRequired).toBe(false);
        expect(required2?.isRequired).toBe(true);
      });
    });

    describe("edge cases and error handling", () => {
      it("returns empty params when inputSchema is unknown type", () => {
        // Create a tool with an invalid inputSchema that isn't Standard Schema or JSON Schema
        const tool: TamboTool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          inputSchema: "invalid-schema" as any, // Not a valid schema
          outputSchema: z4.void(),
        };

        const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
        const params = getParametersFromToolSchema(tool);
        consoleSpy.mockRestore();

        expect(params).toEqual([]);
      });

      it("handles JSON Schema with no properties field", () => {
        // Test the fallback: const properties = schema.properties ?? {};
        const tool: TamboTool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          inputSchema: {
            type: "object",
            // No properties field
          } as JSONSchema7,
          outputSchema: z4.void(),
        };

        const params = getParametersFromToolSchema(tool);
        expect(params).toEqual([]);
      });

      it("handles JSON Schema properties without descriptions", () => {
        // Test the fallback: propSchema.description ?? ""
        const tool: TamboTool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string" }, // No description
              age: { type: "number" }, // No description
            },
          } as JSONSchema7,
          outputSchema: z4.void(),
        };

        const params = getParametersFromToolSchema(tool);

        expect(params).toHaveLength(2);
        expect(params[0].description).toBe("");
        expect(params[1].description).toBe("");
      });

      it("handles JSON Schema with non-object property values", () => {
        // Test the fallback: typeof propSchema === "object" && propSchema !== null ? propSchema : {}
        const tool: TamboTool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          inputSchema: {
            type: "object",
            properties: {
              // Properties can technically be boolean (for schema composition)
              weird: true,
            } as any,
          } as JSONSchema7,
          outputSchema: z4.void(),
        };

        const params = getParametersFromToolSchema(tool);

        expect(params).toHaveLength(1);
        expect(params[0].name).toBe("weird");
        expect(params[0].schema).toEqual({});
      });
    });
  });

  describe("schemaToJsonSchema", () => {
    it("returns JSON Schema as-is when already a JSON Schema", () => {
      const jsonSchema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      };

      const result = schemaToJsonSchema(jsonSchema);
      expect(result).toBe(jsonSchema); // Same reference
    });

    it("converts Zod 4 schema to JSON Schema", () => {
      const zodSchema = z4.object({
        name: z4.string(),
        count: z4.number(),
      });

      const result = schemaToJsonSchema(zodSchema);

      expect(result).toEqual(
        expect.objectContaining({
          type: "object",
          properties: expect.objectContaining({
            name: expect.objectContaining({ type: "string" }),
            count: expect.objectContaining({ type: "number" }),
          }),
        }),
      );
    });

    it("converts Zod 3 schema to JSON Schema", () => {
      const zodSchema = z3.object({
        title: z3.string(),
      });

      const result = schemaToJsonSchema(zodSchema);

      expect(result).toEqual(
        expect.objectContaining({
          type: "object",
          properties: expect.objectContaining({
            title: expect.objectContaining({ type: "string" }),
          }),
        }),
      );
    });
  });

  describe("safeSchemaToJsonSchema", () => {
    it("returns undefined for null schema", () => {
      expect(safeSchemaToJsonSchema(null)).toBeUndefined();
    });

    it("returns undefined for undefined schema", () => {
      expect(safeSchemaToJsonSchema(undefined)).toBeUndefined();
    });

    it("converts valid schema successfully", () => {
      const zodSchema = z4.object({ name: z4.string() });
      const result = safeSchemaToJsonSchema(zodSchema);

      expect(result).toEqual(
        expect.objectContaining({
          type: "object",
          properties: expect.objectContaining({
            name: expect.objectContaining({ type: "string" }),
          }),
        }),
      );
    });

    it("returns undefined and calls onError for invalid schema", () => {
      // Create something that looks like a Standard Schema but will fail conversion
      const brokenSchema = {
        "~standard": {
          version: 1,
          vendor: "broken",
          validate: () => ({ value: {} }),
        },
      };

      const onError = jest.fn();
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = safeSchemaToJsonSchema(brokenSchema as any, onError);

      consoleSpy.mockRestore();

      expect(result).toBeUndefined();
      expect(onError).toHaveBeenCalled();
    });

    it("logs error to console when conversion fails", () => {
      const brokenSchema = {
        "~standard": {
          version: 1,
          vendor: "broken",
          validate: () => ({ value: {} }),
        },
      };

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      safeSchemaToJsonSchema(brokenSchema as any);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error converting schema to JSON Schema:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});
