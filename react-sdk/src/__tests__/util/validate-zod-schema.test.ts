import { z } from "zod";
import { assertNoZodRecord } from "../../util/validate-zod-schema";

describe("assertNoZodRecord", () => {
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

    expect(() => assertNoZodRecord(schema)).not.toThrow();
  });

  it("should throw when encountering a record at root level", () => {
    const schema = z.record(z.string());

    expect(() => assertNoZodRecord(schema)).toThrow(
      'z.record() is not supported in schema. Found at path "(root)". Replace it with z.object({ ... }) using explicit keys.',
    );
  });

  it("should throw when encountering a nested record", () => {
    const schema = z.object({
      name: z.string(),
      metadata: z.record(z.string()),
    });

    expect(() => assertNoZodRecord(schema)).toThrow(
      'z.record() is not supported in schema. Found at path "metadata". Replace it with z.object({ ... }) using explicit keys.',
    );
  });

  it("should throw when encountering a record in an array", () => {
    const schema = z.object({
      items: z.array(z.record(z.string())),
    });

    expect(() => assertNoZodRecord(schema)).toThrow(
      'z.record() is not supported in schema. Found at path "items.[]". Replace it with z.object({ ... }) using explicit keys.',
    );
  });

  it("should throw when encountering a record in a union", () => {
    const schema = z.union([z.string(), z.record(z.number())]);

    expect(() => assertNoZodRecord(schema)).toThrow(
      'z.record() is not supported in schema. Found at path "|1". Replace it with z.object({ ... }) using explicit keys.',
    );
  });

  it("should throw when encountering a record in an intersection", () => {
    const schema = z.intersection(
      z.object({ name: z.string() }),
      z.object({ metadata: z.record(z.string()) }),
    );

    expect(() => assertNoZodRecord(schema)).toThrow(
      'z.record() is not supported in schema. Found at path "&1.metadata". Replace it with z.object({ ... }) using explicit keys.',
    );
  });

  it("should throw when encountering a record in a discriminated union", () => {
    const schema = z.discriminatedUnion("type", [
      z.object({ type: z.literal("string"), value: z.string() }),
      z.object({ type: z.literal("record"), value: z.record(z.number()) }),
    ]);

    expect(() => assertNoZodRecord(schema)).toThrow(
      'z.record() is not supported in schema. Found at path "|1.value". Replace it with z.object({ ... }) using explicit keys.',
    );
  });

  it("should throw when encountering a record in an optional field", () => {
    const schema = z.object({
      optional: z.optional(z.record(z.string())),
    });

    expect(() => assertNoZodRecord(schema)).toThrow(
      'z.record() is not supported in schema. Found at path "optional". Replace it with z.object({ ... }) using explicit keys.',
    );
  });

  it("should throw when encountering a record in a nullable field", () => {
    const schema = z.object({
      nullable: z.nullable(z.record(z.string())),
    });

    expect(() => assertNoZodRecord(schema)).toThrow(
      'z.record() is not supported in schema. Found at path "nullable". Replace it with z.object({ ... }) using explicit keys.',
    );
  });

  it("should throw when encountering a record in a tuple", () => {
    const schema = z.tuple([z.string(), z.record(z.number())]);

    expect(() => assertNoZodRecord(schema)).toThrow(
      'z.record() is not supported in schema. Found at path "1". Replace it with z.object({ ... }) using explicit keys.',
    );
  });

  it("should use custom context name in error message", () => {
    const schema = z.record(z.string());

    expect(() => assertNoZodRecord(schema, "mySchema")).toThrow(
      'z.record() is not supported in mySchema. Found at path "(root)". Replace it with z.object({ ... }) using explicit keys.',
    );
  });
});
