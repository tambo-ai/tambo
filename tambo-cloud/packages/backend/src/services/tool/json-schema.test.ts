import { JSONSchema7Definition } from "json-schema";
import { strictifyJSONSchemaProperties } from "./json-schema";

describe("strictifyJSONSchemaProperties", () => {
  it("should handle empty properties object", () => {
    const result = strictifyJSONSchemaProperties({}, []);
    expect(result).toEqual({});
  });

  it("should sanitize simple string property", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      name: { type: "string", description: "User name" },
    };
    const result = strictifyJSONSchemaProperties(properties, []);
    expect(result).toEqual({
      name: {
        anyOf: [
          { type: "null" },
          {
            type: "string",
            description: "User name",
          },
        ],
      },
    });
  });

  it("should handle required properties", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      name: { type: "string", description: "User name" },
      age: { type: "number", description: "User age" },
    };
    const result = strictifyJSONSchemaProperties(properties, ["name"]);
    expect(result).toEqual({
      name: {
        type: "string",
        description: "User name",
      },
      age: {
        anyOf: [
          { type: "null" },
          {
            type: "number",
            description: "User age",
          },
        ],
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
    const result = strictifyJSONSchemaProperties(properties, ["user"]);
    expect(result).toEqual({
      user: {
        type: "object",
        properties: {
          name: {
            anyOf: [{ type: "null" }, { type: "string" }],
          },
          age: {
            anyOf: [{ type: "null" }, { type: "number" }],
          },
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
    const result = strictifyJSONSchemaProperties(properties, ["tags"]);
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
    const result = strictifyJSONSchemaProperties(properties, ["email"]);
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
    const result = strictifyJSONSchemaProperties(properties, ["isActive"]);
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
    const result = strictifyJSONSchemaProperties(properties, ["mixed"]);
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
    const result = strictifyJSONSchemaProperties(properties, []);
    expect(result).toEqual({
      profile: {
        anyOf: [
          { type: "null" },
          {
            type: "object",
            properties: {
              name: {
                anyOf: [{ type: "null" }, { type: "string" }],
              },
              age: {
                anyOf: [{ type: "null" }, { type: "number" }],
              },
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
    const result = strictifyJSONSchemaProperties(properties, []);
    expect(result).toEqual({
      hobbies: {
        anyOf: [
          { type: "null" },
          {
            type: "array",
            items: {
              anyOf: [{ type: "null" }, { type: "string" }],
            },
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
            required: ["street", "city", "zipCode"],
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
    const firstPass = strictifyJSONSchemaProperties(properties, requiredProps);

    // Second pass - should be identical to first pass
    const secondPass = strictifyJSONSchemaProperties(
      firstPass,
      Object.keys(firstPass),
    );

    // Verify specific properties to make debugging easier if full check fails
    expect(secondPass.name).toEqual(firstPass.name);
    expect(secondPass.age).toEqual(firstPass.age);
    expect(secondPass.profile).toEqual(firstPass.profile);
    expect(secondPass.tags).toEqual(firstPass.tags);
    expect(secondPass.mixedArray).toEqual(firstPass.mixedArray);

    // Deep equality check
    expect(secondPass).toEqual(firstPass);
  });

  it("should handle anyOf with nested objects that have non-required properties", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      userOrContact: {
        anyOf: [
          {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
              age: { type: "number" },
            },
            required: ["name", "email"],
          },
          {
            type: "object",
            properties: {
              companyName: { type: "string" },
              contactPerson: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  position: { type: "string" },
                },
                required: ["name"],
              },
            },
            required: ["companyName"],
          },
        ],
      },
    };

    const result = strictifyJSONSchemaProperties(properties, ["userOrContact"]);

    const firstPass: Record<string, JSONSchema7Definition> = {
      userOrContact: {
        anyOf: [
          {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
              age: {
                anyOf: [{ type: "null" }, { type: "number" }],
              },
            },
            required: ["name", "email", "age"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              companyName: { type: "string" },
              contactPerson: {
                anyOf: [
                  { type: "null" },
                  {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      position: {
                        anyOf: [{ type: "null" }, { type: "string" }],
                      },
                    },
                    required: ["name", "position"],
                    additionalProperties: false,
                  },
                ],
              },
            },
            required: ["companyName", "contactPerson"],
            additionalProperties: false,
          },
        ],
      },
    };
    expect(result).toEqual(firstPass);
    const secondPass = strictifyJSONSchemaProperties(firstPass, [
      "userOrContact",
    ]);
    expect(secondPass).toEqual(firstPass);
  });

  it("should strip all JSON Schema validation properties", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      // String with validation props
      title: {
        type: "string",
        minLength: 3,
        maxLength: 100,
        pattern: "^[A-Za-z0-9 ]+$",
        format: "text",
        default: "Untitled",
        examples: ["Example Title"],
      },

      // Number with validation props
      age: {
        type: "number",
        minimum: 0,
        maximum: 120,
        exclusiveMinimum: 0,
        exclusiveMaximum: 121,
        multipleOf: 1,
        default: 18,
      },

      // Array with validation props
      tags: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 10,
        default: ["general"],
        examples: [["tag1", "tag2"]],
      },

      // Object with validation props and nested properties with validation
      metadata: {
        type: "object",
        properties: {
          created: {
            type: "string",
            format: "date-time",
            default: "2023-01-01T00:00:00Z",
          },
          binary: {
            type: "string",
            // these do not need to be removed
            contentEncoding: "base64",
            contentMediaType: "image/png",
          },
        },
        default: { created: "2023-01-01T00:00:00Z" },
      },
    };

    const result = strictifyJSONSchemaProperties(properties, ["title"]);

    // Verify title (required) has validation props removed
    expect(result.title).toEqual({ type: "string" });

    // Verify age (optional) has validation props removed and is nullable
    expect(result.age).toEqual({
      anyOf: [{ type: "null" }, { type: "number" }],
    });

    // Verify tags (optional) has validation props removed and is nullable
    expect(result.tags).toEqual({
      anyOf: [
        { type: "null" },
        {
          type: "array",
          items: { anyOf: [{ type: "null" }, { type: "string" }] },
        },
      ],
    });

    // Verify nested objects have validation props removed
    const metadata = result.metadata as any;
    expect(metadata).toHaveProperty("anyOf");

    // Check the object part of the anyOf
    const objectPart = metadata.anyOf[1];
    expect(objectPart).toHaveProperty("type", "object");

    // Check nested properties
    const nestedProps = objectPart.properties;
    expect(nestedProps.created).toEqual({
      anyOf: [{ type: "null" }, { type: "string" }],
    });
    expect(nestedProps.binary).toEqual({
      anyOf: [
        { type: "null" },
        {
          contentEncoding: "base64",
          contentMediaType: "image/png",

          type: "string",
        },
      ],
    });

    // Make sure no validation props exist in the result
    const resultStr = JSON.stringify(result);
    const validationProps = [
      "minLength",
      "maxLength",
      "pattern",
      "format",
      "default",
      "examples",
      "minimum",
      "maximum",
      "exclusiveMinimum",
      "exclusiveMaximum",
      "multipleOf",
      "minItems",
      "maxItems",
    ];

    for (const prop of validationProps) {
      expect(resultStr).not.toContain(`"${prop}"`);
    }
  });
});
