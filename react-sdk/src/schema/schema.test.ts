import type { JSONSchema7 } from "json-schema";
import { z } from "zod/v4";
import { looksLikeJSONSchema } from "./json-schema";
import { isStandardSchema } from "./standard-schema";

describe("schema utilities", () => {
  describe("looksLikeJSONSchema", () => {
    it("returns true for a basic JSON Schema object", () => {
      const jsonSchema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "integer" },
        },
        required: ["name"],
      };

      expect(looksLikeJSONSchema(jsonSchema)).toBe(true);
    });

    it("returns true for a union type JSON Schema", () => {
      const jsonSchema: JSONSchema7 = {
        type: ["string", "null"],
      };

      expect(looksLikeJSONSchema(jsonSchema)).toBe(true);
    });

    it("returns false for Standard Schema validators", () => {
      const zodSchema = z.object({
        name: z.string(),
      });

      expect(isStandardSchema(zodSchema)).toBe(true);
      expect(looksLikeJSONSchema(zodSchema)).toBe(false);
    });

    it("returns false for arbitrary objects that do not resemble JSON Schema", () => {
      const notSchema = {
        type: "foo",
        other: "bar",
      };

      expect(looksLikeJSONSchema(notSchema)).toBe(false);
    });
  });
});
