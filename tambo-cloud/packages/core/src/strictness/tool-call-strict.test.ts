import type { ToolCallRequest } from "../ComponentDecision";
import { JSONSchema7, JSONSchema7Definition } from "json-schema";
import OpenAI from "openai";
import { canBeNull, unstrictifyToolCallRequest } from "./tool-call-strict";

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
        } as any,
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
