import { z } from "zod/v3";
import type { TamboComponent, TamboTool } from "../model/component-metadata";
import {
  validateAndPrepareComponent,
  validateTool,
  validateToolAssociation,
} from "./registry-validators";

describe("validateTool", () => {
  it("should validate tool with valid name", () => {
    const tool: TamboTool = {
      name: "valid-tool-name",
      description: "A valid tool",
      tool: () => "result",
      inputSchema: z.object({ query: z.string() }),
      outputSchema: z.string(),
    };

    expect(() => validateTool(tool)).not.toThrow();
  });

  it("should throw when tool name contains invalid characters", () => {
    const tool: TamboTool = {
      name: "invalid tool name",
      description: "A tool",
      tool: () => "result",
      inputSchema: z.object({ query: z.string() }),
      outputSchema: z.string(),
    };

    expect(() => validateTool(tool)).toThrow(
      'tool "invalid tool name" must only contain letters, numbers, underscores, and hyphens.',
    );
  });

  it("should throw when tool name contains special characters", () => {
    const tool: TamboTool = {
      name: "tool@name",
      description: "A tool",
      tool: () => "result",
      inputSchema: z.object({ query: z.string() }),
      outputSchema: z.string(),
    };

    expect(() => validateTool(tool)).toThrow(
      'tool "tool@name" must only contain letters, numbers, underscores, and hyphens.',
    );
  });

  it("should throw when deprecated toolSchema is used", () => {
    const tool = {
      name: "deprecated-tool",
      description: "A tool using deprecated API",
      tool: () => "result",
      toolSchema: z.function().args().returns(z.string()),
    } as unknown as TamboTool;

    expect(() => validateTool(tool)).toThrow(
      'Tool "deprecated-tool" uses deprecated "toolSchema" property.',
    );
    expect(() => validateTool(tool)).toThrow(
      'Migrate to "inputSchema" and "outputSchema" properties.',
    );
  });

  it("should throw when tool is not an object", () => {
    expect(() => validateTool(null)).toThrow("Tool must be an object");
    expect(() => validateTool(undefined)).toThrow("Tool must be an object");
    expect(() => validateTool("string")).toThrow("Tool must be an object");
    expect(() => validateTool(42)).toThrow("Tool must be an object");
  });

  it("should throw when tool name is missing", () => {
    const tool = {
      description: "A tool",
      tool: () => "result",
      inputSchema: z.object({}),
      outputSchema: z.string(),
    };

    expect(() => validateTool(tool)).toThrow(
      "Tool must have a 'name' property of type string",
    );
  });

  it("should throw when tool description is missing", () => {
    const tool = {
      name: "my-tool",
      tool: () => "result",
      inputSchema: z.object({}),
      outputSchema: z.string(),
    };

    expect(() => validateTool(tool)).toThrow(
      "Tool \"my-tool\" must have a 'description' property of type string",
    );
  });

  it("should throw when tool function is missing", () => {
    const tool = {
      name: "my-tool",
      description: "A tool",
      inputSchema: z.object({}),
      outputSchema: z.string(),
    };

    expect(() => validateTool(tool)).toThrow(
      "Tool \"my-tool\" must have a 'tool' property of type function",
    );
  });

  it("should throw when inputSchema is missing", () => {
    const tool = {
      name: "my-tool",
      description: "A tool",
      tool: () => "result",
      outputSchema: z.string(),
    };

    expect(() => validateTool(tool)).toThrow(
      "Tool \"my-tool\" must have an 'inputSchema' property",
    );
  });

  it("should throw when outputSchema is missing", () => {
    const tool = {
      name: "my-tool",
      description: "A tool",
      tool: () => "result",
      inputSchema: z.object({}),
    };

    expect(() => validateTool(tool)).toThrow(
      "Tool \"my-tool\" must have an 'outputSchema' property",
    );
  });

  it("should throw when inputSchema contains z.record()", () => {
    const tool: TamboTool = {
      name: "invalid-tool",
      description: "A tool",
      tool: () => "result",
      inputSchema: z.object({
        metadata: z.record(z.string()),
      }),
      outputSchema: z.string(),
    };

    expect(() => validateTool(tool)).toThrow(
      'Record types (objects with dynamic keys) are not supported in inputSchema of tool "invalid-tool".',
    );
  });

  it("should validate tool with inputSchema (new interface)", () => {
    const tool: TamboTool = {
      name: "tool-with-input-schema",
      description: "A tool with input schema",
      tool: (input: { query: string }) => input.query,
      inputSchema: z.object({
        query: z.string(),
      }),
      outputSchema: z.string(),
    };

    expect(() => validateTool(tool)).not.toThrow();
  });

  it("should throw when inputSchema is not an object schema (string)", () => {
    const tool: TamboTool = {
      name: "tool-with-string-schema",
      description: "A tool with invalid schema",
      tool: () => "result",
      inputSchema: z.string(),
      outputSchema: z.string(),
    };

    expect(() => validateTool(tool)).toThrow(
      'inputSchema of tool "tool-with-string-schema" must be an object schema',
    );
  });

  it("should throw when inputSchema is not an object schema (number)", () => {
    const tool: TamboTool = {
      name: "tool-with-number-schema",
      description: "A tool with invalid schema",
      tool: () => "result",
      inputSchema: z.number(),
      outputSchema: z.string(),
    };

    expect(() => validateTool(tool)).toThrow(
      'inputSchema of tool "tool-with-number-schema" must be an object schema',
    );
  });

  it("should throw when inputSchema is not an object schema (array)", () => {
    const tool: TamboTool = {
      name: "tool-with-array-schema",
      description: "A tool with invalid schema",
      tool: () => "result",
      inputSchema: z.array(z.string()),
      outputSchema: z.string(),
    };

    expect(() => validateTool(tool)).toThrow(
      'inputSchema of tool "tool-with-array-schema" must be an object schema',
    );
  });

  it("should throw when inputSchema JSON Schema is not an object type", () => {
    const tool: TamboTool = {
      name: "tool-with-json-string-schema",
      description: "A tool with invalid JSON schema",
      tool: () => "result",
      inputSchema: { type: "string" },
      outputSchema: { type: "string" },
    };

    expect(() => validateTool(tool)).toThrow(
      'inputSchema of tool "tool-with-json-string-schema" must be an object schema',
    );
  });

  it("should accept JSON Schema with object type", () => {
    const tool: TamboTool = {
      name: "tool-with-json-object-schema",
      description: "A tool with valid JSON schema",
      tool: () => "result",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
      },
      outputSchema: { type: "string" },
    };

    expect(() => validateTool(tool)).not.toThrow();
  });

  it("should accept JSON Schema with properties but no explicit type", () => {
    const tool: TamboTool = {
      name: "tool-with-implicit-object-schema",
      description: "A tool with implicit object schema",
      tool: () => "result",
      inputSchema: {
        properties: {
          query: { type: "string" },
        },
      },
      outputSchema: { type: "string" },
    };

    expect(() => validateTool(tool)).not.toThrow();
  });

  describe("maxCalls validation", () => {
    it("should throw when maxCalls is a negative integer", () => {
      const tool: TamboTool = {
        name: "tool-with-negative-maxcalls",
        description: "A tool with negative maxCalls",
        tool: () => "result",
        inputSchema: z.object({ query: z.string() }),
        outputSchema: z.string(),
        maxCalls: -1,
      };

      expect(() => validateTool(tool)).toThrow(
        'maxCalls for tool "tool-with-negative-maxcalls" must be a positive integer',
      );
    });

    it("should throw when maxCalls is a decimal number", () => {
      const tool: TamboTool = {
        name: "tool-with-decimal-maxcalls",
        description: "A tool with decimal maxCalls",
        tool: () => "result",
        inputSchema: z.object({ query: z.string() }),
        outputSchema: z.string(),
        maxCalls: 1.5,
      };

      expect(() => validateTool(tool)).toThrow(
        'maxCalls for tool "tool-with-decimal-maxcalls" must be a positive integer',
      );
    });

    it("should throw when maxCalls is NaN", () => {
      const tool: TamboTool = {
        name: "tool-with-nan-maxcalls",
        description: "A tool with NaN maxCalls",
        tool: () => "result",
        inputSchema: z.object({ query: z.string() }),
        outputSchema: z.string(),
        maxCalls: NaN,
      };

      expect(() => validateTool(tool)).toThrow(
        'maxCalls for tool "tool-with-nan-maxcalls" must be a positive integer',
      );
    });

    it("should accept tool with maxCalls as zero", () => {
      const tool: TamboTool = {
        name: "tool-with-zero-maxcalls",
        description: "A tool with zero maxCalls",
        tool: () => "result",
        inputSchema: z.object({ query: z.string() }),
        outputSchema: z.string(),
        maxCalls: 0,
      };

      expect(() => validateTool(tool)).not.toThrow();
    });

    it("should accept tool with explicitly undefined maxCalls", () => {
      const tool: TamboTool = {
        name: "tool-with-undefined-maxcalls",
        description: "A tool with undefined maxCalls",
        tool: () => "result",
        inputSchema: z.object({ query: z.string() }),
        outputSchema: z.string(),
        maxCalls: undefined,
      };

      expect(() => validateTool(tool)).not.toThrow();
    });
  });
});

describe("validateAndPrepareComponent", () => {
  it("should validate component with propsSchema", () => {
    const component: TamboComponent = {
      name: "valid-component",
      description: "A valid component",
      component: () => null,
      propsSchema: z.object({
        title: z.string(),
        count: z.number(),
      }),
    };

    const result = validateAndPrepareComponent(component);

    expect(result.props).toBeDefined();
    expect(result.props.type).toBe("object");
    expect(result.props.properties).toBeDefined();
  });

  it("should validate component with propsDefinition", () => {
    const component: TamboComponent = {
      name: "valid-component",
      description: "A valid component",
      component: () => null,
      propsDefinition: {
        type: "object",
        properties: {
          title: { type: "string" },
        },
      },
    };

    const result = validateAndPrepareComponent(component);

    expect(result.props).toEqual(component.propsDefinition);
  });

  it("should throw when component name contains invalid characters", () => {
    const component: TamboComponent = {
      name: "invalid component name",
      description: "A component",
      component: () => null,
      propsSchema: z.object({}),
    };

    expect(() => validateAndPrepareComponent(component)).toThrow(
      'component "invalid component name" must only contain letters, numbers, underscores, and hyphens.',
    );
  });

  it("should throw when neither propsSchema nor propsDefinition is provided", () => {
    const component: TamboComponent = {
      name: "component-without-props",
      description: "A component",
      component: () => null,
    };

    expect(() => validateAndPrepareComponent(component)).toThrow(
      "Component component-without-props must have either propsSchema (recommended) or propsDefinition defined",
    );
  });

  it("should throw when both propsSchema and propsDefinition are provided", () => {
    const component: TamboComponent = {
      name: "component-with-both",
      description: "A component",
      component: () => null,
      propsSchema: z.object({}),
      propsDefinition: {
        type: "object",
        properties: {},
      },
    };

    expect(() => validateAndPrepareComponent(component)).toThrow(
      "Component component-with-both cannot have both propsSchema and propsDefinition defined. Use only one. We recommend using propsSchema.",
    );
  });

  it("should throw when propsSchema contains z.record()", () => {
    const component: TamboComponent = {
      name: "component-with-record",
      description: "A component",
      component: () => null,
      propsSchema: z.object({
        metadata: z.record(z.string()),
      }),
    };

    expect(() => validateAndPrepareComponent(component)).toThrow(
      'Record types (objects with dynamic keys) are not supported in propsSchema of component "component-with-record".',
    );
  });

  it("should convert Zod schema to JSON Schema", () => {
    const component: TamboComponent = {
      name: "component-with-zod",
      description: "A component",
      component: () => null,
      propsSchema: z.object({
        title: z.string().describe("The title"),
        count: z.number().int().min(0),
        tags: z.array(z.string()),
      }),
    };

    const result = validateAndPrepareComponent(component);

    expect(result.props).toBeDefined();
    expect(result.props.type).toBe("object");
    expect((result.props as any).properties).toBeDefined();
    expect((result.props as any).properties.title).toBeDefined();
    expect((result.props as any).properties.count).toBeDefined();
    expect((result.props as any).properties.tags).toBeDefined();
  });

  it("should handle complex Zod schema", () => {
    const component: TamboComponent = {
      name: "component-complex",
      description: "A component",
      component: () => null,
      propsSchema: z.object({
        user: z.object({
          name: z.string(),
          age: z.number(),
        }),
        items: z.array(
          z.object({
            id: z.string(),
            value: z.number(),
          }),
        ),
      }),
    };

    const result = validateAndPrepareComponent(component);

    expect(result.props).toBeDefined();
    expect(result.props.type).toBe("object");
  });

  it("should allow JSON Schema (non-Zod) without validation", () => {
    const component: TamboComponent = {
      name: "component-json-schema",
      description: "A component",
      component: () => null,
      propsSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
        },
      },
    };

    const result = validateAndPrepareComponent(component);

    expect(result.props).toEqual(component.propsSchema);
  });
});

describe("validateToolAssociation", () => {
  it("should validate valid tool association", () => {
    expect(() =>
      validateToolAssociation("valid-component", "valid-tool", true, true),
    ).not.toThrow();
  });

  it("should throw when component name is invalid", () => {
    expect(() =>
      validateToolAssociation("invalid component", "valid-tool", true, true),
    ).toThrow(
      'component "invalid component" must only contain letters, numbers, underscores, and hyphens.',
    );
  });

  it("should throw when tool name is invalid", () => {
    expect(() =>
      validateToolAssociation("valid-component", "invalid tool", true, true),
    ).toThrow(
      'tool "invalid tool" must only contain letters, numbers, underscores, and hyphens.',
    );
  });

  it("should throw when component does not exist", () => {
    expect(() =>
      validateToolAssociation("missing-component", "valid-tool", false, true),
    ).toThrow("Component missing-component not found in registry");
  });

  it("should throw when tool does not exist", () => {
    expect(() =>
      validateToolAssociation("valid-component", "missing-tool", true, false),
    ).toThrow("Tool missing-tool not found in registry");
  });

  it("should throw when both component and tool do not exist", () => {
    expect(() => {
      validateToolAssociation(
        "missing-component",
        "missing-tool",
        false,
        false,
      );
    }).toThrow("Component missing-component not found in registry");
  });

  it("should validate with valid names containing underscores and hyphens", () => {
    expect(() =>
      validateToolAssociation("my_component-123", "my_tool-456", true, true),
    ).not.toThrow();
  });
});
