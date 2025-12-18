import type { JSONSchema7 } from "json-schema";
import * as z3 from "zod/v3";
import * as z4 from "zod/v4";
import { TamboTool } from "../model/component-metadata";
import { looksLikeJSONSchema } from "./json-schema";
import { getParametersFromToolSchema } from "./schema";
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

    describe("deprecated toolSchema interface (tuple/positional args)", () => {
      it("extracts positional parameters from Zod 3 function schema", () => {
        const tool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          toolSchema: z3
            .function()
            .args(
              z3.string().describe("First arg"),
              z3.number().describe("Second arg"),
            )
            .returns(z3.void()),
        };

        const params = getParametersFromToolSchema(tool);

        // toolSchema uses positional params (param1, param2, etc.)
        expect(params.length).toBeGreaterThanOrEqual(1);
        expect(params[0].name).toBe("param1");
      });
      it("unwraps optional positional parameters logic (root cause fix)", () => {
        const tool = {
          name: "test-tool",
          description: "Test tool",
          tool: jest.fn(),
          toolSchema: z3
            .function()
            .args(
              z3
                .object({
                  q: z3.string(),
                })
                .optional(),
            )
            .returns(z3.void()),
        };

        const params = getParametersFromToolSchema(tool);

        expect(params).toHaveLength(1);
        expect(params[0].name).toBe("param1");
        expect(params[0].type).toBe("object");
        expect(params[0].isRequired).toBe(false);
        // The unwrapped schema should NOT be a union with anyOf at the root
        expect(params[0].schema).not.toHaveProperty("anyOf");
        expect(params[0].schema).toHaveProperty("type", "object");
      });
    });
  });
});
