import { tryParseJson, tryParseJsonArray, tryParseJsonObject } from "./json";

describe("JSON utilities", () => {
  describe("tryParseJson", () => {
    it("should parse valid JSON", () => {
      const jsonStr = '{"name":"test"}';
      const result = tryParseJson(jsonStr);
      expect(result).toEqual({ name: "test" });
    });

    it("should return null for invalid JSON", () => {
      const invalidJson = "{name:test}";
      const result = tryParseJson(invalidJson);
      expect(result).toBeNull();
    });
  });

  describe("tryParseJsonObject", () => {
    it("should parse valid JSON object", () => {
      const jsonStr = '{"name":"test"}';
      const result = tryParseJsonObject(jsonStr);
      expect(result).toEqual({ name: "test" });
    });

    it("should return null for non-object JSON", () => {
      const jsonArray = "[1,2,3]";
      const result = tryParseJsonObject(jsonArray);
      expect(result).toBeNull();
    });

    it("should throw error for non-object JSON when shouldThrow is true", () => {
      const jsonArray = "[1,2,3]";
      expect(() => tryParseJsonObject(jsonArray, true)).toThrow(
        "Not a JSON object",
      );
    });
  });

  describe("tryParseJsonArray", () => {
    it("should parse valid JSON array", () => {
      const jsonStr = "[1,2,3]";
      const result = tryParseJsonArray(jsonStr);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should return null for non-array JSON", () => {
      const jsonObj = '{"name":"test"}';
      const result = tryParseJsonArray(jsonObj);
      expect(result).toBeNull();
    });

    it("should throw error for non-array JSON when shouldThrow is true", () => {
      const jsonObj = '{"name":"test"}';
      expect(() => tryParseJsonArray(jsonObj, true)).toThrow(
        "Not a JSON array",
      );
    });
  });
});
