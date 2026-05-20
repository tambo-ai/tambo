import type { JSONSchema7 } from "json-schema";
import type OpenAI from "openai";
import { ComponentContextToolMetadata } from "../../model/component-metadata";
import { convertMetadataToTools } from "./tool-service";

/** Narrow to the function tool variant (all tools from convertMetadataToTools are function tools). */
function asFunctionTool(
  tool: OpenAI.Chat.Completions.ChatCompletionTool & { maxCalls?: number },
): OpenAI.Chat.Completions.ChatCompletionFunctionTool & {
  maxCalls?: number;
} {
  if (tool.type !== "function") {
    throw new Error(`Expected function tool, got ${tool.type}`);
  }
  return tool;
}

/**
 * Simulates what the client-side `createParametersFromSchema` does:
 * extracts top-level properties from a JSON Schema object and stores
 * the full property schema in `parameter.schema`.
 *
 * This lets us write integration tests that verify the full pipeline
 * (JSON Schema → ParameterSpec → convertMetadataToTools → OpenAI tool)
 * without importing from the client package.
 */
function simulateClientParameterExtraction(
  jsonSchema: JSONSchema7,
): ComponentContextToolMetadata["parameters"] {
  const properties = jsonSchema.properties ?? {};
  const required = Array.isArray(jsonSchema.required)
    ? jsonSchema.required
    : [];

  return Object.entries(properties).map(([key, propSchema]) => {
    const prop =
      typeof propSchema === "object" && propSchema !== null ? propSchema : {};
    return {
      name: key,
      type: prop && "type" in prop ? (prop.type as string) : "object",
      description:
        prop && "description" in prop ? (prop.description ?? "") : "",
      isRequired: required.includes(key),
      schema: prop,
    };
  });
}

describe("convertMetadataToTools", () => {
  it("preserves nested object properties inside array items", () => {
    const toolMetadata: ComponentContextToolMetadata = {
      name: "update_cells",
      description: "Update spreadsheet cells",
      parameters: [
        {
          name: "cells",
          type: "array",
          description: "List of cell updates",
          isRequired: true,
          items: { type: "object" },
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                address: {
                  type: "string",
                  description: "Cell address in A1 notation",
                },
                value: {
                  type: ["string", "number", "null"],
                  description: "Cell value",
                },
              },
              required: ["address", "value"],
              additionalProperties: false,
            },
          },
        },
      ],
    };

    const [rawTool] = convertMetadataToTools([toolMetadata]);
    const tool = asFunctionTool(rawTool);
    const params = tool.function.parameters as {
      properties: Record<string, unknown>;
    };
    const cellsProp = params.properties["cells"] as {
      type: string;
      items: { type: string; properties?: Record<string, unknown> };
    };

    expect(cellsProp.type).toBe("array");
    expect(cellsProp.items.type).toBe("object");
    expect(cellsProp.items.properties).toEqual({
      address: { type: "string", description: "Cell address in A1 notation" },
      value: { type: ["string", "number", "null"], description: "Cell value" },
    });
  });

  it("uses schema for enum parameters when available", () => {
    const toolMetadata: ComponentContextToolMetadata = {
      name: "set_status",
      description: "Set status",
      parameters: [
        {
          name: "status",
          type: "enum",
          description: "The status",
          isRequired: true,
          enumValues: ["active", "inactive"],
          schema: {
            type: "string",
            enum: ["active", "inactive"],
            description: "The status",
          },
        },
      ],
    };

    const [rawTool] = convertMetadataToTools([toolMetadata]);
    const tool = asFunctionTool(rawTool);
    const params = tool.function.parameters as {
      properties: Record<string, unknown>;
    };
    const statusProp = params.properties["status"] as Record<string, unknown>;

    expect(statusProp.type).toBe("string");
    expect(statusProp.enum).toEqual(["active", "inactive"]);
    expect(statusProp.description).toBe("The status");
  });

  it("uses schema for object parameters when available", () => {
    const toolMetadata: ComponentContextToolMetadata = {
      name: "create_item",
      description: "Create an item",
      parameters: [
        {
          name: "config",
          type: "object",
          description: "Configuration",
          isRequired: true,
          schema: {
            type: "object",
            properties: {
              enabled: { type: "boolean" },
              threshold: { type: "number" },
            },
            required: ["enabled"],
            additionalProperties: false,
          },
        },
      ],
    };

    const [rawTool] = convertMetadataToTools([toolMetadata]);
    const tool = asFunctionTool(rawTool);
    const params = tool.function.parameters as {
      properties: Record<string, unknown>;
    };
    const configProp = params.properties["config"] as Record<string, unknown>;

    expect(configProp.type).toBe("object");
    expect(configProp.properties).toEqual({
      enabled: { type: "boolean" },
      threshold: { type: "number" },
    });
    expect(configProp.additionalProperties).toBe(false);
  });

  it("falls back gracefully for parameters without schema", () => {
    const toolMetadata: ComponentContextToolMetadata = {
      name: "legacy_tool",
      description: "Legacy tool without schema",
      parameters: [
        {
          name: "tags",
          type: "array",
          description: "Tag names",
          isRequired: true,
          items: { type: "string" },
        },
        {
          name: "mode",
          type: "enum",
          description: "Mode",
          isRequired: true,
          enumValues: ["fast", "slow"],
        },
        {
          name: "count",
          type: "number",
          description: "Count",
          isRequired: false,
        },
      ],
    };

    const [rawTool] = convertMetadataToTools([toolMetadata]);
    const tool = asFunctionTool(rawTool);
    const params = tool.function.parameters as {
      properties: Record<string, unknown>;
    };

    expect(params.properties["tags"]).toEqual({
      type: "array",
      items: { type: "string" },
    });
    expect(params.properties["mode"]).toEqual({
      type: "string",
      enum: ["fast", "slow"],
    });
    expect(params.properties["count"]).toEqual({ type: "number" });
  });

  it("sets required fields correctly", () => {
    const toolMetadata: ComponentContextToolMetadata = {
      name: "test_tool",
      description: "Test",
      parameters: [
        {
          name: "required_field",
          type: "string",
          description: "",
          isRequired: true,
          schema: { type: "string" },
        },
        {
          name: "optional_field",
          type: "string",
          description: "",
          isRequired: false,
          schema: { type: "string" },
        },
      ],
    };

    const [rawTool] = convertMetadataToTools([toolMetadata]);
    const tool = asFunctionTool(rawTool);
    const params = tool.function.parameters as { required: string[] };

    expect(params.required).toEqual(["required_field"]);
  });

  it("passes through maxCalls when present", () => {
    const toolMetadata: ComponentContextToolMetadata = {
      name: "limited_tool",
      description: "Tool with call limit",
      parameters: [],
      maxCalls: 3,
    };

    const [tool] = convertMetadataToTools([toolMetadata]);
    expect((tool as { maxCalls?: number }).maxCalls).toBe(3);
  });
});

describe("convertMetadataToTools integration: JSON Schema → ParameterSpec → OpenAI tool", () => {
  it("preserves nested array-of-objects through the full pipeline (TAM-1477 regression)", () => {
    // This is the exact JSON Schema that Zod produces for:
    //   z.object({
    //     cells: z.array(z.object({
    //       address: z.string().describe("Cell address in A1 notation"),
    //       value: z.union([z.string(), z.number(), z.null()]).describe("Cell value"),
    //     })),
    //     returnDetails: z.boolean().optional(),
    //   })
    const inputJsonSchema: JSONSchema7 = {
      type: "object",
      properties: {
        cells: {
          type: "array",
          items: {
            type: "object",
            properties: {
              address: {
                type: "string",
                description: "Cell address in A1 notation",
              },
              value: {
                type: ["string", "number", "null"],
                description: "Cell value",
              },
            },
            required: ["address", "value"],
            additionalProperties: false,
          },
        },
        returnDetails: {
          type: "boolean",
          description: "Whether to return details",
        },
      },
      required: ["cells"],
    };

    // Step 1: Simulate client-side parameter extraction
    const parameters = simulateClientParameterExtraction(inputJsonSchema);

    // Step 2: Build metadata (same as mapTamboToolToContextTool)
    const metadata: ComponentContextToolMetadata = {
      name: "update_cells",
      description: "Update spreadsheet cells",
      parameters,
    };

    // Step 3: Convert to OpenAI tool (what the LLM actually sees)
    const [rawTool] = convertMetadataToTools([metadata]);
    const tool = asFunctionTool(rawTool);
    const toolParams = tool.function.parameters as JSONSchema7;
    const props = toolParams.properties as Record<string, JSONSchema7>;

    // The LLM must see the full nested schema, not just { type: "array", items: { type: "object" } }
    const cellsProp = props["cells"];
    expect(cellsProp.type).toBe("array");

    const items = cellsProp.items as JSONSchema7;
    expect(items.type).toBe("object");
    expect(items.properties).toBeDefined();
    expect(
      (items.properties as Record<string, JSONSchema7>)["address"],
    ).toEqual({
      type: "string",
      description: "Cell address in A1 notation",
    });
    expect((items.properties as Record<string, JSONSchema7>)["value"]).toEqual({
      type: ["string", "number", "null"],
      description: "Cell value",
    });
    expect(items.required).toEqual(["address", "value"]);
    expect(items.additionalProperties).toBe(false);

    // Primitive top-level params should also survive
    expect(props["returnDetails"]).toEqual({
      type: "boolean",
      description: "Whether to return details",
    });
  });

  it("preserves nested objects through the full pipeline", () => {
    const inputJsonSchema: JSONSchema7 = {
      type: "object",
      properties: {
        config: {
          type: "object",
          properties: {
            database: {
              type: "object",
              properties: {
                host: { type: "string" },
                port: { type: "number" },
              },
              required: ["host"],
              additionalProperties: false,
            },
          },
          required: ["database"],
          additionalProperties: false,
        },
      },
      required: ["config"],
    };

    const parameters = simulateClientParameterExtraction(inputJsonSchema);
    const [rawTool] = convertMetadataToTools([
      { name: "configure", description: "Configure", parameters },
    ]);
    const tool = asFunctionTool(rawTool);
    const toolParams = tool.function.parameters as JSONSchema7;
    const configProp = (toolParams.properties as Record<string, JSONSchema7>)[
      "config"
    ];

    expect(configProp.type).toBe("object");
    const dbProp = (configProp.properties as Record<string, JSONSchema7>)[
      "database"
    ];
    expect(dbProp.type).toBe("object");
    expect((dbProp.properties as Record<string, JSONSchema7>)["host"]).toEqual({
      type: "string",
    });
  });

  it("preserves enum descriptions through the full pipeline", () => {
    const inputJsonSchema: JSONSchema7 = {
      type: "object",
      properties: {
        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Task priority level",
        },
      },
      required: ["priority"],
    };

    const parameters = simulateClientParameterExtraction(inputJsonSchema);
    const [rawTool] = convertMetadataToTools([
      { name: "set_priority", description: "Set priority", parameters },
    ]);
    const tool = asFunctionTool(rawTool);
    const toolParams = tool.function.parameters as JSONSchema7;
    const priorityProp = (toolParams.properties as Record<string, JSONSchema7>)[
      "priority"
    ];

    expect(priorityProp.type).toBe("string");
    expect(priorityProp.enum).toEqual(["low", "medium", "high"]);
    expect(priorityProp.description).toBe("Task priority level");
  });
});
