import { describe, it, expect } from "vitest";
import {
  toText,
  isTextContentPart,
  extractTextFromContent,
  hasImages,
} from "./content-parts.js";
import type {
  ContentPart,
  TextContentPart,
  ImageContentPart,
} from "../types.js";

describe("toText", () => {
  it("should return string as-is", () => {
    expect(toText("hello world")).toBe("hello world");
  });

  it("should return empty string for null", () => {
    expect(toText(null)).toBe("");
  });

  it("should return empty string for undefined", () => {
    expect(toText(undefined)).toBe("");
  });

  it("should extract text from ContentPart array", () => {
    const parts: ContentPart[] = [
      { type: "text", text: "Hello " },
      { type: "text", text: "world" },
    ];
    expect(toText(parts)).toBe("Hello world");
  });

  it("should skip non-text parts in array", () => {
    const parts: ContentPart[] = [
      { type: "text", text: "Hello" },
      { type: "image_url", image_url: { url: "http://example.com/img.png" } },
      { type: "text", text: " world" },
    ];
    expect(toText(parts)).toBe("Hello world");
  });

  it("should return empty string for empty array", () => {
    expect(toText([])).toBe("");
  });

  it("should stringify objects", () => {
    expect(toText({ foo: "bar" })).toBe('{"foo":"bar"}');
  });

  it("should stringify numbers", () => {
    expect(toText(42)).toBe("42");
  });
});

describe("isTextContentPart", () => {
  it("should return true for valid TextContentPart", () => {
    const part: TextContentPart = { type: "text", text: "hello" };
    expect(isTextContentPart(part)).toBe(true);
  });

  it("should return false for ImageContentPart", () => {
    const part: ImageContentPart = {
      type: "image_url",
      image_url: { url: "http://example.com/img.png" },
    };
    expect(isTextContentPart(part)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isTextContentPart(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isTextContentPart(undefined)).toBe(false);
  });

  it("should return false for string", () => {
    expect(isTextContentPart("text")).toBe(false);
  });

  it("should return false for object without type", () => {
    expect(isTextContentPart({ text: "hello" })).toBe(false);
  });

  it("should return false for object without text", () => {
    expect(isTextContentPart({ type: "text" })).toBe(false);
  });
});

describe("extractTextFromContent", () => {
  it("should return empty string for null", () => {
    expect(extractTextFromContent(null)).toBe("");
  });

  it("should return empty string for undefined", () => {
    expect(extractTextFromContent(undefined)).toBe("");
  });

  it("should return string as-is", () => {
    expect(extractTextFromContent("hello")).toBe("hello");
  });

  it("should extract text from ContentPart array", () => {
    const parts: ContentPart[] = [
      { type: "text", text: "Hello " },
      { type: "text", text: "world" },
    ];
    expect(extractTextFromContent(parts)).toBe("Hello world");
  });
});

describe("hasImages", () => {
  it("should return false for null", () => {
    expect(hasImages(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(hasImages(undefined)).toBe(false);
  });

  it("should return false for string", () => {
    expect(hasImages("hello")).toBe(false);
  });

  it("should return false for text-only content", () => {
    const parts: ContentPart[] = [
      { type: "text", text: "Hello" },
      { type: "text", text: "world" },
    ];
    expect(hasImages(parts)).toBe(false);
  });

  it("should return true for content with images", () => {
    const parts: ContentPart[] = [
      { type: "text", text: "Hello" },
      { type: "image_url", image_url: { url: "http://example.com/img.png" } },
    ];
    expect(hasImages(parts)).toBe(true);
  });

  it("should return true for content with only images", () => {
    const parts: ContentPart[] = [
      { type: "image_url", image_url: { url: "http://example.com/img.png" } },
    ];
    expect(hasImages(parts)).toBe(true);
  });
});
