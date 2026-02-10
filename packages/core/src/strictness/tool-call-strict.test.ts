import { JSONSchema7, JSONSchema7Definition } from "json-schema";
import OpenAI from "openai";
import type { ToolCallRequest } from "../ComponentDecision";
import {
  canBeNull,
  unstrictifyToolCallRequest,
  unstrictifyToolCallParamsFromSchema,
} from "./tool-call-strict";

describe("unstrictifyToolCallRequest", () => {
  it("should return the original request if originalTool is undefined", () => {
    const toolCallRequest: ToolCallRequest = {
      toolName: "test",
      parameters: [{ parameterName: "name", parameterValue: "value" }],
    };

    const result = unstrictifyToolCallRequest(undefined, toolCallRequest);
    expect(result).toBe(toolCallRequest);
  });

  it("should return the original request if toolCallRequest is undefined", () => {
    const originalTool: OpenAI.Chat.Completions.ChatCompletionTool = {
      type: "function",
      function: {
        name: "test",
        parameters: {
          type: "object",
          properties: { name: { type: "string" } },
          required: ["name"],
        },
      },
    };

    const result = unstrictifyToolCallRequest(originalTool, undefined);
    expect(result).toBeUndefined();
  });

  it("should convert null values in non-required parameters to undefined", () => {
    const originalTool: OpenAI.Chat.Completions.ChatCompletionTool = {
      type: "function",
      function: {
        name: "test",
        parameters: {
          type: "object",
          properties: {
            required: { type: "string" },
            optional: { type: "string" },
          },
          required: ["required"],
        },
      },
    };

    const toolCallRequest: ToolCallRequest = {
      toolName: "test",
      parameters: [
        { parameterName: "required", parameterValue: "value" },
        { parameterName: "optional", parameterValue: null },
      ],
    };

    const result = unstrictifyToolCallRequest(originalTool, toolCallRequest);
    expect(result).toEqual({
      toolName: "test",
      parameters: [
        { parameterName: "required", parameterValue: "value" },
        // optional parameter with null value should be removed
      ],
    });
  });

  it("should keep null values in required parameters", () => {
    const originalTool: OpenAI.Chat.Completions.ChatCompletionTool = {
      type: "function",
      function: {
        name: "test",
        parameters: {
          type: "object",
          properties: {
            param1: { type: "string" },
            param2: { type: "string" },
          },
          required: ["param1", "param2"],
        },
      },
    };

    const toolCallRequest: ToolCallRequest = {
      toolName: "test",
      parameters: [
        { parameterName: "param1", parameterValue: null },
        { parameterName: "param2", parameterValue: "value" },
      ],
    };

    const result = unstrictifyToolCallRequest(originalTool, toolCallRequest);
    expect(result).toEqual(toolCallRequest);
  });

  it("should keep null values in parameters that can be null", () => {
    const originalTool: OpenAI.Chat.Completions.ChatCompletionTool = {
      type: "function",
      function: {
        name: "test",
        parameters: {
          type: "object",
          properties: {
            param1: {
              anyOf: [{ type: "string" }, { type: "null" }],
            },
            param2: { type: "string" },
          },
          required: [],
        },
      },
    };

    const toolCallRequest: ToolCallRequest = {
      toolName: "test",
      parameters: [
        { parameterName: "param1", parameterValue: null },
        { parameterName: "param2", parameterValue: null },
      ],
    };

    const result = unstrictifyToolCallRequest(originalTool, toolCallRequest);
    expect(result).toEqual({
      toolName: "test",
      parameters: [
        { parameterName: "param1", parameterValue: null },
        // param2 should be filtered out as it's not required and cannot be null
      ],
    });
  });

  it("should handle nested object parameters", () => {
    const originalTool: OpenAI.Chat.Completions.ChatCompletionTool = {
      type: "function",
      function: {
        name: "test",
        parameters: {
          type: "object",
          properties: {
            user: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
              },
              required: ["name"],
            },
          },
          required: ["user"],
        },
      },
    };

    const toolCallRequest: ToolCallRequest = {
      toolName: "test",
      parameters: [
        {
          parameterName: "user",
          parameterValue: {
            name: "John Doe",
            email: null,
          },
        },
      ],
    };

    const result = unstrictifyToolCallRequest(originalTool, toolCallRequest);
    expect(result).toEqual({
      toolName: "test",
      parameters: [
        {
          parameterName: "user",
          parameterValue: {
            name: "John Doe",
            // email should be removed as it's null and not required
          },
        },
      ],
    });
  });

  it("should keep optional nested objects even when all their properties become null", () => {
    // Start with an original schema that has an optional nested object
    const originalSchema: JSONSchema7 = {
      type: "object",
      properties: {
        config: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          required: [],
        },
      },
      required: [],
    };

    // Build the original tool from the original schema
    const originalTool: OpenAI.Chat.Completions.ChatCompletionTool = {
      type: "function",
      function: {
        name: "test",
        parameters: originalSchema as Record<string, unknown>,
      },
    };

    // Simulate what the LLM would return when given the strict schema
    // The strict schema makes all properties required and nullable,
    // so the LLM returns { config: { name: null } }
    const toolCallRequest: ToolCallRequest = {
      toolName: "test",
      parameters: [
        {
          parameterName: "config",
          parameterValue: {
            name: null,
          },
        },
      ],
    };

    const result = unstrictifyToolCallRequest(originalTool, toolCallRequest);
    expect(result).toEqual({
      toolName: "test",
      parameters: [
        {
          parameterName: "config",
          parameterValue: {
            // name should be removed as it's optional and null, but the config object itself is kept
          },
        },
      ],
    });
  });

  it("should handle nested objects with mix of required and optional properties", () => {
    // Original schema for { name?: string; key: string }
    // This creates a nested object where 'key' is required but 'name' is optional
    const originalSchema: JSONSchema7 = {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            name: { type: "string" },
            key: { type: "string" },
          },
          required: ["key"],
        },
      },
      required: ["user"],
    };

    // Build the original tool from the original schema
    const originalTool: OpenAI.Chat.Completions.ChatCompletionTool = {
      type: "function",
      function: {
        name: "test",
        parameters: originalSchema as Record<string, unknown>,
      },
    };

    // The strict schema makes all properties required and nullable,
    // so the LLM returns { user: { name: null, key: 'key1' } }
    const toolCallRequest: ToolCallRequest = {
      toolName: "test",
      parameters: [
        {
          parameterName: "user",
          parameterValue: {
            name: null,
            key: "key1",
          },
        },
      ],
    };

    const result = unstrictifyToolCallRequest(originalTool, toolCallRequest);
    expect(result).toEqual({
      toolName: "test",
      parameters: [
        {
          parameterName: "user",
          parameterValue: {
            key: "key1",
            // name should be removed since it's optional and null
          },
        },
      ],
    });
  });

  it("should remove null values from objects inside arrays", () => {
    // Original schema with array of objects containing optional properties
    const originalSchema: JSONSchema7 = {
      type: "object",
      properties: {
        targets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              range: { type: "string" },
              style: {
                type: "object",
                properties: {
                  bold: { type: "boolean" },
                  fontFamily: { type: "string" },
                  fontSize: { type: "number" },
                },
                required: [],
                additionalProperties: false,
              },
            },
            required: ["style"],
            additionalProperties: false,
          },
        },
      },
      required: ["targets"],
    };

    const originalTool: OpenAI.Chat.Completions.ChatCompletionTool = {
      type: "function",
      function: {
        name: "test",
        parameters: originalSchema as Record<string, unknown>,
      },
    };

    // LLM returns tool call with null optional properties inside array items
    const toolCallRequest: ToolCallRequest = {
      toolName: "test",
      parameters: [
        {
          parameterName: "targets",
          parameterValue: [
            {
              range: "A1:B1",
              style: {
                bold: true,
                fontFamily: null,
                fontSize: 12,
              },
            },
            {
              range: "A2:A6",
              style: {
                bold: false,
                fontFamily: null,
                fontSize: null,
              },
            },
          ],
        },
      ],
    };

    const result = unstrictifyToolCallRequest(originalTool, toolCallRequest);
    expect(result).toEqual({
      toolName: "test",
      parameters: [
        {
          parameterName: "targets",
          parameterValue: [
            {
              range: "A1:B1",
              style: {
                bold: true,
                fontSize: 12,
                // fontFamily should be removed as it's optional and null
              },
            },
            {
              range: "A2:A6",
              style: {
                bold: false,
                // fontFamily and fontSize should be removed as they're optional and null
              },
            },
          ],
        },
      ],
    });
  });

  it("should remove null values from optional properties in nested objects with no required array", () => {
    // Original schema like: { style?: { bold?: boolean; fontFamily?: string; backgroundColor?: string } }
    // When there's no 'required' array, ALL properties are implicitly optional
    const originalSchema: JSONSchema7 = {
      type: "object",
      properties: {
        style: {
          type: "object",
          properties: {
            bold: { type: "boolean" },
            fontFamily: { type: "string" },
            backgroundColor: { type: "string" },
          },
          additionalProperties: false,
          // NOTE: no 'required' array means all properties are optional
        },
      },
      required: [],
    };

    // Build the original tool from the original schema
    const originalTool: OpenAI.Chat.Completions.ChatCompletionTool = {
      type: "function",
      function: {
        name: "test",
        parameters: originalSchema as Record<string, unknown>,
      },
    };

    // The LLM returns { style: { bold: true, fontFamily: null, backgroundColor: "#E8F0FE" } }
    const toolCallRequest: ToolCallRequest = {
      toolName: "test",
      parameters: [
        {
          parameterName: "style",
          parameterValue: {
            bold: true,
            fontFamily: null,
            backgroundColor: "#E8F0FE",
          },
        },
      ],
    };

    const result = unstrictifyToolCallRequest(originalTool, toolCallRequest);
    expect(result).toEqual({
      toolName: "test",
      parameters: [
        {
          parameterName: "style",
          parameterValue: {
            bold: true,
            backgroundColor: "#E8F0FE",
            // fontFamily should be removed since it's optional and null
          },
        },
      ],
    });
  });

  it("should throw an error if parameter in tool call request not found in original tool", () => {
    const originalTool: OpenAI.Chat.Completions.ChatCompletionTool = {
      type: "function",
      function: {
        name: "test",
        parameters: {
          type: "object",
          properties: {
            param1: { type: "string" },
          },
          required: ["param1"],
        },
      },
    };

    const toolCallRequest: ToolCallRequest = {
      toolName: "test",
      parameters: [
        { parameterName: "param1", parameterValue: "value" },
        { parameterName: "unknownParam", parameterValue: "value" },
      ],
    };

    expect(() =>
      unstrictifyToolCallRequest(originalTool, toolCallRequest),
    ).toThrow(
      "Tool call request parameter unknownParam not found in original tool",
    );
  });

  it("should throw an error if originalToolParamSchema is not an object", () => {
    const originalTool: OpenAI.Chat.Completions.ChatCompletionTool = {
      type: "function",
      function: {
        name: "test",
        parameters: {
          type: "string", // Invalid type for parameters
        },
      },
    };

    const toolCallRequest: ToolCallRequest = {
      toolName: "test",
      parameters: [{ parameterName: "param", parameterValue: "value" }],
    };

    expect(() =>
      unstrictifyToolCallRequest(originalTool, toolCallRequest),
    ).toThrow(
      "tool call parameter schema must be an object, instead got string / object",
    );
  });
});

describe("canBeNull", () => {
  it("should return true for schema with type null", () => {
    const schema: JSONSchema7 = { type: "null" };
    expect(canBeNull(schema)).toBe(true);
  });

  it("should return true for schema with anyOf containing type null", () => {
    const schema: JSONSchema7 = {
      anyOf: [{ type: "string" }, { type: "null" }],
    };
    expect(canBeNull(schema)).toBe(true);
  });

  it("should return true for deeply nested anyOf containing type null", () => {
    const schema: JSONSchema7 = {
      anyOf: [
        { type: "string" },
        {
          anyOf: [{ type: "number" }, { type: "null" }],
        },
      ],
    };
    expect(canBeNull(schema)).toBe(true);
  });

  it("should return false for non-object schema", () => {
    expect(canBeNull(true)).toBe(false);
    expect(canBeNull("string" as JSONSchema7Definition)).toBe(false);
  });

  it("should return false for schema without null type", () => {
    const schema: JSONSchema7 = { type: "string" };
    expect(canBeNull(schema)).toBe(false);
  });

  it("should return false for schema with anyOf not containing null type", () => {
    const schema: JSONSchema7 = {
      anyOf: [{ type: "string" }, { type: "number" }],
    };
    expect(canBeNull(schema)).toBe(false);
  });
});

describe("unstrictifyToolCallParamsFromSchema", () => {
  it("should strip null values for optional non-nullable params", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name"],
    };

    const result = unstrictifyToolCallParamsFromSchema(schema, {
      name: "John",
      age: null,
    });

    expect(result).toEqual({ name: "John" });
  });

  it("should preserve pass-through params not in original schema", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    };

    const result = unstrictifyToolCallParamsFromSchema(schema, {
      name: "John",
      _tambo_statusMessage: "Processing...",
      _tambo_displayMessage: "Hello",
    });

    expect(result).toEqual({
      name: "John",
      _tambo_statusMessage: "Processing...",
      _tambo_displayMessage: "Hello",
    });
  });

  it("should handle nested object unstrictification with pass-through params", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
          },
          required: ["name"],
        },
      },
      required: ["user"],
    };

    const result = unstrictifyToolCallParamsFromSchema(schema, {
      user: { name: "John", email: null },
      _tambo_statusMessage: "Updating user",
    });

    expect(result).toEqual({
      user: { name: "John" },
      _tambo_statusMessage: "Updating user",
    });
  });

  it("should return params as-is for non-object schemas", () => {
    const schema: JSONSchema7 = { type: "string" };
    const params = { name: "John", _tambo_foo: "bar" };

    const result = unstrictifyToolCallParamsFromSchema(schema, params);

    expect(result).toEqual(params);
  });

  it("should handle empty params", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: [],
    };

    const result = unstrictifyToolCallParamsFromSchema(schema, {});

    expect(result).toEqual({});
  });

  it("should handle schema with no properties defined", () => {
    const schema: JSONSchema7 = {
      type: "object",
    };

    const result = unstrictifyToolCallParamsFromSchema(schema, {
      anything: "value",
      _tambo_status: "ok",
    });

    // Only _tambo_* keys pass through; unknown keys are dropped
    expect(result).toEqual({
      _tambo_status: "ok",
    });
  });

  it("should drop hallucinated keys not in schema or _tambo_* prefix", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        city: { type: "string" },
      },
      required: ["city"],
    };

    const result = unstrictifyToolCallParamsFromSchema(schema, {
      city: "NYC",
      temperatur: "celsius",
      _tambo_statusMessage: "Fetching",
    });

    expect(result).toEqual({
      city: "NYC",
      _tambo_statusMessage: "Fetching",
    });
  });
});
