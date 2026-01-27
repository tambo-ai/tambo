/**
 * Tests for schema compatibility with registerTool and registerComponent.
 *
 * These tests verify that the registry functions work correctly with:
 * - Zod 3 schemas (current primary)
 * - Zod 4 schemas (Standard Schema native)
 * - Raw JSON Schema objects
 */
import { act, renderHook } from "@testing-library/react";
import type { JSONSchema7 } from "json-schema";
import React from "react";
import * as z3 from "zod/v3";
import * as z4 from "zod/v4";
import { TamboComponent } from "../model/component-metadata";
import { defineTool } from "../util/registry";
import {
  TamboRegistryProvider,
  useTamboRegistry,
} from "./tambo-registry-provider";

// Test component for registration tests
const TestComponent: React.FC<{ message: string }> = ({ message }) => (
  <div>{message}</div>
);

describe("Schema Compatibility", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TamboRegistryProvider>{children}</TamboRegistryProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerComponent with different schema types", () => {
    describe("Zod 3 schemas", () => {
      it("should register component with Zod 3 object schema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const component: TamboComponent = {
          name: "Zod3ObjectComponent",
          component: TestComponent,
          description: "Component with Zod 3 object schema",
          propsSchema: z3.object({
            message: z3.string().describe("The message to display"),
            count: z3.number().optional().describe("Optional count"),
          }),
        };

        act(() => {
          result.current.registerComponent(component);
        });

        expect(result.current.componentList).toHaveProperty(
          "Zod3ObjectComponent",
        );
        const registered = result.current.componentList.Zod3ObjectComponent;
        expect(registered.name).toBe("Zod3ObjectComponent");
        expect(registered.props).toBeDefined();
        expect(registered.props).toHaveProperty("type", "object");
      });

      it("should register component with Zod 3 nested object schema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const component: TamboComponent = {
          name: "Zod3NestedComponent",
          component: TestComponent,
          description: "Component with nested Zod 3 schema",
          propsSchema: z3.object({
            user: z3.object({
              name: z3.string(),
              email: z3.string().email(),
            }),
            settings: z3.object({
              theme: z3.enum(["light", "dark"]),
              notifications: z3.boolean(),
            }),
          }),
        };

        act(() => {
          result.current.registerComponent(component);
        });

        expect(result.current.componentList).toHaveProperty(
          "Zod3NestedComponent",
        );
      });

      it("should register component with Zod 3 array schema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const component: TamboComponent = {
          name: "Zod3ArrayComponent",
          component: TestComponent,
          description: "Component with Zod 3 array schema",
          propsSchema: z3.object({
            items: z3.array(z3.string()).describe("List of items"),
            tags: z3.array(
              z3.object({
                id: z3.number(),
                label: z3.string(),
              }),
            ),
          }),
        };

        act(() => {
          result.current.registerComponent(component);
        });

        expect(result.current.componentList).toHaveProperty(
          "Zod3ArrayComponent",
        );
      });

      it("should register component with Zod 3 union schema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const component: TamboComponent = {
          name: "Zod3UnionComponent",
          component: TestComponent,
          description: "Component with Zod 3 union schema",
          propsSchema: z3.object({
            value: z3.union([z3.string(), z3.number()]),
            status: z3.enum(["pending", "active", "completed"]),
          }),
        };

        act(() => {
          result.current.registerComponent(component);
        });

        expect(result.current.componentList).toHaveProperty(
          "Zod3UnionComponent",
        );
      });
    });

    describe("Zod 4 schemas", () => {
      it("should register component with Zod 4 object schema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const component: TamboComponent = {
          name: "Zod4ObjectComponent",
          component: TestComponent,
          description: "Component with Zod 4 object schema",
          propsSchema: z4.object({
            message: z4.string().describe("The message to display"),
            count: z4.number().optional().describe("Optional count"),
          }),
        };

        act(() => {
          result.current.registerComponent(component);
        });

        expect(result.current.componentList).toHaveProperty(
          "Zod4ObjectComponent",
        );
        const registered = result.current.componentList.Zod4ObjectComponent;
        expect(registered.name).toBe("Zod4ObjectComponent");
        expect(registered.props).toBeDefined();
        expect(registered.props).toHaveProperty("type", "object");
      });

      it("should register component with Zod 4 nested object schema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const component: TamboComponent = {
          name: "Zod4NestedComponent",
          component: TestComponent,
          description: "Component with nested Zod 4 schema",
          propsSchema: z4.object({
            user: z4.object({
              name: z4.string(),
              email: z4.email(),
            }),
            settings: z4.object({
              theme: z4.enum(["light", "dark"]),
              notifications: z4.boolean(),
            }),
          }),
        };

        act(() => {
          result.current.registerComponent(component);
        });

        expect(result.current.componentList).toHaveProperty(
          "Zod4NestedComponent",
        );
      });

      it("should register component with Zod 4 array schema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const component: TamboComponent = {
          name: "Zod4ArrayComponent",
          component: TestComponent,
          description: "Component with Zod 4 array schema",
          propsSchema: z4.object({
            items: z4.array(z4.string()).describe("List of items"),
            tags: z4.array(
              z4.object({
                id: z4.number(),
                label: z4.string(),
              }),
            ),
          }),
        };

        act(() => {
          result.current.registerComponent(component);
        });

        expect(result.current.componentList).toHaveProperty(
          "Zod4ArrayComponent",
        );
      });

      it("should register component with Zod 4 union schema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const component: TamboComponent = {
          name: "Zod4UnionComponent",
          component: TestComponent,
          description: "Component with Zod 4 union schema",
          propsSchema: z4.object({
            value: z4.union([z4.string(), z4.number()]),
            status: z4.enum(["pending", "active", "completed"]),
          }),
        };

        act(() => {
          result.current.registerComponent(component);
        });

        expect(result.current.componentList).toHaveProperty(
          "Zod4UnionComponent",
        );
      });
    });

    describe("JSON Schema objects", () => {
      it("should register component with raw JSON Schema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const jsonSchema: JSONSchema7 = {
          type: "object",
          properties: {
            message: { type: "string", description: "The message to display" },
            count: { type: "number", description: "Optional count" },
          },
          required: ["message"],
        };

        const component: TamboComponent = {
          name: "JsonSchemaComponent",
          component: TestComponent,
          description: "Component with raw JSON Schema",
          propsSchema: jsonSchema,
        };

        act(() => {
          result.current.registerComponent(component);
        });

        expect(result.current.componentList).toHaveProperty(
          "JsonSchemaComponent",
        );
        const registered = result.current.componentList.JsonSchemaComponent;
        expect(registered.props).toEqual(jsonSchema);
      });

      it("should register component with complex JSON Schema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const jsonSchema: JSONSchema7 = {
          type: "object",
          properties: {
            user: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string", format: "email" },
              },
              required: ["name", "email"],
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  label: { type: "string" },
                },
              },
            },
          },
          required: ["user"],
        };

        const component: TamboComponent = {
          name: "ComplexJsonSchemaComponent",
          component: TestComponent,
          description: "Component with complex JSON Schema",
          propsSchema: jsonSchema,
        };

        act(() => {
          result.current.registerComponent(component);
        });

        expect(result.current.componentList).toHaveProperty(
          "ComplexJsonSchemaComponent",
        );
      });
    });
  });

  describe("registerTool with different schema types", () => {
    describe("Deprecated toolSchema throws error", () => {
      const deprecatedTool = {
        name: "deprecated-tool",
        description: "Tool with deprecated toolSchema",
        tool: jest.fn().mockResolvedValue("result"),
        toolSchema: z3
          .function()
          .args(z3.string().describe("input parameter"))
          .returns(z3.string()),
      };

      it("should throw error when using deprecated toolSchema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        expect(() => {
          act(() => result.current.registerTool(deprecatedTool));
        }).toThrow(
          'Tool "deprecated-tool" uses deprecated "toolSchema" property.',
        );
      });

      it("registerTools should throw error when using deprecated toolSchema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        expect(() => {
          act(() => result.current.registerTools([deprecatedTool]));
        }).toThrow(
          'Tool "deprecated-tool" uses deprecated "toolSchema" property.',
        );
      });
    });

    describe("Zod 3 object schemas for tools", () => {
      it("should register tool with Zod 3 object inputSchema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const tool = defineTool({
          name: "zod3-object-tool",
          description: "Tool with Zod 3 object schema",
          tool: jest.fn().mockResolvedValue("result"),
          inputSchema: z3.object({
            query: z3.string().describe("search query"),
            limit: z3.number().optional().describe("max results"),
          }),
          outputSchema: z3.string(),
        });

        act(() => {
          result.current.registerTool(tool);
        });

        expect(result.current.toolRegistry).toHaveProperty("zod3-object-tool");
      });
    });

    describe("Zod 4 object schemas for tools", () => {
      // Note: inputSchema must always be an object schema
      // The tool function receives a single object argument with all parameters

      it("should register tool with Zod 4 object schema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const tool = defineTool({
          name: "zod4-object-tool",
          description: "Tool with Zod 4 object schema",
          tool: jest.fn().mockResolvedValue("result"),
          inputSchema: z4.object({
            input: z4.string().describe("input parameter"),
          }),
          outputSchema: z4.string(),
        });

        act(() => {
          result.current.registerTool(tool);
        });

        expect(result.current.toolRegistry).toHaveProperty("zod4-object-tool");
      });

      it("should register tool with Zod 4 object schema with multiple fields", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const tool = defineTool({
          name: "zod4-multi-field-tool",
          description: "Tool with multiple Zod 4 fields",
          tool: jest.fn().mockResolvedValue("result"),
          inputSchema: z4.object({
            first: z4.string().describe("first argument"),
            second: z4.number().describe("second argument"),
            third: z4.boolean().optional().describe("optional third argument"),
          }),
          outputSchema: z4.array(z4.string()),
        });

        act(() => {
          result.current.registerTool(tool);
        });

        expect(result.current.toolRegistry).toHaveProperty(
          "zod4-multi-field-tool",
        );
      });

      it("should register tool with Zod 4 nested object schema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const tool = defineTool({
          name: "zod4-nested-object-tool",
          description: "Tool with Zod 4 nested object",
          tool: jest.fn().mockResolvedValue("result"),
          inputSchema: z4
            .object({
              query: z4.string().describe("search query"),
              limit: z4.number().optional().describe("max results"),
              filters: z4.array(z4.string()).optional(),
            })
            .describe("search options"),
          outputSchema: z4.array(z4.string()),
        });

        act(() => {
          result.current.registerTool(tool);
        });

        expect(result.current.toolRegistry).toHaveProperty(
          "zod4-nested-object-tool",
        );
      });
    });

    describe("JSON Schema for tools", () => {
      it("should register tool with JSON Schema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const jsonSchema: JSONSchema7 = {
          type: "object",
          description: "Tool parameters",
          properties: {
            query: { type: "string", description: "The search query" },
            limit: { type: "number", description: "Max results to return" },
          },
          required: ["query"],
        };

        const tool = defineTool({
          name: "json-schema-tool",
          description: "Tool with raw JSON Schema",
          tool: jest.fn().mockResolvedValue("result"),
          inputSchema: jsonSchema,
          outputSchema: {},
        });

        act(() => {
          result.current.registerTool(tool);
        });

        expect(result.current.toolRegistry).toHaveProperty("json-schema-tool");
      });

      it("should register tool with complex JSON Schema", () => {
        const { result } = renderHook(() => useTamboRegistry(), { wrapper });

        const jsonSchema: JSONSchema7 = {
          type: "object",
          description: "Complex search parameters",
          properties: {
            search: {
              type: "object",
              properties: {
                query: { type: "string" },
                filters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field: { type: "string" },
                      value: { type: "string" },
                    },
                  },
                },
              },
              required: ["query"],
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "number" },
                pageSize: { type: "number" },
              },
            },
          },
          required: ["search"],
        };

        const tool = defineTool({
          name: "complex-json-schema-tool",
          description: "Tool with complex JSON Schema",
          tool: jest.fn().mockResolvedValue("result"),
          inputSchema: jsonSchema,
          outputSchema: {},
        });

        act(() => {
          result.current.registerTool(tool);
        });

        expect(result.current.toolRegistry).toHaveProperty(
          "complex-json-schema-tool",
        );
      });
    });
  });

  describe("Schema validation errors", () => {
    it("should reject Zod 3 z.record() in component propsSchema", () => {
      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const component: TamboComponent = {
        name: "InvalidZod3RecordComponent",
        component: TestComponent,
        description: "Component with invalid z.record() schema",
        propsSchema: z3.record(z3.string()),
      };

      expect(() => {
        act(() => {
          result.current.registerComponent(component);
        });
      }).toThrow(
        /Record types \(objects with dynamic keys\) are not supported/,
      );
    });

    it("should reject Zod 4 z.record() in component propsSchema", () => {
      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const component: TamboComponent = {
        name: "InvalidZod4RecordComponent",
        component: TestComponent,
        description: "Component with invalid Zod 4 z.record() schema",
        // Zod 4 record requires key type and value type
        propsSchema: z4.record(z4.string(), z4.string()),
      };

      expect(() => {
        act(() => {
          result.current.registerComponent(component);
        });
      }).toThrow(
        /Record types \(objects with dynamic keys\) are not supported/,
      );
    });

    it("should reject Zod 3 z.record() in tool schema", () => {
      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const tool = defineTool({
        name: "invalid-zod3-record-tool",
        description: "Tool with invalid z.record() schema",
        tool: jest.fn().mockResolvedValue("result"),
        inputSchema: z3.object({
          metadata: z3.record(z3.string()),
        }),
        outputSchema: z3.string(),
      });

      expect(() => {
        act(() => {
          result.current.registerTool(tool);
        });
      }).toThrow(
        /Record types \(objects with dynamic keys\) are not supported/,
      );
    });

    it("should reject Zod 4 z.record() in tool schema", () => {
      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const tool = defineTool({
        name: "invalid-zod4-record-tool",
        description: "Tool with invalid Zod 4 z.record() schema",
        tool: jest.fn().mockResolvedValue("result"),
        inputSchema: z4.object({
          metadata: z4.record(z4.string(), z4.string()),
        }),
        outputSchema: z4.string(),
      });

      expect(() => {
        act(() => {
          result.current.registerTool(tool);
        });
      }).toThrow(
        /Record types \(objects with dynamic keys\) are not supported/,
      );
    });

    it("should reject non-object inputSchema (tuple)", () => {
      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const tool = defineTool({
        name: "invalid-tuple-tool",
        description: "Tool with tuple inputSchema",
        tool: jest.fn().mockResolvedValue("result"),
        inputSchema: z4.tuple([z4.string()]),
        outputSchema: z4.string(),
      });

      expect(() => {
        act(() => {
          result.current.registerTool(tool);
        });
      }).toThrow(/must be an object schema/);
    });

    it("should reject non-object inputSchema (string)", () => {
      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const tool = defineTool({
        name: "invalid-string-tool",
        description: "Tool with string inputSchema",
        tool: jest.fn().mockResolvedValue("result"),
        inputSchema: z4.string(),
        outputSchema: z4.string(),
      });

      expect(() => {
        act(() => {
          result.current.registerTool(tool);
        });
      }).toThrow(/must be an object schema/);
    });
  });

  describe("Cross-version compatibility", () => {
    it("should register components with mixed Zod 3 and Zod 4 schemas", () => {
      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      // Register Zod 3 component
      const zod3Component: TamboComponent = {
        name: "MixedZod3Component",
        component: TestComponent,
        description: "Zod 3 component",
        propsSchema: z3.object({ value: z3.string() }),
      };

      // Register Zod 4 component
      const zod4Component: TamboComponent = {
        name: "MixedZod4Component",
        component: TestComponent,
        description: "Zod 4 component",
        propsSchema: z4.object({ value: z4.string() }),
      };

      act(() => {
        result.current.registerComponent(zod3Component);
        result.current.registerComponent(zod4Component);
      });

      expect(result.current.componentList).toHaveProperty("MixedZod3Component");
      expect(result.current.componentList).toHaveProperty("MixedZod4Component");
    });

    it("should register tools with mixed Zod 3, Zod 4, and JSON Schema", () => {
      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      // Zod 3 tool (using object inputSchema)
      const zod3Tool = defineTool({
        name: "mixed-zod3-tool",
        description: "Zod 3 tool",
        tool: jest.fn().mockResolvedValue("result"),
        inputSchema: z3.object({
          input: z3.string(),
        }),
        outputSchema: z3.string(),
      });

      // Zod 4 tool (using Standard Schema with object inputSchema)
      const zod4Tool = defineTool({
        name: "mixed-zod4-tool",
        description: "Zod 4 tool",
        tool: jest.fn().mockResolvedValue("result"),
        inputSchema: z4.object({
          input: z4.string(),
        }),
        outputSchema: z4.string(),
      });

      // JSON Schema tool
      const jsonSchemaTool = defineTool({
        name: "mixed-json-schema-tool",
        description: "JSON Schema tool",
        tool: jest.fn().mockResolvedValue("result"),
        inputSchema: {
          type: "object",
          properties: {
            input: { type: "string" },
          },
        },
        outputSchema: { type: "string" },
      });

      act(() => {
        result.current.registerTools([zod3Tool, zod4Tool, jsonSchemaTool]);
      });

      expect(result.current.toolRegistry).toHaveProperty("mixed-zod3-tool");
      expect(result.current.toolRegistry).toHaveProperty("mixed-zod4-tool");
      expect(result.current.toolRegistry).toHaveProperty(
        "mixed-json-schema-tool",
      );
    });
  });

  describe("Standard Schema interface verification", () => {
    it("should verify Zod 3 schema has ~standard property", () => {
      const schema = z3.object({ value: z3.string() });
      expect("~standard" in schema).toBe(true);
    });

    it("should verify Zod 4 schema has ~standard property", () => {
      const schema = z4.object({ value: z4.string() });
      expect("~standard" in schema).toBe(true);
    });

    it("should verify JSON Schema does not have ~standard property", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: { value: { type: "string" } },
      };
      expect("~standard" in schema).toBe(false);
    });
  });
  describe("registerTool preserves maxCalls", () => {
    it("should preserve maxCalls for Zod 3 inputSchema tools", () => {
      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const tool = defineTool({
        name: "zod3-max-tool",
        description: "Zod 3 tool with maxCalls",
        tool: jest.fn().mockResolvedValue("ok"),
        inputSchema: z3.object({ q: z3.string() }),
        outputSchema: z3.string(),
        maxCalls: 2,
      });

      act(() => {
        result.current.registerTool(tool);
      });

      expect(result.current.toolRegistry["zod3-max-tool"].maxCalls).toBe(2);
    });

    it("should preserve maxCalls for Zod 4 inputSchema tools", () => {
      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const tool = defineTool({
        name: "zod4-max-tool",
        description: "Zod 4 tool with maxCalls",
        tool: jest.fn().mockResolvedValue("ok"),
        inputSchema: z4.object({ q: z4.string() }),
        outputSchema: z4.string(),
        maxCalls: 3,
      });

      act(() => {
        result.current.registerTool(tool);
      });

      expect(result.current.toolRegistry["zod4-max-tool"].maxCalls).toBe(3);
    });
  });
});
