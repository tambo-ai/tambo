import React from "react";
import {
  getSafeContent,
  checkHasContent,
  getMessageImages,
  getMessageAttachments,
  TamboMessageAttachment,
} from "../message-content";

describe("getSafeContent", () => {
  it("should return empty string for null/undefined", () => {
    expect(getSafeContent(null)).toBe("");
    expect(getSafeContent(undefined)).toBe("");
  });

  it("should return string directly", () => {
    expect(getSafeContent("Hello world")).toBe("Hello world");
  });

  it("should return ReactElement as-is", () => {
    const element = React.createElement("div", null, "Test");
    const result = getSafeContent(element);
    expect(result).toBe(element);
  });

  it("should extract text from text content part", () => {
    const content = { type: "text", text: "Hello" };
    expect(getSafeContent(content)).toBe("Hello");
  });

  it("should format image_url content part", () => {
    const content = {
      type: "image_url",
      image_url: { url: "https://example.com/image.png" },
    };
    expect(getSafeContent(content)).toBe(
      "[Image: https://example.com/image.png]",
    );
  });

  it("should format input_audio content part", () => {
    const content = {
      type: "input_audio",
      input_audio: { data: "base64data", format: "wav" },
    };
    expect(getSafeContent(content)).toBe("[Audio input]");
  });

  it("should extract text from array of content parts", () => {
    const content = [
      { type: "text", text: "First part" },
      { type: "text", text: "Second part" },
    ];
    expect(getSafeContent(content)).toBe("First part\nSecond part");
  });

  it("should handle mixed content parts array", () => {
    const content = [
      { type: "text", text: "Check this:" },
      {
        type: "image_url",
        image_url: { url: "https://example.com/image.png" },
      },
      { type: "text", text: "And this audio:" },
      {
        type: "input_audio",
        input_audio: { data: "base64", format: "wav" },
      },
    ];

    const result = getSafeContent(content);
    expect(result).toBe(
      "Check this:\n[Image: https://example.com/image.png]\nAnd this audio:\n[Audio input]",
    );
  });

  it("should handle array with string items", () => {
    const content = ["Hello", "World"];
    expect(getSafeContent(content)).toBe("Hello\nWorld");
  });

  it("should handle array with mixed string and content parts", () => {
    const content = [
      "String item",
      { type: "text", text: "Text part" },
      { type: "image_url", image_url: { url: "test.png" } },
    ];
    expect(getSafeContent(content)).toBe(
      "String item\nText part\n[Image: test.png]",
    );
  });

  it("should handle array with non-string, non-content-part items", () => {
    const content = [
      { type: "text", text: "Valid text" },
      { invalid: "object" },
      42,
    ];
    const result = getSafeContent(content);
    expect(result).toContain("Valid text");
    expect(result).toContain('{"invalid":"object"}');
    expect(result).toContain("42");
  });

  it("should handle empty array", () => {
    expect(getSafeContent([])).toBe("");
  });

  it("should fallback to string conversion for unknown types", () => {
    const content = { unknown: "type", nested: { value: 42 } };
    const result = getSafeContent(content);
    expect(typeof result).toBe("string");
    expect(result).toContain("unknown");
  });

  it("should handle numbers", () => {
    const result = getSafeContent(42);
    expect(result).toBe("42");
  });

  it("should handle booleans", () => {
    expect(getSafeContent(true)).toBe("true");
    expect(getSafeContent(false)).toBe("false");
  });

  it("should handle circular references safely", () => {
    const circular: any = { a: 1 };
    circular.self = circular;
    expect(() => getSafeContent(circular)).not.toThrow();
  });
});

describe("checkHasContent", () => {
  it("should return false for null/undefined", () => {
    expect(checkHasContent(null)).toBe(false);
    expect(checkHasContent(undefined)).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(checkHasContent("")).toBe(false);
  });

  it("should return false for whitespace-only string", () => {
    expect(checkHasContent("   ")).toBe(false);
    expect(checkHasContent("\n\t  \n")).toBe(false);
  });

  it("should return true for non-empty string", () => {
    expect(checkHasContent("Hello")).toBe(true);
    expect(checkHasContent("  Hello  ")).toBe(true);
  });

  it("should return true for ReactElement", () => {
    const element = React.createElement("div", null, "Test");
    expect(checkHasContent(element)).toBe(true);
  });

  it("should return false for empty array", () => {
    expect(checkHasContent([])).toBe(false);
  });

  it("should return true for array with text content", () => {
    expect(checkHasContent([{ type: "text", text: "Hello" }])).toBe(true);
  });

  it("should return false for array with empty text", () => {
    expect(checkHasContent([{ type: "text", text: "" }])).toBe(false);
    expect(checkHasContent([{ type: "text", text: "   " }])).toBe(false);
  });

  it("should return true for array with non-text content parts", () => {
    expect(
      checkHasContent([{ type: "image_url", image_url: { url: "test.png" } }]),
    ).toBe(true);
    expect(
      checkHasContent([
        { type: "input_audio", input_audio: { data: "data", format: "wav" } },
      ]),
    ).toBe(true);
  });

  it("should return true if any item in array has content", () => {
    const content = [
      { type: "text", text: "" },
      { type: "text", text: "   " },
      { type: "text", text: "Valid content" },
    ];
    expect(checkHasContent(content)).toBe(true);
  });

  it("should return false if all items in array are empty", () => {
    const content = [
      { type: "text", text: "" },
      { type: "text", text: "   " },
    ];
    expect(checkHasContent(content)).toBe(false);
  });

  it("should handle single text content part", () => {
    expect(checkHasContent({ type: "text", text: "Hello" })).toBe(true);
    expect(checkHasContent({ type: "text", text: "" })).toBe(false);
    expect(checkHasContent({ type: "text", text: "   " })).toBe(false);
  });

  it("should handle single non-text content part", () => {
    expect(
      checkHasContent({
        type: "image_url",
        image_url: { url: "test.png" },
      }),
    ).toBe(true);
    expect(
      checkHasContent({
        type: "input_audio",
        input_audio: { data: "data", format: "wav" },
      }),
    ).toBe(true);
  });

  it("should return true for numbers", () => {
    expect(checkHasContent(42)).toBe(true);
    expect(checkHasContent(0)).toBe(true);
  });

  it("should return true for booleans", () => {
    expect(checkHasContent(true)).toBe(true);
    expect(checkHasContent(false)).toBe(true);
  });

  it("should return true for objects", () => {
    expect(checkHasContent({ custom: "object" })).toBe(true);
  });

  it("should handle nested arrays", () => {
    const content = [
      [{ type: "text", text: "Nested" }],
      { type: "text", text: "" },
    ];
    expect(checkHasContent(content)).toBe(true);
  });

  it("should return false for empty string at any level", () => {
    expect(checkHasContent("")).toBe(false);
  });
});

describe("getMessageImages", () => {
  it("should return empty array for non-array input", () => {
    expect(getMessageImages(null as any)).toEqual([]);
    expect(getMessageImages(undefined as any)).toEqual([]);
    expect(getMessageImages("string" as any)).toEqual([]);
    expect(getMessageImages({} as any)).toEqual([]);
  });

  it("should return empty array for empty array", () => {
    expect(getMessageImages([])).toEqual([]);
  });

  it("should extract single image URL", () => {
    const content = [
      {
        type: "image_url",
        image_url: { url: "https://example.com/image.png" },
      },
    ];
    expect(getMessageImages(content)).toEqual([
      "https://example.com/image.png",
    ]);
  });

  it("should extract multiple image URLs", () => {
    const content = [
      {
        type: "image_url",
        image_url: { url: "https://example.com/image1.png" },
      },
      { type: "text", text: "Some text" },
      {
        type: "image_url",
        image_url: { url: "https://example.com/image2.jpg" },
      },
      {
        type: "image_url",
        image_url: { url: "data:image/png;base64,abc123" },
      },
    ];
    expect(getMessageImages(content)).toEqual([
      "https://example.com/image1.png",
      "https://example.com/image2.jpg",
      "data:image/png;base64,abc123",
    ]);
  });

  it("should ignore non-image content parts", () => {
    const content = [
      { type: "text", text: "Hello" },
      {
        type: "input_audio",
        input_audio: { data: "data", format: "wav" },
      },
      {
        type: "image_url",
        image_url: { url: "https://example.com/image.png" },
      },
    ];
    expect(getMessageImages(content)).toEqual([
      "https://example.com/image.png",
    ]);
  });

  it("should ignore image_url parts without url", () => {
    const content = [
      { type: "image_url", image_url: {} as any },
      {
        type: "image_url",
        image_url: { url: "https://example.com/valid.png" },
      },
    ];
    expect(getMessageImages(content)).toEqual([
      "https://example.com/valid.png",
    ]);
  });

  it("should handle data URLs", () => {
    const content = [
      {
        type: "image_url",
        image_url: { url: "data:image/png;base64,iVBORw0KGgo=" },
      },
      {
        type: "image_url",
        image_url: { url: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" },
      },
    ];
    expect(getMessageImages(content)).toEqual([
      "data:image/png;base64,iVBORw0KGgo=",
      "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
    ]);
  });

  it("should preserve order of images", () => {
    const content = [
      { type: "image_url", image_url: { url: "first.png" } },
      { type: "image_url", image_url: { url: "second.png" } },
      { type: "image_url", image_url: { url: "third.png" } },
    ];
    expect(getMessageImages(content)).toEqual([
      "first.png",
      "second.png",
      "third.png",
    ]);
  });

  it("should handle array with non-content-part items", () => {
    const content = [
      "string",
      42,
      { type: "image_url", image_url: { url: "test.png" } },
      { invalid: "object" },
    ];
    expect(getMessageImages(content)).toEqual(["test.png"]);
  });
});

describe("getMessageAttachments", () => {
  it("should return empty array for non-array input", () => {
    expect(getMessageAttachments(null as any)).toEqual([]);
    expect(getMessageAttachments(undefined as any)).toEqual([]);
    expect(getMessageAttachments("string" as any)).toEqual([]);
    expect(getMessageAttachments({} as any)).toEqual([]);
  });

  it("should return empty array for empty array", () => {
    expect(getMessageAttachments([])).toEqual([]);
  });

  it("should extract image attachment with MIME type from data URL", () => {
    const content = [
      {
        type: "image_url",
        image_url: { url: "data:image/png;base64,abc123" },
      },
    ];
    const attachments = getMessageAttachments(content);
    expect(attachments).toHaveLength(1);
    expect(attachments[0]).toMatchObject({
      kind: "image",
      type: "image/png",
      url: "data:image/png;base64,abc123",
      mimeType: "image/png",
    });
  });

  it("should extract image attachment with MIME type from file extension", () => {
    const testCases = [
      { url: "https://example.com/image.jpg", expected: "image/jpeg" },
      { url: "https://example.com/image.jpeg", expected: "image/jpeg" },
      { url: "https://example.com/image.png", expected: "image/png" },
      { url: "https://example.com/image.gif", expected: "image/gif" },
      { url: "https://example.com/image.webp", expected: "image/webp" },
      { url: "https://example.com/image.svg", expected: "image/svg+xml" },
    ];

    for (const { url, expected } of testCases) {
      const content = [{ type: "image_url", image_url: { url } }];
      const attachments = getMessageAttachments(content);
      expect(attachments).toHaveLength(1);
      expect(attachments[0]).toMatchObject({
        kind: "image",
        type: expected,
        url,
        mimeType: expected,
      });
    }
  });

  it("should handle image URL without recognizable extension", () => {
    const content = [
      {
        type: "image_url",
        image_url: { url: "https://example.com/image" },
      },
    ];
    const attachments = getMessageAttachments(content);
    expect(attachments).toHaveLength(1);
    expect(attachments[0]).toMatchObject({
      kind: "image",
      type: undefined,
      url: "https://example.com/image",
      mimeType: undefined,
    });
  });

  it("should extract audio attachment with wav format", () => {
    const content = [
      {
        type: "input_audio",
        input_audio: { data: "base64data", format: "wav" },
      },
    ];
    const attachments = getMessageAttachments(content);
    expect(attachments).toHaveLength(1);
    expect(attachments[0]).toMatchObject({
      kind: "audio",
      type: "audio/wav",
      url: undefined,
      mimeType: "audio/wav",
    });
  });

  it("should extract audio attachment with mp3 format", () => {
    const content = [
      {
        type: "input_audio",
        input_audio: { data: "base64data", format: "mp3" },
      },
    ];
    const attachments = getMessageAttachments(content);
    expect(attachments).toHaveLength(1);
    expect(attachments[0]).toMatchObject({
      kind: "audio",
      type: "audio/mpeg",
      url: undefined,
      mimeType: "audio/mpeg",
    });
  });

  it("should extract audio attachment with unknown format", () => {
    const content = [
      {
        type: "input_audio",
        input_audio: { data: "base64data", format: "ogg" as any },
      },
    ];
    const attachments = getMessageAttachments(content);
    expect(attachments).toHaveLength(1);
    expect(attachments[0]).toMatchObject({
      kind: "audio",
      type: undefined,
      url: undefined,
      mimeType: undefined,
    });
  });

  it("should extract multiple attachments of different types", () => {
    const content = [
      {
        type: "image_url",
        image_url: { url: "data:image/png;base64,abc123" },
      },
      { type: "text", text: "Some text" },
      {
        type: "input_audio",
        input_audio: { data: "audiodata", format: "wav" },
      },
      {
        type: "image_url",
        image_url: { url: "https://example.com/photo.jpg" },
      },
    ];
    const attachments = getMessageAttachments(content);
    expect(attachments).toHaveLength(3);
    expect(attachments[0]).toMatchObject({
      kind: "image",
      mimeType: "image/png",
    });
    expect(attachments[1]).toMatchObject({
      kind: "audio",
      mimeType: "audio/wav",
    });
    expect(attachments[2]).toMatchObject({
      kind: "image",
      mimeType: "image/jpeg",
    });
  });

  it("should ignore non-attachment content parts", () => {
    const content = [
      { type: "text", text: "Hello" },
      {
        type: "image_url",
        image_url: { url: "https://example.com/image.png" },
      },
      { type: "text", text: "World" },
    ];
    const attachments = getMessageAttachments(content);
    expect(attachments).toHaveLength(1);
    expect(attachments[0].kind).toBe("image");
  });

  it("should include raw content part in attachment", () => {
    const rawPart = {
      type: "image_url" as const,
      image_url: { url: "https://example.com/image.png" },
    };
    const content = [rawPart];
    const attachments = getMessageAttachments(content);
    expect(attachments[0].raw).toBe(rawPart);
  });

  it("should handle image_url without url property", () => {
    const content = [{ type: "image_url", image_url: {} as any }];
    const attachments = getMessageAttachments(content);
    expect(attachments).toEqual([]);
  });

  it("should handle multiple images with same extension", () => {
    const content = [
      { type: "image_url", image_url: { url: "photo1.png" } },
      { type: "image_url", image_url: { url: "photo2.png" } },
      { type: "image_url", image_url: { url: "photo3.png" } },
    ];
    const attachments = getMessageAttachments(content);
    expect(attachments).toHaveLength(3);
    attachments.forEach((attachment) => {
      expect(attachment).toMatchObject({
        kind: "image",
        mimeType: "image/png",
      });
    });
  });

  it("should preserve order of attachments", () => {
    const content = [
      { type: "image_url", image_url: { url: "first.png" } },
      {
        type: "input_audio",
        input_audio: { data: "data", format: "wav" },
      },
      { type: "image_url", image_url: { url: "second.jpg" } },
    ];
    const attachments = getMessageAttachments(content);
    expect(attachments[0].kind).toBe("image");
    expect(attachments[0].url).toBe("first.png");
    expect(attachments[1].kind).toBe("audio");
    expect(attachments[2].kind).toBe("image");
    expect(attachments[2].url).toBe("second.jpg");
  });

  it("should handle case-insensitive file extensions", () => {
    const content = [
      { type: "image_url", image_url: { url: "photo.PNG" } },
      { type: "image_url", image_url: { url: "photo.JpG" } },
    ];
    const attachments = getMessageAttachments(content);
    expect(attachments).toHaveLength(2);
    expect(attachments[0].mimeType).toBe("image/png");
    expect(attachments[1].mimeType).toBe("image/jpeg");
  });

  it("should handle array with non-content-part items", () => {
    const content = [
      "string",
      42,
      { type: "image_url", image_url: { url: "test.png" } },
      { invalid: "object" },
    ];
    const attachments = getMessageAttachments(content);
    expect(attachments).toHaveLength(1);
    expect(attachments[0].url).toBe("test.png");
  });

  it("should correctly type TamboMessageAttachment interface", () => {
    const content = [
      {
        type: "image_url",
        image_url: { url: "data:image/png;base64,abc" },
      },
    ];
    const attachments: TamboMessageAttachment[] =
      getMessageAttachments(content);
    expect(attachments[0]).toHaveProperty("kind");
    expect(attachments[0]).toHaveProperty("type");
    expect(attachments[0]).toHaveProperty("url");
    expect(attachments[0]).toHaveProperty("mimeType");
    expect(attachments[0]).toHaveProperty("raw");
  });
});
