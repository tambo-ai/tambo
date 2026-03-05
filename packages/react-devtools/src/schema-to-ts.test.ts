import { jsonSchemaToTs } from "./schema-to-ts";

describe("jsonSchemaToTs", () => {
  it("renders a simple object with required and optional properties", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name"],
    };

    const result = jsonSchemaToTs(schema);
    expect(result).toBe(
      ["type InputSchema = {", "  name: string;", "  age?: number;", "}"].join(
        "\n",
      ),
    );
  });

  it("renders array types", () => {
    const schema = {
      type: "array",
      items: { type: "number" },
    };
    expect(jsonSchemaToTs(schema)).toBe("type InputSchema = number[]");
  });

  it("renders array of union types with parens", () => {
    const schema = {
      type: "array",
      items: { anyOf: [{ type: "string" }, { type: "number" }] },
    };
    expect(jsonSchemaToTs(schema)).toBe(
      "type InputSchema = (string | number)[]",
    );
  });

  it("renders enum values as union of literals", () => {
    const schema = {
      enum: ["a", "b", "c"],
    };
    expect(jsonSchemaToTs(schema)).toBe('type InputSchema = "a" | "b" | "c"');
  });

  it("renders type arrays as union", () => {
    const schema = {
      type: ["string", "null"],
    };
    expect(jsonSchemaToTs(schema)).toBe("type InputSchema = string | null");
  });

  it("renders nested objects with indentation", () => {
    const schema = {
      type: "object",
      properties: {
        address: {
          type: "object",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
          },
          required: ["street", "city"],
        },
      },
      required: ["address"],
    };

    const result = jsonSchemaToTs(schema);
    expect(result).toContain("address: {");
    expect(result).toContain("    street: string;");
    expect(result).toContain("    city: string;");
  });

  it("renders property descriptions as jsdoc comments", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string", description: "The user's name" },
      },
      required: ["name"],
    };

    const result = jsonSchemaToTs(schema);
    expect(result).toContain("/** The user's name */");
    expect(result).toContain("name: string;");
  });

  it("renders integer as number", () => {
    const schema = { type: "integer" };
    expect(jsonSchemaToTs(schema)).toBe("type InputSchema = number");
  });

  it("renders const values", () => {
    const schema = { const: "fixed" };
    expect(jsonSchemaToTs(schema)).toBe('type InputSchema = "fixed"');
  });

  it("renders anyOf as union", () => {
    const schema = {
      anyOf: [{ type: "string" }, { type: "number" }],
    };
    expect(jsonSchemaToTs(schema)).toBe("type InputSchema = string | number");
  });

  it("renders oneOf as union", () => {
    const schema = {
      oneOf: [{ type: "boolean" }, { type: "null" }],
    };
    expect(jsonSchemaToTs(schema)).toBe("type InputSchema = boolean | null");
  });

  it("renders allOf as intersection", () => {
    const schema = {
      allOf: [
        { type: "object", properties: { a: { type: "string" } } },
        { type: "object", properties: { b: { type: "number" } } },
      ],
    };
    const result = jsonSchemaToTs(schema);
    expect(result).toContain("&");
  });

  it("renders empty object as {}", () => {
    const schema = { type: "object" };
    expect(jsonSchemaToTs(schema)).toBe("type InputSchema = {}");
  });

  it("renders object with additionalProperties: true as Record", () => {
    const schema = { type: "object", additionalProperties: true };
    expect(jsonSchemaToTs(schema)).toBe(
      "type InputSchema = Record<string, unknown>",
    );
  });

  it("renders object with typed additionalProperties as Record", () => {
    const schema = {
      type: "object",
      additionalProperties: { type: "string" },
    };
    expect(jsonSchemaToTs(schema)).toBe(
      "type InputSchema = Record<string, string>",
    );
  });

  it("renders array without items as unknown[]", () => {
    const schema = { type: "array" };
    expect(jsonSchemaToTs(schema)).toBe("type InputSchema = unknown[]");
  });

  it("returns unknown for schema with no type", () => {
    const schema = {};
    expect(jsonSchemaToTs(schema)).toBe("type InputSchema = unknown");
  });

  it("infers object from properties without explicit type", () => {
    const schema = {
      properties: {
        x: { type: "number" },
      },
    };
    const result = jsonSchemaToTs(schema);
    expect(result).toContain("x?: number;");
  });

  it("handles $ref by extracting the last segment", () => {
    const schema = { $ref: "#/definitions/User" };
    expect(jsonSchemaToTs(schema)).toBe("type InputSchema = User");
  });

  it("falls back to JSON.stringify for non-object input", () => {
    expect(jsonSchemaToTs("hello")).toBe('type InputSchema = "hello"');
    expect(jsonSchemaToTs(42)).toBe("type InputSchema = 42");
    expect(jsonSchemaToTs(null)).toBe("type InputSchema = null");
    expect(jsonSchemaToTs([1, 2])).toBe("type InputSchema = [\n  1,\n  2\n]");
  });

  it("handles boolean primitives", () => {
    expect(jsonSchemaToTs({ type: "boolean" })).toBe(
      "type InputSchema = boolean",
    );
  });

  it("handles null type", () => {
    expect(jsonSchemaToTs({ type: "null" })).toBe("type InputSchema = null");
  });

  it("uses OutputSchema name when specified", () => {
    const schema = { type: "string" };
    expect(jsonSchemaToTs(schema, "OutputSchema")).toBe(
      "type OutputSchema = string",
    );
  });
});
