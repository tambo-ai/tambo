import { JSONSchema7Definition } from "json-schema";
import { sanitizeJSONSchemaProperties } from "./json-schema";

describe("sanitizeJSONSchemaProperties", () => {
  it("should handle empty properties object", () => {
    const result = sanitizeJSONSchemaProperties({}, []);
    expect(result).toEqual({});
  });

  it("should sanitize simple string property", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      name: { type: "string", description: "User name" },
    };
    const result = sanitizeJSONSchemaProperties(properties, []);
    expect(result).toEqual({
      name: {
        type: "string",
        description: "User name",
      },
    });
  });

  it("should handle required properties", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      name: { type: "string", description: "User name" },
      age: { type: "number", description: "User age" },
    };
    const result = sanitizeJSONSchemaProperties(properties, ["name"]);
    expect(result).toEqual({
      name: {
        type: "string",
        description: "User name",
      },
      age: {
        type: "number",
        description: "User age",
      },
    });
  });

  it("should handle nested object properties", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      user: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      },
    };
    const result = sanitizeJSONSchemaProperties(properties, ["user"]);
    expect(result).toEqual({
      user: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name", "age"],
        additionalProperties: false,
      },
    });
  });

  it("should handle array properties", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      tags: {
        type: "array",
        items: { type: "string" },
      },
    };
    const result = sanitizeJSONSchemaProperties(properties, ["tags"]);
    expect(result).toEqual({
      tags: {
        type: "array",
        items: { type: "string" },
      },
    });
  });

  it("should remove format and default properties", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      email: {
        type: "string",
        format: "email",
        default: "test@example.com",
        description: "User email",
      },
    };
    const result = sanitizeJSONSchemaProperties(properties, ["email"]);
    expect(result).toEqual({
      email: {
        type: "string",
        description: "User email",
      },
    });
  });

  it("should handle boolean schema definitions", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      isActive: true,
      isArchived: false,
    };
    const result = sanitizeJSONSchemaProperties(properties, ["isActive"]);
    expect(result).toEqual({
      isActive: true,
      isArchived: {
        anyOf: [{ type: "null" }, false],
      },
    });
  });

  it("should handle array with multiple item types", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      mixed: {
        type: "array",
        items: [{ type: "string" }, { type: "number" }],
      },
    };
    const result = sanitizeJSONSchemaProperties(properties, ["mixed"]);
    expect(result).toEqual({
      mixed: {
        type: "array",
        items: [{ type: "string" }, { type: "number" }],
      },
    });
  });

  it("should handle non-required object properties by adding null type option", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      profile: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      },
    };
    const result = sanitizeJSONSchemaProperties(properties, []);
    expect(result).toEqual({
      profile: {
        anyOf: [
          { type: "null" },
          {
            type: "object",
            properties: {
              name: { type: "string" },
              age: { type: "number" },
            },
            required: ["name", "age"],
            additionalProperties: false,
          },
        ],
      },
    });
  });

  it("should handle non-required array properties by adding null type option", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      hobbies: {
        type: "array",
        items: { type: "string" },
        description: "List of hobbies",
      },
    };
    const result = sanitizeJSONSchemaProperties(properties, []);
    expect(result).toEqual({
      hobbies: {
        anyOf: [
          { type: "null" },
          {
            type: "array",
            items: { type: "string" },
            description: "List of hobbies",
          },
        ],
      },
    });
  });

  it("should be idempotent - running the function twice should produce the same result", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      // Simple types
      name: { type: "string", description: "User name" },
      age: { type: "number", minimum: 0 },
      isActive: true,
      isArchived: false,

      // Object with nested properties
      profile: {
        type: "object",
        properties: {
          email: {
            type: "string",
            format: "email",
            default: "test@example.com",
          },
          address: {
            type: "object",
            properties: {
              street: { type: "string" },
              city: { type: "string" },
              zipCode: { type: "string", pattern: "^\\d{5}$" },
            },
          },
        },
      },

      // Arrays of different types
      tags: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
      },
      scores: {
        type: "array",
        items: { type: "number" },
        maxItems: 5,
      },
      mixedArray: {
        type: "array",
        items: [{ type: "string" }, { type: "number" }, { type: "boolean" }],
      },
    };

    const requiredProps = ["name", "profile", "tags"];

    // First pass
    const firstPass = sanitizeJSONSchemaProperties(properties, requiredProps);

    // Second pass - should be identical to first pass
    const secondPass = sanitizeJSONSchemaProperties(firstPass, requiredProps);

    // Verify specific properties to make debugging easier if full check fails
    expect(secondPass.name).toEqual(firstPass.name);
    expect(secondPass.age).toEqual(firstPass.age);
    expect(secondPass.profile).toEqual(firstPass.profile);
    expect(secondPass.tags).toEqual(firstPass.tags);
    expect(secondPass.mixedArray).toEqual(firstPass.mixedArray);

    // Deep equality check
    expect(secondPass).toEqual(firstPass);
  });
});
