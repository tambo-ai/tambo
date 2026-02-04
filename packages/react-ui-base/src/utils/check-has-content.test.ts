import * as React from "react";
import { checkHasContent } from "./check-has-content";

describe("checkHasContent", () => {
  describe("null/undefined content", () => {
    it("returns false for null", () => {
      expect(checkHasContent(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(checkHasContent(undefined)).toBe(false);
    });
  });

  describe("string content", () => {
    it("returns true for non-empty string", () => {
      expect(checkHasContent("hello")).toBe(true);
    });

    it("returns false for empty string", () => {
      expect(checkHasContent("")).toBe(false);
    });

    it("returns false for whitespace-only string", () => {
      expect(checkHasContent("   ")).toBe(false);
      expect(checkHasContent("\n\t")).toBe(false);
    });

    it("returns true for string with leading/trailing whitespace", () => {
      expect(checkHasContent("  hello  ")).toBe(true);
    });
  });

  describe("number content", () => {
    it("returns true for non-zero numbers", () => {
      expect(checkHasContent(42)).toBe(true);
      expect(checkHasContent(-1)).toBe(true);
      expect(checkHasContent(3.14)).toBe(true);
    });

    it("returns true for zero", () => {
      expect(checkHasContent(0)).toBe(true);
    });

    it("returns false for NaN", () => {
      expect(checkHasContent(NaN)).toBe(false);
    });
  });

  describe("React element content", () => {
    it("returns true for React element", () => {
      const element = React.createElement("div", null, "Hello");
      expect(checkHasContent(element)).toBe(true);
    });

    it("returns true for empty React element", () => {
      const element = React.createElement("div");
      expect(checkHasContent(element)).toBe(true);
    });
  });

  describe("array content with ReactNode items", () => {
    it("returns true for string array with non-empty strings", () => {
      expect(checkHasContent(["hello", "world"])).toBe(true);
    });

    it("returns false for string array with only empty/whitespace strings", () => {
      expect(checkHasContent(["", "  ", "\n"])).toBe(false);
    });

    it("returns true for mixed string array (some non-empty)", () => {
      expect(checkHasContent(["", "hello", ""])).toBe(true);
    });

    it("returns true for array with React elements", () => {
      const elements = [
        React.createElement("span", { key: "1" }, "Hello"),
        React.createElement("span", { key: "2" }, "World"),
      ];
      expect(checkHasContent(elements)).toBe(true);
    });

    it("returns true for array with number items", () => {
      expect(checkHasContent([1, 2, 3])).toBe(true);
      expect(checkHasContent([0])).toBe(true);
    });

    it("returns false for array with only NaN", () => {
      expect(checkHasContent([NaN])).toBe(false);
    });

    it("returns true for mixed ReactNode array", () => {
      const mixed = ["hello", React.createElement("span", { key: "1" }), 42];
      expect(checkHasContent(mixed)).toBe(true);
    });

    it("returns false for empty array", () => {
      expect(checkHasContent([])).toBe(false);
    });

    it("returns false for array with only null/undefined", () => {
      expect(checkHasContent([null, undefined])).toBe(false);
    });

    it("returns false for array with only booleans", () => {
      expect(checkHasContent([true, false])).toBe(false);
    });
  });

  describe("array content with API content parts (ChatCompletionContentPart)", () => {
    it("returns true for text content part with non-empty text", () => {
      expect(checkHasContent([{ type: "text", text: "Hello" }])).toBe(true);
    });

    it("returns false for text content part with empty text", () => {
      expect(checkHasContent([{ type: "text", text: "" }])).toBe(false);
    });

    it("returns false for text content part with whitespace-only text", () => {
      expect(checkHasContent([{ type: "text", text: "   " }])).toBe(false);
    });

    it("returns false for text content part with undefined text", () => {
      expect(checkHasContent([{ type: "text" }])).toBe(false);
    });

    it("returns true for image_url content part with url", () => {
      expect(
        checkHasContent([
          {
            type: "image_url",
            image_url: { url: "https://example.com/img.png" },
          },
        ]),
      ).toBe(true);
    });

    it("returns false for image_url content part without url", () => {
      // Test runtime behavior with malformed data (missing required url field)
      expect(
        checkHasContent([
          { type: "image_url", image_url: {} } as {
            type: "image_url";
            image_url: { url: string };
          },
        ]),
      ).toBe(false);
    });

    it("returns false for image_url content part with undefined image_url", () => {
      expect(checkHasContent([{ type: "image_url" }])).toBe(false);
    });

    it("returns true for input_audio content part with data", () => {
      expect(
        checkHasContent([
          {
            type: "input_audio",
            input_audio: { data: "base64data", format: "wav" },
          },
        ]),
      ).toBe(true);
    });

    it("returns false for input_audio content part without data", () => {
      // Test runtime behavior with malformed data (missing required fields)
      expect(
        checkHasContent([
          { type: "input_audio", input_audio: {} } as {
            type: "input_audio";
            input_audio: { data: string; format: "wav" | "mp3" };
          },
        ]),
      ).toBe(false);
    });

    it("returns true for resource content part with resource", () => {
      expect(
        checkHasContent([
          { type: "resource", resource: { uri: "file://test" } },
        ]),
      ).toBe(true);
    });

    it("returns false for resource content part with null resource", () => {
      // Test runtime behavior with malformed data (null instead of undefined)
      expect(
        checkHasContent([
          { type: "resource", resource: null } as unknown as {
            type: "resource";
            resource: { uri: string };
          },
        ]),
      ).toBe(false);
    });

    it("returns true for mixed API content parts (some valid)", () => {
      expect(
        checkHasContent([
          { type: "text", text: "" },
          { type: "text", text: "Hello" },
        ]),
      ).toBe(true);
    });

    it("returns false for unknown type content part", () => {
      // Test runtime behavior with unknown type
      expect(
        checkHasContent([
          { type: "unknown" } as unknown as { type: "text"; text: string },
        ]),
      ).toBe(false);
    });
  });

  describe("boolean content", () => {
    it("returns false for true", () => {
      expect(checkHasContent(true as unknown as React.ReactNode)).toBe(false);
    });

    it("returns false for false", () => {
      expect(checkHasContent(false as unknown as React.ReactNode)).toBe(false);
    });
  });
});
