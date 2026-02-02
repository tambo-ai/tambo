import { describe, it, expect } from "vitest";
import { defineTool, assertValidName } from "./registry.js";

describe("defineTool", () => {
  it("should return the tool as-is when schemas are provided", () => {
    const tool = {
      name: "test_tool",
      description: "A test tool",
      tool: () => "result",
      inputSchema: {
        type: "object" as const,
        properties: { foo: { type: "string" as const } },
      },
      outputSchema: { type: "string" as const },
    };

    const result = defineTool(tool);
    expect(result).toEqual(tool);
  });

  it("should add default inputSchema when not provided", () => {
    const tool = {
      name: "test_tool",
      description: "A test tool",
      tool: () => "result",
    };

    const result = defineTool(tool);
    expect((result as { inputSchema?: unknown }).inputSchema).toEqual({
      type: "object",
      properties: {},
      required: [],
    });
  });

  it("should add default outputSchema when not provided", () => {
    const tool = {
      name: "test_tool",
      description: "A test tool",
      tool: () => "result",
    };

    const result = defineTool(tool);
    expect((result as { outputSchema?: unknown }).outputSchema).toEqual({
      type: "object",
      properties: {},
      required: [],
    });
  });

  it("should preserve other tool properties", () => {
    const tool = {
      name: "test_tool",
      description: "A test tool",
      title: "Test Tool Title",
      maxCalls: 5,
      tool: () => "result",
    };

    const result = defineTool(tool);
    expect(result.name).toBe("test_tool");
    expect(result.description).toBe("A test tool");
    expect(result.title).toBe("Test Tool Title");
    expect(result.maxCalls).toBe(5);
  });
});

describe("assertValidName", () => {
  describe("valid names", () => {
    it("should accept simple alphanumeric names", () => {
      expect(() => assertValidName("MyComponent", "component")).not.toThrow();
      expect(() => assertValidName("getData", "tool")).not.toThrow();
    });

    it("should accept names with underscores", () => {
      expect(() => assertValidName("my_component", "component")).not.toThrow();
      expect(() => assertValidName("get_user_data", "tool")).not.toThrow();
    });

    it("should accept names with hyphens", () => {
      expect(() => assertValidName("my-component", "component")).not.toThrow();
      expect(() => assertValidName("get-user-data", "tool")).not.toThrow();
    });

    it("should accept names with numbers", () => {
      expect(() => assertValidName("Component2", "component")).not.toThrow();
      expect(() => assertValidName("v2Tool", "tool")).not.toThrow();
    });

    it("should accept single character names", () => {
      expect(() => assertValidName("A", "component")).not.toThrow();
      expect(() => assertValidName("x", "tool")).not.toThrow();
    });
  });

  describe("invalid names", () => {
    it("should reject empty string", () => {
      expect(() => assertValidName("", "component")).toThrow(
        "component name must be a non-empty string",
      );
    });

    it("should reject names starting with numbers", () => {
      expect(() => assertValidName("123Component", "component")).toThrow(
        'component name "123Component" is invalid',
      );
    });

    it("should reject names starting with underscores", () => {
      expect(() => assertValidName("_private", "tool")).toThrow(
        'tool name "_private" is invalid',
      );
    });

    it("should reject names starting with hyphens", () => {
      expect(() => assertValidName("-component", "component")).toThrow(
        'component name "-component" is invalid',
      );
    });

    it("should reject names with spaces", () => {
      expect(() => assertValidName("my component", "component")).toThrow(
        'component name "my component" is invalid',
      );
    });

    it("should reject names with special characters", () => {
      expect(() => assertValidName("get@data", "tool")).toThrow(
        'tool name "get@data" is invalid',
      );
      expect(() => assertValidName("component.name", "component")).toThrow(
        'component name "component.name" is invalid',
      );
    });

    it("should reject names longer than 60 characters", () => {
      const longName = "a".repeat(61);
      expect(() => assertValidName(longName, "component")).toThrow(
        "is too long",
      );
    });

    it("should accept names exactly 60 characters", () => {
      const exactName = "a".repeat(60);
      expect(() => assertValidName(exactName, "component")).not.toThrow();
    });
  });
});
