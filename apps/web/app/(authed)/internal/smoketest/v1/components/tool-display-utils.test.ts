import { formatToolResultContent } from "./tool-display-utils";

describe("formatToolResultContent", () => {
  describe("string input", () => {
    it("pretty-prints valid JSON string", () => {
      const input = '{"key":"value"}';
      const result = formatToolResultContent(input);
      expect(result).toBe('{\n  "key": "value"\n}');
    });

    it("returns string as-is when not valid JSON", () => {
      const input = "plain text result";
      const result = formatToolResultContent(input);
      expect(result).toBe("plain text result");
    });

    it("handles empty JSON object string", () => {
      const input = "{}";
      const result = formatToolResultContent(input);
      expect(result).toBe("{}");
    });

    it("handles JSON array string", () => {
      const input = '["a","b"]';
      const result = formatToolResultContent(input);
      expect(result).toBe('[\n  "a",\n  "b"\n]');
    });
  });

  describe("array input", () => {
    it("extracts and combines text from content parts", () => {
      const input = [
        { type: "text", text: "Hello " },
        { type: "text", text: "World" },
      ];
      const result = formatToolResultContent(input);
      expect(result).toBe("Hello World");
    });

    it("filters out non-text content parts", () => {
      const input = [
        { type: "text", text: "Hello" },
        { type: "image", url: "http://example.com/img.png" },
        { type: "text", text: " World" },
      ];
      const result = formatToolResultContent(input);
      expect(result).toBe("Hello World");
    });

    it("pretty-prints when combined text is valid JSON", () => {
      const input = [
        { type: "text", text: '{"result":' },
        { type: "text", text: '"success"}' },
      ];
      const result = formatToolResultContent(input);
      expect(result).toBe('{\n  "result": "success"\n}');
    });

    it("returns empty string for empty array", () => {
      const result = formatToolResultContent([]);
      expect(result).toBe("");
    });

    it("returns empty string for array with no text parts", () => {
      const input = [{ type: "image", url: "http://example.com" }];
      const result = formatToolResultContent(input);
      expect(result).toBe("");
    });
  });

  describe("other input types", () => {
    it("JSON stringifies object input", () => {
      const input = { key: "value" };
      const result = formatToolResultContent(input);
      expect(result).toBe('{\n  "key": "value"\n}');
    });

    it("JSON stringifies number input", () => {
      const input = 42;
      const result = formatToolResultContent(input);
      expect(result).toBe("42");
    });

    it("JSON stringifies null input", () => {
      const result = formatToolResultContent(null);
      expect(result).toBe("null");
    });

    it("JSON stringifies boolean input", () => {
      const result = formatToolResultContent(true);
      expect(result).toBe("true");
    });
  });
});
