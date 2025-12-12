import { z } from "zod/v4";
import { assertNoRecordSchema } from "./validate";

describe("assertNoRecordSchema", () => {
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
