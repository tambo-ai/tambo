import { JSONSchema7Definition } from "json-schema";
import { z } from "zod/v3";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  strictifyJSONSchemaProperties,
  strictifyJSONSchemaProperty,
} from "./json-schema";

describe("strictifyJSONSchemaProperties", () => {
  it("should handle empty properties object", () => {
    const result = strictifyJSONSchemaProperties({}, []);
    expect(result).toEqual({});
  });

  it("should strictify simple string property", () => {
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

  it("should handle property.type boolean, string, and number with early return and strip validation properties", () => {
    // These property types should be caught by the early return at lines 61-113
    // Validation properties should still be stripped
    const properties: Record<string, JSONSchema7Definition> = {
      // Required boolean type with validation properties (should be stripped)
      isActive: {
        type: "boolean",
        description: "Whether the item is active",
        default: false,
        examples: [true, false],
      },
      // Optional boolean type
      isArchived: {
        type: "boolean",
        description: "Whether the item is archived",
      },

      // Required string type with validation properties (should be stripped)
      name: {
        type: "string",
        description: "User name",
        minLength: 3,
        maxLength: 100,
        pattern: "^[A-Za-z]+$",
        format: "text",
      },
      // Optional string type
      email: { type: "string", description: "User email" },

      // Required number type with validation properties (should be stripped)
      age: {
        type: "number",
        description: "User age",
        minimum: 0,
        maximum: 120,
        exclusiveMinimum: 0,
        exclusiveMaximum: 121,
        multipleOf: 1,
      },
      // Optional number type
      score: { type: "number", description: "User score" },
    };

    const result = strictifyJSONSchemaProperties(properties, [
      "isActive",
      "name",
      "age",
    ]);

    // Required properties should have validation properties stripped
    expect(result.isActive).toEqual({
      type: "boolean",
      description: "Whether the item is active",
    });
    expect(result.name).toEqual({
      type: "string",
      description: "User name",
    });
    expect(result.age).toEqual({
      type: "number",
      description: "User age",
    });

    // Optional properties should be wrapped with anyOf containing null
    expect(result.isArchived).toEqual({
      anyOf: [
        { type: "null" },
        {
          type: "boolean",
          description: "Whether the item is archived",
        },
      ],
    });
    expect(result.email).toEqual({
      anyOf: [
        { type: "null" },
        {
          type: "string",
          description: "User email",
        },
      ],
    });
    expect(result.score).toEqual({
      anyOf: [
        { type: "null" },
        {
          type: "number",
          description: "User score",
        },
      ],
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
        propertyNames: { pattern: "^[a-z]+$" },
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
    expect(result.metadata).toHaveProperty("anyOf");
    const metadata = result.metadata as { anyOf: JSONSchema7Definition[] };

    // Check the object part of the anyOf
    const objectPart = metadata.anyOf[1] as {
      type: string;
      properties: Record<string, JSONSchema7Definition>;
    };
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
      "propertyNames",
    ];

    for (const prop of validationProps) {
      expect(resultStr).not.toContain(`"${prop}"`);
    }
  });

  describe("Zod schema conversion", () => {
    it("should handle optional primitive types from Zod", () => {
      const zodSchema = z.object({
        name: z.string().optional(),
        age: z.number().optional(),
        isActive: z.boolean().optional(),
      });

      const jsonSchema = zodToJsonSchema(zodSchema) as {
        properties?: Record<string, JSONSchema7Definition>;
        required?: string[];
      };
      const properties = jsonSchema.properties ?? {};
      const required = jsonSchema.required ?? [];

      const result = strictifyJSONSchemaProperties(properties, required);

      expect(result).toEqual({
        name: {
          anyOf: [{ type: "null" }, { type: "string" }],
        },
        age: {
          anyOf: [{ type: "null" }, { type: "number" }],
        },
        isActive: {
          anyOf: [{ type: "null" }, { type: "boolean" }],
        },
      });
    });

    it("should handle required primitive types from Zod", () => {
      const zodSchema = z.object({
        name: z.string(),
        age: z.number(),
        isActive: z.boolean(),
      });

      const jsonSchema = zodToJsonSchema(zodSchema) as {
        properties?: Record<string, JSONSchema7Definition>;
        required?: string[];
      };
      const properties = jsonSchema.properties ?? {};
      const required = jsonSchema.required ?? [];

      const result = strictifyJSONSchemaProperties(properties, required);

      expect(result).toEqual({
        name: { type: "string" },
        age: { type: "number" },
        isActive: { type: "boolean" },
      });
    });

    it("should handle z.number().optional() from Zod", () => {
      const zodSchema = z.number().optional();

      const jsonSchema = zodToJsonSchema(zodSchema) as {
        properties?: Record<string, JSONSchema7Definition>;
        required?: string[];
      };
      console.log("trying to strictify", jsonSchema);

      const result = strictifyJSONSchemaProperty(jsonSchema, true);

      expect(result).toEqual({
        type: "number",
      });
    });

    it("should handle mixed required and optional fields from Zod", () => {
      const zodSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().optional(),
        age: z.number().optional(),
      });

      const jsonSchema = zodToJsonSchema(zodSchema) as {
        properties?: Record<string, JSONSchema7Definition>;
        required?: string[];
      };
      const properties = jsonSchema.properties ?? {};
      const required = jsonSchema.required ?? [];

      const result = strictifyJSONSchemaProperties(properties, required);

      expect(result).toEqual({
        id: { type: "string" },
        name: { type: "string" },
        email: {
          anyOf: [{ type: "null" }, { type: "string" }],
        },
        age: {
          anyOf: [{ type: "null" }, { type: "number" }],
        },
      });
    });

    it("should handle nested objects from Zod", () => {
      const zodSchema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().optional(),
          profile: z.object({
            bio: z.string().optional(),
            age: z.number(),
          }),
        }),
      });

      const jsonSchema = zodToJsonSchema(zodSchema) as {
        properties?: Record<string, JSONSchema7Definition>;
        required?: string[];
      };
      const properties = jsonSchema.properties ?? {};
      const required = jsonSchema.required ?? [];

      const result = strictifyJSONSchemaProperties(properties, required);

      expect(result).toEqual({
        user: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: {
              anyOf: [{ type: "null" }, { type: "string" }],
            },
            profile: {
              type: "object",
              properties: {
                bio: {
                  anyOf: [{ type: "null" }, { type: "string" }],
                },
                age: { type: "number" },
              },
              required: ["bio", "age"],
              additionalProperties: false,
            },
          },
          required: ["name", "email", "profile"],
          additionalProperties: false,
        },
      });
    });

    it("should handle arrays from Zod", () => {
      const zodSchema = z.object({
        tags: z.array(z.string()),
        scores: z.array(z.number()).optional(),
      });

      const jsonSchema = zodToJsonSchema(zodSchema) as {
        properties?: Record<string, JSONSchema7Definition>;
        required?: string[];
      };
      const properties = jsonSchema.properties ?? {};
      const required = jsonSchema.required ?? [];

      const result = strictifyJSONSchemaProperties(properties, required);

      // Required arrays don't wrap items in anyOf
      expect(result).toEqual({
        tags: {
          type: "array",
          items: { type: "string" },
        },
        scores: {
          anyOf: [
            { type: "null" },
            {
              type: "array",
              items: { anyOf: [{ type: "null" }, { type: "number" }] },
            },
          ],
        },
      });
    });

    it("should handle arrays of objects from Zod", () => {
      const zodSchema = z.object({
        users: z.array(
          z.object({
            name: z.string(),
            email: z.string().optional(),
          }),
        ),
      });

      const jsonSchema = zodToJsonSchema(zodSchema) as {
        properties?: Record<string, JSONSchema7Definition>;
        required?: string[];
      };
      const properties = jsonSchema.properties ?? {};
      const required = jsonSchema.required ?? [];

      const result = strictifyJSONSchemaProperties(properties, required);

      // Required arrays don't wrap items in anyOf with null
      expect(result).toEqual({
        users: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: {
                anyOf: [{ type: "null" }, { type: "string" }],
              },
            },
            required: ["name", "email"],
            additionalProperties: false,
          },
        },
      });
    });

    it("should handle union types from Zod", () => {
      const zodSchema = z.object({
        value: z.union([z.string(), z.number()]),
        optionalUnion: z.union([z.string(), z.number()]).optional(),
      });

      const jsonSchema = zodToJsonSchema(zodSchema) as {
        properties?: Record<string, JSONSchema7Definition>;
        required?: string[];
      };
      const properties = jsonSchema.properties ?? {};
      const required = jsonSchema.required ?? [];

      const result = strictifyJSONSchemaProperties(properties, required);

      // Zod union types generate a type array like { type: ["string", "number"] }
      expect(result.value).toHaveProperty("type");
      expect(result.value).toMatchObject({ type: ["string", "number"] });

      // Optional unions should be wrapped with null
      expect(result.optionalUnion).toHaveProperty("anyOf");
      expect(result.optionalUnion).toMatchObject({
        anyOf: expect.arrayContaining([
          { type: "null" },
          { type: ["string", "number"] },
        ]),
      });
    });

    it("should strip validation properties from Zod schemas", () => {
      const zodSchema = z.object({
        email: z.string().email().min(5).max(100),
        age: z.number().min(0).max(120),
        username: z.string().regex(/^[a-z0-9_]+$/),
      });

      const jsonSchema = zodToJsonSchema(zodSchema) as {
        properties?: Record<string, JSONSchema7Definition>;
        required?: string[];
      };
      const properties = jsonSchema.properties ?? {};
      const required = jsonSchema.required ?? [];

      const result = strictifyJSONSchemaProperties(properties, required);

      // Check that validation properties are removed
      expect(result.email).toEqual({ type: "string" });
      expect(result.age).toEqual({ type: "number" });
      expect(result.username).toEqual({ type: "string" });
    });

    it("should handle complex nested Zod schemas", () => {
      const zodSchema = z.object({
        organization: z.object({
          name: z.string(),
          departments: z.array(
            z.object({
              name: z.string(),
              employees: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  role: z.string().optional(),
                }),
              ),
            }),
          ),
          metadata: z
            .object({
              founded: z.number(),
              location: z.string().optional(),
            })
            .optional(),
        }),
      });

      const jsonSchema = zodToJsonSchema(zodSchema) as {
        properties?: Record<string, JSONSchema7Definition>;
        required?: string[];
      };
      const properties = jsonSchema.properties ?? {};
      const required = jsonSchema.required ?? [];

      const result = strictifyJSONSchemaProperties(properties, required);

      // Required arrays don't wrap items in anyOf
      expect(result).toEqual({
        organization: {
          type: "object",
          properties: {
            name: { type: "string" },
            departments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  employees: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        role: {
                          anyOf: [{ type: "null" }, { type: "string" }],
                        },
                      },
                      required: ["id", "name", "role"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["name", "employees"],
                additionalProperties: false,
              },
            },
            metadata: {
              anyOf: [
                { type: "null" },
                {
                  type: "object",
                  properties: {
                    founded: { type: "number" },
                    location: {
                      anyOf: [{ type: "null" }, { type: "string" }],
                    },
                  },
                  required: ["founded", "location"],
                  additionalProperties: false,
                },
              ],
            },
          },
          required: ["name", "departments", "metadata"],
          additionalProperties: false,
        },
      });
    });
  });

  it("should handle property with only stripped validation properties resulting in empty restOfProperty", () => {
    // This test case creates a scenario where restOfProperty becomes {}
    // by providing a property that only has validation properties that get stripped,
    // and no other properties like 'type', 'description', etc.
    const properties: Record<string, JSONSchema7Definition> = {
      // A property with only validation properties that get stripped
      // This has no 'type', 'description', or other non-stripped properties
      emptyAfterStripping: {
        format: "email",
        default: "test@example.com",
        minLength: 5,
        maxLength: 100,
        pattern: "^[^@]+@[^@]+$",
        examples: ["example@test.com"],
        minimum: 0, // These don't make sense for strings but are here to test
        maximum: 100,
        exclusiveMinimum: 0,
        exclusiveMaximum: 101,
        multipleOf: 1,
        minItems: 1, // These don't make sense for strings but are here to test
        maxItems: 10,
      },
    };

    // When not required, invalid schema (no type) becomes a null-typed schema retaining props
    const resultNotRequired = strictifyJSONSchemaProperties(
      properties,
      [], // empty required list
    );
    expect(resultNotRequired.emptyAfterStripping).toEqual({
      anyOf: [
        { type: "null" },
        { type: "string" },
        { type: "number" },
        { type: "integer" },
        { type: "boolean" },
        { type: "null" },
      ],
    });

    // When required, same null-typed schema (since invalid input has no type)
    const resultRequired = strictifyJSONSchemaProperties(properties, [
      "emptyAfterStripping",
    ]);
    expect(resultRequired.emptyAfterStripping).toEqual({
      anyOf: [
        { type: "null" },
        { type: "string" },
        { type: "number" },
        { type: "integer" },
        { type: "boolean" },
        { type: "null" },
      ],
    });
  });

  it("should wrap non-empty restOfProperty with anyOf when non-required", () => {
    // This tests the code path at lines 179-181, where restOfProperty is NOT empty
    // but doesn't match any of the special cases (object, array, anyOf/oneOf/allOf/not).
    // Note: when restOfProperty is empty, it returns early at line 176, so we can't
    // reach line 179-181 with an empty restOfProperty.
    const properties: Record<string, JSONSchema7Definition> = {
      // Property with only description (a non-stripped property) and validation props
      // After stripping validation props, restOfProperty = { description: "..." }
      minimalProp: {
        description: "A minimal property",
        format: "email",
        default: "test@example.com",
        minLength: 5,
      },
    };

    // When not required, should wrap with anyOf since restOfProperty has description
    // but no type, so it doesn't match object/array/anyOf special cases
    const resultNotRequired = strictifyJSONSchemaProperties(properties, []);
    expect(resultNotRequired.minimalProp).toEqual({
      anyOf: [
        {
          type: "null",
        },
        {
          type: "string",
        },
        { type: "number" },
        { type: "integer" },
        { type: "boolean" },
        { type: "null" },
      ],
      description: "A minimal property",
    });
  });

  it("should preserve description and other metadata properties alongside anyOf", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      value: {
        anyOf: [{ type: "string" }, { type: "number" }],
        description: "Can be a string or number",
        title: "Value field",
      },
    };

    const result = strictifyJSONSchemaProperties(properties, ["value"]);
    expect(result.value).toEqual({
      anyOf: [{ type: "string" }, { type: "number" }],
      description: "Can be a string or number",
      title: "Value field",
    });
  });

  it("should preserve description alongside not", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      value: {
        not: { type: "null" },
        description: "Cannot be null",
      },
    };

    const result = strictifyJSONSchemaProperties(properties, ["value"]);
    expect(result.value).toEqual({
      not: { type: "null" },
      description: "Cannot be null",
    });
  });
});
