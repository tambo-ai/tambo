import { jest } from "@jest/globals";
import * as React from "react";
import { convertContentToMarkdown, getMessageImages } from "./message-content";

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

  describe("React element content", () => {
    it("returns empty string for React elements", () => {
      const element = React.createElement("div", null, "Hello");
      expect(convertContentToMarkdown(element)).toBe("");
    });

    it("logs warning in development for React elements", () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      const element = React.createElement("div", null, "Hello");
      convertContentToMarkdown(element);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Received a React element"),
      );

      warnSpy.mockRestore();
      process.env.NODE_ENV = originalNodeEnv;
    });

    it("does not log warning in production for React elements", () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      const element = React.createElement("div", null, "Hello");
      convertContentToMarkdown(element);

      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
      process.env.NODE_ENV = originalNodeEnv;
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
      // Test runtime behavior with malformed data (missing required text field)
      const content = [
        { type: "text" as const } as unknown as { type: "text"; text: string },
      ];
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
      // Test runtime behavior — image_url is not a V1 Content type but may appear at runtime
      const content = [
        { type: "text" as const, text: "Hello" },
        {
          type: "image_url",
          image_url: { url: "http://example.com/img.png" },
        } as unknown as { type: "text"; text: string },
      ];
      expect(convertContentToMarkdown(content)).toBe("Hello");
    });

    it("handles empty array", () => {
      expect(convertContentToMarkdown([])).toBe("");
    });
  });

  describe("markdown link text escaping", () => {
    it("escapes closing brackets in resource name", () => {
      const content = [
        {
          type: "resource" as const,
          resource: {
            uri: "file:///test.txt",
            name: "File [with] brackets",
          },
        },
      ];
      expect(convertContentToMarkdown(content)).toBe(
        "[File \\[with\\] brackets](tambo-resource://file%3A%2F%2F%2Ftest.txt)",
      );
    });

    it("replaces newlines with spaces in resource name", () => {
      const content = [
        {
          type: "resource" as const,
          resource: {
            uri: "file:///test.txt",
            name: "Line 1\nLine 2\r\nLine 3",
          },
        },
      ];
      expect(convertContentToMarkdown(content)).toBe(
        "[Line 1 Line 2 Line 3](tambo-resource://file%3A%2F%2F%2Ftest.txt)",
      );
    });

    it("escapes backslashes in resource name", () => {
      const content = [
        {
          type: "resource" as const,
          resource: {
            uri: "file:///test.txt",
            name: "C:\\Users\\file.txt",
          },
        },
      ];
      expect(convertContentToMarkdown(content)).toBe(
        "[C:\\\\Users\\\\file.txt](tambo-resource://file%3A%2F%2F%2Ftest.txt)",
      );
    });

    it("handles resource name with multiple special characters", () => {
      const content = [
        {
          type: "resource" as const,
          resource: {
            uri: "file:///test.txt",
            name: "File [v1] \\path\nNew",
          },
        },
      ];
      expect(convertContentToMarkdown(content)).toBe(
        "[File \\[v1\\] \\\\path New](tambo-resource://file%3A%2F%2F%2Ftest.txt)",
      );
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

describe("getMessageImages", () => {
  it("returns empty array for null content", () => {
    expect(getMessageImages(null)).toEqual([]);
  });

  it("returns empty array for undefined content", () => {
    expect(getMessageImages(undefined)).toEqual([]);
  });

  it("returns empty array for empty array", () => {
    expect(getMessageImages([])).toEqual([]);
  });

  it("extracts image URLs from image_url content parts", () => {
    const content = [
      { type: "image_url", image_url: { url: "http://example.com/img1.png" } },
      { type: "image_url", image_url: { url: "http://example.com/img2.png" } },
    ];
    expect(getMessageImages(content)).toEqual([
      "http://example.com/img1.png",
      "http://example.com/img2.png",
    ]);
  });

  it("filters out non-image content types", () => {
    const content = [
      { type: "text" },
      { type: "image_url", image_url: { url: "http://example.com/img.png" } },
      { type: "resource" },
    ];
    expect(getMessageImages(content)).toEqual(["http://example.com/img.png"]);
  });

  it("filters out image_url parts without url", () => {
    const content = [
      { type: "image_url", image_url: {} },
      { type: "image_url", image_url: { url: "http://example.com/img.png" } },
    ];
    expect(getMessageImages(content)).toEqual(["http://example.com/img.png"]);
  });
});
