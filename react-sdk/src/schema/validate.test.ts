import type { JSONSchema7 } from "json-schema";
import { z } from "zod/v4";
import { assertNoRecordSchema } from "./validate";

describe("assertNoRecordSchema", () => {
  describe("falsy inputs", () => {
    it("should return early for null", () => {
      expect(() => assertNoRecordSchema(null)).not.toThrow();
    });

    it("should return early for undefined", () => {
      expect(() => assertNoRecordSchema(undefined)).not.toThrow();
    });

    it("should return early for empty string", () => {
      expect(() => assertNoRecordSchema("")).not.toThrow();
    });

    it("should return early for zero", () => {
      expect(() => assertNoRecordSchema(0)).not.toThrow();
    });
  });

  describe("unknown schema types", () => {
    it("should skip validation for unknown object types without type property", () => {
      const unknownSchema = { foo: "bar", baz: 123 };
      expect(() => assertNoRecordSchema(unknownSchema)).not.toThrow();
    });

    it("should skip validation for arrays", () => {
      expect(() => assertNoRecordSchema([1, 2, 3])).not.toThrow();
    });
  });

  describe("schema conversion errors", () => {
    it("should skip validation when Standard Schema conversion fails", () => {
      // Create a mock that looks like Standard Schema but will fail conversion
      const brokenSchema = {
        "~standard": {
          version: 1,
          vendor: "broken-vendor",
          validate: () => ({ value: {} }),
        },
      };

      // Should not throw, just skip validation
      expect(() => assertNoRecordSchema(brokenSchema)).not.toThrow();
    });
  });

  describe("empty converted schemas", () => {
    it("should skip validation for function schemas that return empty JSON Schema", () => {
      // Function schemas can't be directly converted to JSON Schema
      const funcSchema = z.function({
        input: [z.string()],
        output: z.void(),
      });

      // Should not throw - function schemas are handled specially
      expect(() => assertNoRecordSchema(funcSchema)).not.toThrow();
    });
  });

  it("should allow valid schemas without records", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      tags: z.array(z.string()),
      address: z.object({
        street: z.string(),
        city: z.string(),
      }),
    });

    expect(() => assertNoRecordSchema(schema)).not.toThrow();
  });

  it("should throw when encountering a record at root level", () => {
    const schema = z.record(z.string(), z.string());

    expect(() => assertNoRecordSchema(schema)).toThrow(
      'Record types (objects with dynamic keys) are not supported in schema. Found at path "(root)". Replace it with an object using explicit keys.',
    );
  });

  it("should throw when encountering a nested record", () => {
    const schema = z.object({
      name: z.string(),
      metadata: z.record(z.string(), z.string()),
    });

    expect(() => assertNoRecordSchema(schema)).toThrow(
      'Record types (objects with dynamic keys) are not supported in schema. Found at path "metadata". Replace it with an object using explicit keys.',
    );
  });

  it("should throw when encountering a record in an array", () => {
    const schema = z.object({
      items: z.array(z.record(z.string(), z.string())),
    });

    expect(() => assertNoRecordSchema(schema)).toThrow(
      'Record types (objects with dynamic keys) are not supported in schema. Found at path "items.[]". Replace it with an object using explicit keys.',
    );
  });

  it("should throw when encountering a record in a union", () => {
    const schema = z.union([z.string(), z.record(z.string(), z.number())]);

    expect(() => assertNoRecordSchema(schema)).toThrow(
      'Record types (objects with dynamic keys) are not supported in schema. Found at path "|1". Replace it with an object using explicit keys.',
    );
  });

  it("should throw when encountering a record in an intersection", () => {
    const schema = z.intersection(
      z.object({ name: z.string() }),
      z.object({ metadata: z.record(z.string(), z.string()) }),
    );

    expect(() => assertNoRecordSchema(schema)).toThrow(
      /Record types \(objects with dynamic keys\) are not supported in schema\. Found at path "(&1\.)?metadata"\. Replace it with an object using explicit keys\./,
    );
  });

  it("should throw when encountering a record in a discriminated union", () => {
    const schema = z.discriminatedUnion("type", [
      z.object({ type: z.literal("string"), value: z.string() }),
      z.object({
        type: z.literal("record"),
        value: z.record(z.string(), z.number()),
      }),
    ]);

    expect(() => assertNoRecordSchema(schema)).toThrow(
      /Record types \(objects with dynamic keys\) are not supported in schema\. Found at path "\|1\.value"\. Replace it with an object using explicit keys\./,
    );
  });

  it("should throw when encountering a record in an optional field", () => {
    const schema = z.object({
      optional: z.optional(z.record(z.string(), z.string())),
    });

    expect(() => assertNoRecordSchema(schema)).toThrow(
      'Record types (objects with dynamic keys) are not supported in schema. Found at path "optional". Replace it with an object using explicit keys.',
    );
  });

  it("should throw when encountering a record in a nullable field", () => {
    const schema = z.object({
      nullable: z.nullable(z.record(z.string(), z.string())),
    });

    // Nullable creates a oneOf in JSON Schema, so the path includes the union index
    expect(() => assertNoRecordSchema(schema)).toThrow(
      /Record types \(objects with dynamic keys\) are not supported in schema\. Found at path "nullable(\.\|0)?"\. Replace it with an object using explicit keys\./,
    );
  });

  it("should throw when encountering a record in a tuple", () => {
    const schema = z.tuple([z.string(), z.record(z.string(), z.number())]);

    expect(() => assertNoRecordSchema(schema)).toThrow(
      'Record types (objects with dynamic keys) are not supported in schema. Found at path "1". Replace it with an object using explicit keys.',
    );
  });

  it("should use custom context name in error message", () => {
    const schema = z.record(z.string(), z.string());

    expect(() => assertNoRecordSchema(schema, "mySchema")).toThrow(
      'Record types (objects with dynamic keys) are not supported in mySchema. Found at path "(root)". Replace it with an object using explicit keys.',
    );
  });

  describe("JSON Schema conditional keywords", () => {
    it("should throw when encountering a record in if clause", () => {
      const jsonSchema: JSONSchema7 = {
        type: "object",
        if: {
          type: "object",
          additionalProperties: { type: "string" },
        },
        then: {
          properties: { name: { type: "string" } },
        },
      };

      expect(() => assertNoRecordSchema(jsonSchema)).toThrow(
        'Record types (objects with dynamic keys) are not supported in schema. Found at path "if". Replace it with an object using explicit keys.',
      );
    });

    it("should throw when encountering a record in then clause", () => {
      const jsonSchema: JSONSchema7 = {
        type: "object",
        if: {
          properties: { type: { const: "map" } },
        },
        then: {
          type: "object",
          additionalProperties: { type: "number" },
        },
      };

      expect(() => assertNoRecordSchema(jsonSchema)).toThrow(
        'Record types (objects with dynamic keys) are not supported in schema. Found at path "then". Replace it with an object using explicit keys.',
      );
    });

    it("should throw when encountering a record in else clause", () => {
      const jsonSchema: JSONSchema7 = {
        type: "object",
        if: {
          properties: { type: { const: "simple" } },
        },
        then: {
          properties: { value: { type: "string" } },
        },
        else: {
          type: "object",
          additionalProperties: { type: "boolean" },
        },
      };

      expect(() => assertNoRecordSchema(jsonSchema)).toThrow(
        'Record types (objects with dynamic keys) are not supported in schema. Found at path "else". Replace it with an object using explicit keys.',
      );
    });

    it("should throw when encountering a record in not clause", () => {
      const jsonSchema: JSONSchema7 = {
        type: "object",
        not: {
          type: "object",
          additionalProperties: { type: "string" },
        },
      };

      expect(() => assertNoRecordSchema(jsonSchema)).toThrow(
        'Record types (objects with dynamic keys) are not supported in schema. Found at path "!". Replace it with an object using explicit keys.',
      );
    });

    it("should throw when encountering a record in oneOf", () => {
      const jsonSchema: JSONSchema7 = {
        type: "object",
        oneOf: [
          { type: "string" },
          {
            type: "object",
            additionalProperties: { type: "number" },
          },
        ],
      };

      expect(() => assertNoRecordSchema(jsonSchema)).toThrow(
        'Record types (objects with dynamic keys) are not supported in schema. Found at path "|1". Replace it with an object using explicit keys.',
      );
    });
  });

  describe("nested records in additionalProperties", () => {
    it("should throw for nested record inside additionalProperties value schema", () => {
      const jsonSchema: JSONSchema7 = {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            nested: {
              type: "object",
              additionalProperties: { type: "string" },
            },
          },
        },
      };

      // First it finds the root level record
      expect(() => assertNoRecordSchema(jsonSchema)).toThrow(
        'Record types (objects with dynamic keys) are not supported in schema. Found at path "(root)". Replace it with an object using explicit keys.',
      );
    });
  });

  describe("prefixItems (JSON Schema 2020-12)", () => {
    it("should throw when encountering a record in prefixItems", () => {
      // Using JSON Schema 2020-12 style tuple
      const jsonSchema = {
        type: "array",
        prefixItems: [
          { type: "string" },
          {
            type: "object",
            additionalProperties: { type: "number" },
          },
        ],
      } as JSONSchema7;

      expect(() => assertNoRecordSchema(jsonSchema)).toThrow(
        'Record types (objects with dynamic keys) are not supported in schema. Found at path "1". Replace it with an object using explicit keys.',
      );
    });
  });

  it("should handle ZodLazy schemas", () => {
    const schema = z.lazy(() => z.record(z.string(), z.string()));

    expect(() => assertNoRecordSchema(schema)).toThrow(
      'Record types (objects with dynamic keys) are not supported in schema. Found at path "(root)". Replace it with an object using explicit keys.',
    );
  });

  it("should allow z.function() with valid arguments", () => {
    const schema = z.function({
      input: [z.string(), z.number()],
      output: z.string(),
    });

    // Function schemas can't be converted to JSON Schema directly,
    // so they should not throw (validation happens on the extracted parameters)
    expect(() => assertNoRecordSchema(schema)).not.toThrow();
  });

  it("should allow JSON Schema without records", () => {
    const jsonSchema = {
      type: "object" as const,
      properties: {
        name: { type: "string" as const },
        age: { type: "number" as const },
      },
      required: ["name"],
    };

    expect(() => assertNoRecordSchema(jsonSchema)).not.toThrow();
  });

  it("should throw when JSON Schema has record pattern", () => {
    const jsonSchema = {
      type: "object" as const,
      additionalProperties: { type: "string" as const },
    };

    expect(() => assertNoRecordSchema(jsonSchema)).toThrow(
      'Record types (objects with dynamic keys) are not supported in schema. Found at path "(root)". Replace it with an object using explicit keys.',
    );
  });

  it("should treat JSON Schema with properties and additionalProperties as a record", () => {
    const jsonSchema = {
      type: "object" as const,
      properties: {
        id: { type: "string" as const },
      },
      additionalProperties: { type: "number" as const },
    };

    expect(() => assertNoRecordSchema(jsonSchema)).toThrow(
      'Record types (objects with dynamic keys) are not supported in schema. Found at path "(root)". Replace it with an object using explicit keys.',
    );
  });

  it("should throw when nested JSON Schema has record pattern", () => {
    const jsonSchema = {
      type: "object" as const,
      properties: {
        metadata: {
          type: "object" as const,
          additionalProperties: { type: "string" as const },
        },
      },
    };

    expect(() => assertNoRecordSchema(jsonSchema)).toThrow(
      'Record types (objects with dynamic keys) are not supported in schema. Found at path "metadata". Replace it with an object using explicit keys.',
    );
  });
});
