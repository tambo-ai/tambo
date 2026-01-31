/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it } from "@jest/globals";
import { convertContentToMarkdown } from "../../lib/thread-hooks";

describe("convertContentToMarkdown", () => {
  describe("empty/null content", () => {
    it("returns empty string for null", () => {
      expect(convertContentToMarkdown(null)).toBe("");
    });

    it("returns empty string for undefined", () => {
      expect(convertContentToMarkdown(undefined)).toBe("");
    });

    it("returns empty string for empty string", () => {
      expect(convertContentToMarkdown("")).toBe("");
    });
  });

  describe("string content", () => {
    it("returns string content as-is", () => {
      expect(convertContentToMarkdown("Hello world")).toBe("Hello world");
    });

    it("preserves markdown formatting in strings", () => {
      expect(convertContentToMarkdown("**bold** and *italic*")).toBe(
        "**bold** and *italic*",
      );
    });
  });

  describe("array content", () => {
    it("extracts text from text content parts", () => {
      const content = [{ type: "text" as const, text: "Hello" }];
      expect(convertContentToMarkdown(content)).toBe("Hello");
    });

    it("joins multiple text parts with space", () => {
      const content = [
        { type: "text" as const, text: "Hello" },
        { type: "text" as const, text: "World" },
      ];
      expect(convertContentToMarkdown(content)).toBe("Hello World");
    });

    it("handles empty text parts", () => {
      const content = [{ type: "text" as const, text: "" }];
      expect(convertContentToMarkdown(content)).toBe("");
    });

    it("handles text parts with undefined text", () => {
      const content = [{ type: "text" as const }];
      expect(convertContentToMarkdown(content)).toBe("");
    });

    it("converts resource content to markdown links", () => {
      const content = [
        {
          type: "resource" as const,
          resource: {
            uri: "file:///test.txt",
            name: "Test File",
          },
        },
      ];
      expect(convertContentToMarkdown(content)).toBe(
        "[Test File](tambo-resource://file%3A%2F%2F%2Ftest.txt)",
      );
    });

    it("uses URI as display name when resource has no name", () => {
      const content = [
        {
          type: "resource" as const,
          resource: {
            uri: "file:///test.txt",
          },
        },
      ];
      expect(convertContentToMarkdown(content)).toBe(
        "[file:///test.txt](tambo-resource://file%3A%2F%2F%2Ftest.txt)",
      );
    });

    it("skips resource content without URI", () => {
      const content = [
        {
          type: "resource" as const,
          resource: {
            name: "Test File",
          },
        },
      ];
      expect(convertContentToMarkdown(content)).toBe("");
    });

    it("handles mixed text and resource content", () => {
      const content = [
        { type: "text" as const, text: "See" },
        {
          type: "resource" as const,
          resource: {
            uri: "file:///doc.md",
            name: "docs",
          },
        },
      ];
      expect(convertContentToMarkdown(content)).toBe(
        "See [docs](tambo-resource://file%3A%2F%2F%2Fdoc.md)",
      );
    });

    it("ignores unknown content types", () => {
      const content = [
        { type: "text" as const, text: "Hello" },
        {
          type: "image_url" as const,
          image_url: { url: "http://example.com/img.png" },
        },
      ];
      expect(convertContentToMarkdown(content)).toBe("Hello");
    });

    it("handles empty array", () => {
      expect(convertContentToMarkdown([])).toBe("");
    });
  });

  describe("edge cases", () => {
    it("returns empty string for unknown types", () => {
      expect(convertContentToMarkdown({} as unknown as string)).toBe("");
    });

    it("returns empty string for numbers", () => {
      expect(convertContentToMarkdown(123 as unknown as string)).toBe("");
    });
  });
});
