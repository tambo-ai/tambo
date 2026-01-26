/**
 * Tests for registry utilities:
 * - getParametersFromToolSchema via mapTamboToolToContextTool
 * - convertPropsToJsonSchema
 * - getComponentFromRegistry
 * - getAvailableComponents
 * - getUnassociatedTools
 */
import type { JSONSchema7 } from "json-schema";
import * as z3 from "zod/v3";
import * as z4 from "zod/v4";
import {
  ComponentRegistry,
  RegisteredComponent,
  TamboTool,
  TamboToolAssociations,
  TamboToolRegistry,
} from "../model/component-metadata";
import { createMockTool } from "../testing/tools";
import {
  convertPropsToJsonSchema,
  getAvailableComponents,
  getComponentFromRegistry,
  getUnassociatedTools,
  mapTamboToolToContextTool,
} from "./registry";

describe("getParametersFromToolSchema (via mapTamboToolToContextTool)", () => {
  describe("inputSchema interface (object schemas)", () => {
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
});

describe("registry util: maxCalls", () => {
  it("mapTamboToolToContextTool includes maxCalls when present", () => {
    const tool = createMockTool({
      inputSchema: z3.object({ q: z3.string() }),
      maxCalls: 5,
    });
    const meta = mapTamboToolToContextTool(tool);
    expect(meta.maxCalls).toBe(5);
  });

  it("getUnassociatedTools does not drop unassociated tools and preserves maxCalls", () => {
    const t1: TamboTool = {
      name: "a",
      description: "a",
      tool: () => {},
      inputSchema: {},
      outputSchema: {},
      maxCalls: 3,
    };
    const registry = { a: t1 };
    const associations = { SomeComponent: [] as string[] };
    const out = getUnassociatedTools(registry, associations);
    expect(out.find((t) => t.name === "a")?.maxCalls).toBe(3);
  });
});

describe("registry util: annotations", () => {
  it("mapTamboToolToContextTool includes annotations when present", () => {
    const tool: TamboTool = {
      name: "read-only-tool",
      description: "A tool that can be called with partial args",
      tool: () => {},
      inputSchema: z3.object({ text: z3.string() }),
      outputSchema: z3.string(),
      annotations: { readOnlyHint: true },
    };
    const meta = mapTamboToolToContextTool(tool);
    expect(meta.annotations).toEqual({ readOnlyHint: true });
  });

  it("mapTamboToolToContextTool does not include annotations when undefined", () => {
    const tool: TamboTool = {
      name: "regular-tool",
      description: "A regular tool",
      tool: () => {},
      inputSchema: z3.object({ text: z3.string() }),
      outputSchema: z3.string(),
    };
    const meta = mapTamboToolToContextTool(tool);
    expect(meta.annotations).toBeUndefined();
  });

  it("mapTamboToolToContextTool includes annotations with readOnlyHint: false when explicitly set", () => {
    const tool: TamboTool = {
      name: "explicit-non-read-only-tool",
      description: "A tool explicitly marked as non-read-only",
      tool: () => {},
      inputSchema: z3.object({ text: z3.string() }),
      outputSchema: z3.string(),
      annotations: { readOnlyHint: false },
    };
    const meta = mapTamboToolToContextTool(tool);
    expect(meta.annotations).toEqual({ readOnlyHint: false });
  });

  it("getUnassociatedTools preserves annotations", () => {
    const tool: TamboTool = {
      name: "streaming-tool",
      description: "A streaming tool",
      tool: () => {},
      inputSchema: {},
      outputSchema: {},
      annotations: { readOnlyHint: true },
    };
    const registry = { "streaming-tool": tool };
    const associations = { SomeComponent: [] as string[] };
    const out = getUnassociatedTools(registry, associations);
    expect(out.find((t) => t.name === "streaming-tool")?.annotations).toEqual({
      readOnlyHint: true,
    });
  });

  it("mapTamboToolToContextTool includes tamboStreamableHint annotation", () => {
    const tool: TamboTool = {
      name: "streamable-tool",
      description: "A tool safe to call during streaming",
      tool: () => {},
      inputSchema: z3.object({ text: z3.string() }),
      outputSchema: z3.string(),
      annotations: { tamboStreamableHint: true },
    };
    const meta = mapTamboToolToContextTool(tool);
    expect(meta.annotations).toEqual({ tamboStreamableHint: true });
  });

  it("mapTamboToolToContextTool preserves multiple combined annotations", () => {
    const tool: TamboTool = {
      name: "combined-annotations-tool",
      description: "A tool with multiple annotations",
      tool: () => {},
      inputSchema: z3.object({ text: z3.string() }),
      outputSchema: z3.string(),
      annotations: { readOnlyHint: true, tamboStreamableHint: true },
    };
    const meta = mapTamboToolToContextTool(tool);
    expect(meta.annotations).toEqual({
      readOnlyHint: true,
      tamboStreamableHint: true,
    });
  });
});

describe("convertPropsToJsonSchema", () => {
  it("should return undefined when component has no props", () => {
    const component = {
      name: "TestComponent",
      description: "A test component",
      component: () => null,
      props: undefined,
      contextTools: [],
    } as unknown as RegisteredComponent;
    expect(convertPropsToJsonSchema(component)).toBeUndefined();
  });

  it("should convert Standard Schema (Zod) props to JSON Schema", () => {
    const zodSchema = z4.object({
      title: z4.string(),
      count: z4.number(),
    });
    const component = {
      name: "TestComponent",
      description: "A test component",
      component: () => null,
      props: zodSchema,
      contextTools: [],
    } as unknown as RegisteredComponent;
    const result = convertPropsToJsonSchema(component);
    expect(result).toEqual(
      expect.objectContaining({
        type: "object",
        properties: expect.objectContaining({
          title: expect.objectContaining({ type: "string" }),
          count: expect.objectContaining({ type: "number" }),
        }),
      }),
    );
  });

  it("should pass through JSON Schema props as-is", () => {
    const jsonSchema: JSONSchema7 = {
      type: "object",
      properties: {
        title: { type: "string" },
        count: { type: "number" },
      },
    };
    const component = {
      name: "TestComponent",
      description: "A test component",
      component: () => null,
      props: jsonSchema,
      contextTools: [],
    } as unknown as RegisteredComponent;
    const result = convertPropsToJsonSchema(component);
    expect(result).toBe(jsonSchema); // Should be the same reference
  });

  it("should pass through unknown format as-is", () => {
    const unknownFormat = { custom: "format", notStandard: true };
    const component = {
      name: "TestComponent",
      description: "A test component",
      component: () => null,
      props: unknownFormat as unknown,
      contextTools: [],
    } as RegisteredComponent;
    const result = convertPropsToJsonSchema(component);
    expect(result).toBe(unknownFormat);
  });
});

describe("getComponentFromRegistry", () => {
  const mockRegistry: ComponentRegistry = {
    TestComponent: {
      name: "TestComponent",
      description: "A test component",
      component: () => null,
      props: { type: "object" },
      contextTools: [],
    },
    AnotherComponent: {
      name: "AnotherComponent",
      description: "Another component",
      component: () => null,
      props: { type: "object" },
      contextTools: [],
    },
  };

  it("should return component when found in registry", () => {
    const result = getComponentFromRegistry("TestComponent", mockRegistry);
    expect(result.name).toBe("TestComponent");
    expect(result.description).toBe("A test component");
  });

  it("should throw error when component not found", () => {
    expect(() => getComponentFromRegistry("NonExistent", mockRegistry)).toThrow(
      "Tambo tried to use Component NonExistent, but it was not found",
    );
  });

  it("should be case-sensitive for component names", () => {
    expect(() =>
      getComponentFromRegistry("testcomponent", mockRegistry),
    ).toThrow(
      "Tambo tried to use Component testcomponent, but it was not found",
    );
  });
});

describe("getAvailableComponents", () => {
  const mockComponent = () => null;

  const mockRegistry: ComponentRegistry = {
    TestComponent: {
      name: "TestComponent",
      description: "A test component",
      component: mockComponent,
      props: { type: "object", properties: { title: { type: "string" } } },
      contextTools: [],
    },
  };

  const mockTool = createMockTool({
    inputSchema: z4.object({ query: z4.string() }),
    outputSchema: z4.string(),
  });
  mockTool.name = "testTool";

  const mockToolRegistry: TamboToolRegistry = {
    testTool: mockTool,
  };

  it("should return available components with no tools when no associations", () => {
    const associations: TamboToolAssociations = {};
    const result = getAvailableComponents(
      mockRegistry,
      mockToolRegistry,
      associations,
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("TestComponent");
    expect(result[0].description).toBe("A test component");
    expect(result[0].contextTools).toHaveLength(0);
  });

  it("should include associated tools with components", () => {
    const associations: TamboToolAssociations = {
      TestComponent: ["testTool"],
    };
    const result = getAvailableComponents(
      mockRegistry,
      mockToolRegistry,
      associations,
    );

    expect(result).toHaveLength(1);
    expect(result[0].contextTools).toHaveLength(1);
    expect(result[0].contextTools?.[0].name).toBe("testTool");
  });

  it("should skip tools not found in registry", () => {
    const associations: TamboToolAssociations = {
      TestComponent: ["testTool", "nonExistentTool"],
    };
    const result = getAvailableComponents(
      mockRegistry,
      mockToolRegistry,
      associations,
    );

    expect(result[0].contextTools).toHaveLength(1);
    expect(result[0].contextTools?.[0].name).toBe("testTool");
  });

  it("should handle empty registries", () => {
    const result = getAvailableComponents({}, {}, {});
    expect(result).toHaveLength(0);
  });
});

describe("getUnassociatedTools", () => {
  const mockTool1 = createMockTool({
    inputSchema: z4.object({ a: z4.string() }),
    outputSchema: z4.void(),
  });
  mockTool1.name = "tool1";

  const mockTool2 = createMockTool({
    inputSchema: z4.object({ b: z4.string() }),
    outputSchema: z4.void(),
  });
  mockTool2.name = "tool2";

  const mockTool3 = createMockTool({
    inputSchema: z4.object({ c: z4.string() }),
    outputSchema: z4.void(),
  });
  mockTool3.name = "tool3";

  const mockToolRegistry: TamboToolRegistry = {
    tool1: mockTool1,
    tool2: mockTool2,
    tool3: mockTool3,
  };

  it("should return all tools when no associations exist", () => {
    const associations: TamboToolAssociations = {};
    const result = getUnassociatedTools(mockToolRegistry, associations);

    expect(result).toHaveLength(3);
    expect(result.map((t) => t.name)).toEqual(
      expect.arrayContaining(["tool1", "tool2", "tool3"]),
    );
  });

  it("should exclude tools that are associated with components", () => {
    const associations: TamboToolAssociations = {
      ComponentA: ["tool1"],
      ComponentB: ["tool2"],
    };
    const result = getUnassociatedTools(mockToolRegistry, associations);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("tool3");
  });

  it("should return empty array when all tools are associated", () => {
    const associations: TamboToolAssociations = {
      ComponentA: ["tool1", "tool2", "tool3"],
    };
    const result = getUnassociatedTools(mockToolRegistry, associations);

    expect(result).toHaveLength(0);
  });

  it("should handle empty tool registry", () => {
    const result = getUnassociatedTools({}, { ComponentA: ["tool1"] });
    expect(result).toHaveLength(0);
  });
});
