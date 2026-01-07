import * as z3 from "zod/v3";
import * as z4 from "zod/v4";
import { isStandardSchema } from "./standard-schema";

describe("isStandardSchema", () => {
  describe("returns true for valid Standard Schema implementations", () => {
    it("recognizes Zod 4 object schema", () => {
      const schema = z4.object({ name: z4.string() });
      expect(isStandardSchema(schema)).toBe(true);
    });

    it("recognizes Zod 3 object schema", () => {
      const schema = z3.object({ name: z3.string() });
      expect(isStandardSchema(schema)).toBe(true);
    });

    it("recognizes Zod 4 string schema", () => {
      const schema = z4.string();
      expect(isStandardSchema(schema)).toBe(true);
    });

    it("recognizes Zod 3 string schema", () => {
      const schema = z3.string();
      expect(isStandardSchema(schema)).toBe(true);
    });

    it("recognizes Zod 4 array schema", () => {
      const schema = z4.array(z4.number());
      expect(isStandardSchema(schema)).toBe(true);
    });

    it("recognizes Zod 3 array schema", () => {
      const schema = z3.array(z3.number());
      expect(isStandardSchema(schema)).toBe(true);
    });

    it("recognizes custom object implementing Standard Schema v1", () => {
      const customSchema = {
        "~standard": {
          version: 1,
          vendor: "custom",
          validate: () => ({ value: {} }),
        },
      };
      expect(isStandardSchema(customSchema)).toBe(true);
    });
  });

  describe("returns false for non-Standard Schema values", () => {
    it("rejects null", () => {
      expect(isStandardSchema(null)).toBe(false);
    });

    it("rejects undefined", () => {
      expect(isStandardSchema(undefined)).toBe(false);
    });

    it("rejects primitives", () => {
      expect(isStandardSchema("string")).toBe(false);
      expect(isStandardSchema(123)).toBe(false);
      expect(isStandardSchema(true)).toBe(false);
    });

    it("rejects plain objects without ~standard", () => {
      expect(isStandardSchema({ foo: "bar" })).toBe(false);
    });

    it("rejects JSON Schema objects", () => {
      const jsonSchema = {
        type: "object",
        properties: { name: { type: "string" } },
      };
      expect(isStandardSchema(jsonSchema)).toBe(false);
    });

    it("rejects objects with ~standard that is not an object", () => {
      expect(isStandardSchema({ "~standard": "invalid" })).toBe(false);
      expect(isStandardSchema({ "~standard": 123 })).toBe(false);
      expect(isStandardSchema({ "~standard": true })).toBe(false);
    });

    it("rejects objects with ~standard that is null", () => {
      expect(isStandardSchema({ "~standard": null })).toBe(false);
    });

    it("rejects objects with wrong version", () => {
      const invalidVersion = {
        "~standard": {
          version: 2, // Wrong version
          vendor: "custom",
          validate: () => ({ value: {} }),
        },
      };
      expect(isStandardSchema(invalidVersion)).toBe(false);
    });

    it("rejects objects with missing version", () => {
      const missingVersion = {
        "~standard": {
          vendor: "custom",
          validate: () => ({ value: {} }),
        },
      };
      expect(isStandardSchema(missingVersion)).toBe(false);
    });

    it("rejects objects with non-string vendor", () => {
      const invalidVendor = {
        "~standard": {
          version: 1,
          vendor: 123, // Not a string
          validate: () => ({ value: {} }),
        },
      };
      expect(isStandardSchema(invalidVendor)).toBe(false);
    });

    it("rejects objects with missing vendor", () => {
      const missingVendor = {
        "~standard": {
          version: 1,
          validate: () => ({ value: {} }),
        },
      };
      expect(isStandardSchema(missingVendor)).toBe(false);
    });

    it("rejects objects with non-function validate", () => {
      const invalidValidate = {
        "~standard": {
          version: 1,
          vendor: "custom",
          validate: "not-a-function",
        },
      };
      expect(isStandardSchema(invalidValidate)).toBe(false);
    });

    it("rejects objects with missing validate", () => {
      const missingValidate = {
        "~standard": {
          version: 1,
          vendor: "custom",
        },
      };
      expect(isStandardSchema(missingValidate)).toBe(false);
    });
  });
});
