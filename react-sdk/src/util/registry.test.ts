/**
 * Tests for registry utilities:
 * - getParametersFromToolSchema via mapTamboToolToContextTool
 * - convertPropsToJsonSchema
 * - adaptToolFromFnSchema
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
  TamboToolAssociations,
  TamboToolRegistry,
} from "../model/component-metadata";
import { createMockTool, createMockToolWithToolSchema } from "../testing/tools";
import {
  adaptToolFromFnSchema,
  convertPropsToJsonSchema,
  getAvailableComponents,
  getComponentFromRegistry,
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

describe("adaptToolFromFnSchema", () => {
  it("should return tool unchanged when it has inputSchema (new interface)", () => {
    const tool = createMockTool({
      inputSchema: z4.object({ name: z4.string() }),
      outputSchema: z4.string(),
    });
    const result = adaptToolFromFnSchema(tool);
    expect(result).toBe(tool); // Same reference
    expect(result.inputSchema).toBeDefined();
  });

  it("should adapt toolSchema to inputSchema/outputSchema", () => {
    const tool = createMockToolWithToolSchema(
      z3
        .function()
        .args(z3.string().describe("Name"), z3.number().describe("Age"))
        .returns(z3.boolean()),
    );
    const result = adaptToolFromFnSchema(tool);
    expect(result.inputSchema).toBeDefined();
    expect(result.outputSchema).toBeDefined();
    expect("toolSchema" in result).toBe(false);
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
