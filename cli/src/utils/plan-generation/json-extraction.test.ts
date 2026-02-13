/**
 * Tests for JSON extraction utility
 */

import { extractJsonFromResponse } from "./json-extraction.js";

describe("extractJsonFromResponse", () => {
  it("extracts from ```json code block", () => {
    const input = 'Here\'s the result:\n```json\n{"key": "value"}\n```\nDone!';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ key: "value" });
  });

  it("extracts from ``` code block (no language tag)", () => {
    const input = 'Result:\n```\n{"key": "value"}\n```';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ key: "value" });
  });

  it("extracts from raw JSON object (no wrapping text)", () => {
    const input = '{"key": "value", "nested": {"foo": "bar"}}';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ key: "value", nested: { foo: "bar" } });
  });

  it("extracts from JSON embedded in explanatory text", () => {
    const input =
      'Here is the plan:\n{"status": "success", "data": [1, 2, 3]}\nLet me know what you think!';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ status: "success", data: [1, 2, 3] });
  });

  it("extracts from raw JSON array", () => {
    const input = '[{"id": 1}, {"id": 2}, {"id": 3}]';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it("handles nested objects correctly", () => {
    const input = JSON.stringify({
      outer: {
        middle: {
          inner: {
            value: "deeply nested",
          },
        },
      },
    });
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({
      outer: {
        middle: {
          inner: {
            value: "deeply nested",
          },
        },
      },
    });
  });

  it("throws with descriptive error for non-JSON text", () => {
    const input = "This is just plain text without any JSON";
    expect(() => extractJsonFromResponse(input)).toThrow(
      /Failed to extract JSON from response:/,
    );
    expect(() => extractJsonFromResponse(input)).toThrow(/This is just plain/);
  });

  it("throws with descriptive error for empty string", () => {
    const input = "";
    expect(() => extractJsonFromResponse(input)).toThrow(
      /Failed to extract JSON from response:/,
    );
  });

  it("handles trailing commas gracefully (JSON.parse will reject)", () => {
    const input = '{"key": "value",}';
    // JSON.parse rejects trailing commas - this should throw
    expect(() => extractJsonFromResponse(input)).toThrow(
      /Failed to extract JSON from response:/,
    );
  });
});
