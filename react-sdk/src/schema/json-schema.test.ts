import { JSONSchema7 } from "json-schema";
import {
  getJsonSchemaTupleItems,
  isJsonSchemaTuple,
  JSONSchema7Extended,
  looksLikeJSONSchema,
  makeJsonSchemaPartial,
} from "./json-schema";

describe("looksLikeJSONSchema", () => {
  it("should return true for a valid object schema", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };
    expect(looksLikeJSONSchema(schema)).toBe(true);
  });

  it("should return true for a schema with only properties", () => {
    const schema = {
      properties: {
        name: { type: "string" },
      },
    };
    expect(looksLikeJSONSchema(schema)).toBe(true);
  });

  it("should return true for a schema with items (array)", () => {
    const schema = {
      type: "array",
      items: { type: "string" },
    };
    expect(looksLikeJSONSchema(schema)).toBe(true);
  });

  it("should return true for a schema with enum", () => {
    const schema = {
      enum: ["a", "b", "c"],
    };
    expect(looksLikeJSONSchema(schema)).toBe(true);
  });

  it("should return true for a schema with const", () => {
    const schema = {
      const: "fixed-value",
    };
    expect(looksLikeJSONSchema(schema)).toBe(true);
  });

  it("should return true for a schema with $ref", () => {
    const schema = {
      $ref: "#/definitions/Person",
    };
    expect(looksLikeJSONSchema(schema)).toBe(true);
  });

  it("should return false for null", () => {
    expect(looksLikeJSONSchema(null)).toBe(false);
  });

  it("should return false for non-object", () => {
    expect(looksLikeJSONSchema("string")).toBe(false);
    expect(looksLikeJSONSchema(123)).toBe(false);
    expect(looksLikeJSONSchema(undefined)).toBe(false);
  });

  it("should return false for empty object", () => {
    expect(looksLikeJSONSchema({})).toBe(false);
  });

  it("should return false for object without schema keys", () => {
    const notSchema = {
      foo: "bar",
      baz: 123,
    };
    expect(looksLikeJSONSchema(notSchema)).toBe(false);
  });
});

describe("isJsonSchemaTuple", () => {
  it("should return true for draft-07 tuple (items as array)", () => {
    const schema: JSONSchema7Extended = {
      type: "array",
      items: [{ type: "string" }, { type: "number" }],
    };
    expect(isJsonSchemaTuple(schema)).toBe(true);
  });

  it("should return true for draft 2020-12 tuple (prefixItems)", () => {
    const schema: JSONSchema7Extended = {
      type: "array",
      prefixItems: [{ type: "string" }, { type: "number" }],
    };
    expect(isJsonSchemaTuple(schema)).toBe(true);
  });

  it("should return false for regular array schema (items as object)", () => {
    const schema: JSONSchema7Extended = {
      type: "array",
      items: { type: "string" },
    };
    expect(isJsonSchemaTuple(schema)).toBe(false);
  });

  it("should return false for non-array schema", () => {
    const schema: JSONSchema7Extended = {
      type: "object",
      properties: {},
    };
    expect(isJsonSchemaTuple(schema)).toBe(false);
  });

  it("should return false for array without items or prefixItems", () => {
    const schema: JSONSchema7Extended = {
      type: "array",
    };
    expect(isJsonSchemaTuple(schema)).toBe(false);
  });
});

describe("getJsonSchemaTupleItems", () => {
  it("should return items for draft-07 tuple", () => {
    const items = [{ type: "string" }, { type: "number" }];
    const schema: JSONSchema7Extended = {
      type: "array",
      items: items as JSONSchema7[],
    };
    expect(getJsonSchemaTupleItems(schema)).toEqual(items);
  });

  it("should return prefixItems for draft 2020-12 tuple", () => {
    const prefixItems = [{ type: "string" }, { type: "number" }];
    const schema: JSONSchema7Extended = {
      type: "array",
      prefixItems: prefixItems as JSONSchema7[],
    };
    expect(getJsonSchemaTupleItems(schema)).toEqual(prefixItems);
  });

  it("should return undefined for non-array schema", () => {
    const schema: JSONSchema7Extended = {
      type: "object",
    };
    expect(getJsonSchemaTupleItems(schema)).toBeUndefined();
  });

  it("should return undefined for array without tuple items", () => {
    const schema: JSONSchema7Extended = {
      type: "array",
      items: { type: "string" },
    };
    expect(getJsonSchemaTupleItems(schema)).toBeUndefined();
  });

  it("should prefer prefixItems over items when both present", () => {
    const prefixItems = [{ type: "boolean" }];
    const items = [{ type: "string" }];
    const schema: JSONSchema7Extended = {
      type: "array",
      prefixItems: prefixItems as JSONSchema7[],
      items: items as JSONSchema7[],
    };
    expect(getJsonSchemaTupleItems(schema)).toEqual(prefixItems);
  });
});

describe("makeJsonSchemaPartial", () => {
  it("should remove required array and make properties nullable", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"],
    };

    const partial = makeJsonSchemaPartial(schema);

    expect(partial.required).toBeUndefined();
    expect(partial.type).toBe("object");
    // Properties should now be nullable via anyOf
    expect(partial.properties).toEqual({
      name: { anyOf: [{ type: "string" }, { type: "null" }] },
      age: { anyOf: [{ type: "number" }, { type: "null" }] },
    });
  });

  it("should preserve all other schema-level properties", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string", description: "The name" },
      },
      required: ["name"],
      additionalProperties: false,
      description: "A person schema",
      title: "Person",
    };

    const partial = makeJsonSchemaPartial(schema);

    expect(partial.required).toBeUndefined();
    expect(partial.type).toBe("object");
    expect(partial.properties).toEqual({
      name: {
        anyOf: [{ type: "string", description: "The name" }, { type: "null" }],
      },
    });
    expect(partial.additionalProperties).toBe(false);
    expect(partial.description).toBe("A person schema");
    expect(partial.title).toBe("Person");
  });

  it("should handle schema without required array", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };

    const partial = makeJsonSchemaPartial(schema);

    expect(partial.required).toBeUndefined();
    expect(partial.type).toBe("object");
    expect(partial.properties).toEqual({
      name: { anyOf: [{ type: "string" }, { type: "null" }] },
    });
  });

  it("should handle schema without properties", () => {
    const schema: JSONSchema7 = {
      type: "object",
      additionalProperties: true,
    };

    const partial = makeJsonSchemaPartial(schema);

    expect(partial.type).toBe("object");
    expect(partial.additionalProperties).toBe(true);
    expect(partial.properties).toBeUndefined();
  });

  it("should not mutate the original schema", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    };

    const partial = makeJsonSchemaPartial(schema);

    // Original should be unchanged
    expect(schema.required).toEqual(["name"]);
    expect(schema.properties).toEqual({ name: { type: "string" } });
    // Partial should not have required
    expect(partial.required).toBeUndefined();
  });

  it("should preserve properties already nullable via anyOf", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        tags: {
          anyOf: [
            { type: "array", items: { type: "string" } },
            { type: "null" },
          ],
        },
      },
    };

    const partial = makeJsonSchemaPartial(schema);

    // Should be unchanged — already nullable
    expect(partial.properties).toEqual(schema.properties);
  });

  it("should preserve properties already nullable via oneOf", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        status: {
          oneOf: [
            { type: "string", enum: ["active", "inactive"] },
            { type: "null" },
          ],
        },
      },
    };

    const partial = makeJsonSchemaPartial(schema);

    // Should be unchanged — already nullable
    expect(partial.properties).toEqual(schema.properties);
  });

  it("should normalize type: [T, 'null'] array form to anyOf", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: ["string", "null"] as unknown as "string" },
        active: { type: ["boolean", "null"] as unknown as "boolean" },
      },
    };

    const partial = makeJsonSchemaPartial(schema);

    expect(partial.properties).toEqual({
      name: { anyOf: [{ type: "string" }, { type: "null" }] },
      active: { anyOf: [{ type: "boolean" }, { type: "null" }] },
    });
  });

  it("should normalize type array with description preserved", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: {
          type: ["string", "null"] as unknown as "string",
          description: "A name field",
        },
      },
    };

    const partial = makeJsonSchemaPartial(schema);

    expect(partial.properties).toEqual({
      name: {
        anyOf: [
          { type: "string", description: "A name field" },
          { type: "null" },
        ],
      },
    });
  });

  it("should handle boolean property schemas", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        anything: true,
        nothing: false,
      },
    };

    const partial = makeJsonSchemaPartial(schema);

    // Boolean schemas should pass through unchanged
    expect(partial.properties).toEqual({
      anything: true,
      nothing: false,
    });
  });
});
