import {
  extractTamboDisplayProps,
  filterTamboProps,
  formatToolResultContent,
} from "./tool-display-utils";

describe("extractTamboDisplayProps", () => {
  it("extracts _tambo_displayMessage when present", () => {
    const input = { _tambo_displayMessage: "Hello", other: "value" };
    const result = extractTamboDisplayProps(input);
    expect(result._tambo_displayMessage).toBe("Hello");
  });

  it("extracts _tambo_statusMessage when present", () => {
    const input = { _tambo_statusMessage: "Loading..." };
    const result = extractTamboDisplayProps(input);
    expect(result._tambo_statusMessage).toBe("Loading...");
  });

  it("extracts _tambo_completionStatusMessage when present", () => {
    const input = { _tambo_completionStatusMessage: "Done!" };
    const result = extractTamboDisplayProps(input);
    expect(result._tambo_completionStatusMessage).toBe("Done!");
  });

  it("extracts multiple tambo props", () => {
    const input = {
      _tambo_displayMessage: "Display",
      _tambo_statusMessage: "Status",
      _tambo_completionStatusMessage: "Complete",
      normalProp: "value",
    };
    const result = extractTamboDisplayProps(input);
    expect(result).toEqual({
      _tambo_displayMessage: "Display",
      _tambo_statusMessage: "Status",
      _tambo_completionStatusMessage: "Complete",
    });
  });

  it("returns empty object when no tambo props present", () => {
    const input = { foo: "bar", baz: 123 };
    const result = extractTamboDisplayProps(input);
    expect(result).toEqual({});
  });

  it("ignores non-string tambo props", () => {
    const input = {
      _tambo_displayMessage: 123,
      _tambo_statusMessage: { nested: true },
    };
    const result = extractTamboDisplayProps(input);
    expect(result).toEqual({});
  });

  it("handles empty input", () => {
    const result = extractTamboDisplayProps({});
    expect(result).toEqual({});
  });
});

describe("filterTamboProps", () => {
  it("removes _tambo_displayMessage", () => {
    const input = { _tambo_displayMessage: "Hello", other: "value" };
    const result = filterTamboProps(input);
    expect(result).toEqual({ other: "value" });
  });

  it("removes all tambo props", () => {
    const input = {
      _tambo_displayMessage: "Display",
      _tambo_statusMessage: "Status",
      _tambo_completionStatusMessage: "Complete",
      normalProp: "value",
      anotherProp: 123,
    };
    const result = filterTamboProps(input);
    expect(result).toEqual({ normalProp: "value", anotherProp: 123 });
  });

  it("returns all props when no tambo props present", () => {
    const input = { foo: "bar", baz: 123 };
    const result = filterTamboProps(input);
    expect(result).toEqual({ foo: "bar", baz: 123 });
  });

  it("returns empty object when input only has tambo props", () => {
    const input = {
      _tambo_displayMessage: "Display",
      _tambo_statusMessage: "Status",
    };
    const result = filterTamboProps(input);
    expect(result).toEqual({});
  });

  it("handles empty input", () => {
    const result = filterTamboProps({});
    expect(result).toEqual({});
  });
});

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
