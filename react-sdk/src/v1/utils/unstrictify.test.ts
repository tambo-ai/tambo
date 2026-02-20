import type { JSONSchema7, JSONSchema7Definition } from "json-schema";
import { canBeNull, unstrictifyToolCallParamsFromSchema } from "./unstrictify";

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

  it("should handle arrays with nested objects", () => {
    const schema: JSONSchema7 = {
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
                },
                required: [],
              },
            },
            required: ["style"],
          },
        },
      },
      required: ["targets"],
    };

    const result = unstrictifyToolCallParamsFromSchema(schema, {
      targets: [
        { range: "A1:B1", style: { bold: true, fontFamily: null } },
        { range: "A2:A6", style: { bold: false, fontFamily: null } },
      ],
    });

    expect(result).toEqual({
      targets: [
        { range: "A1:B1", style: { bold: true } },
        { range: "A2:A6", style: { bold: false } },
      ],
    });
  });
});
