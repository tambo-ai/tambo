import { buildMessageContent } from "../message-builder";
import { StagedFile } from "../../hooks/use-message-files";
import type TamboAI from "@tambo-ai/typescript-sdk";

describe("buildMessageContent", () => {
  const createMockStagedImage = (
    overrides: Partial<StagedFile> = {},
  ): StagedFile => ({
    id: "test-id",
    name: "test-image.png",
    storagePath: "test-project/123-test-image.png",
    file: new File([""], "test-image.png", { type: "image/png" }),
    size: 1024,
    type: "image/png",
    contentType: "image",
    ...overrides,
  });
  const createMockStagedTextFile = (
    overrides: Partial<StagedFile> = {},
  ): StagedFile => ({
    id: "test-text-id",
    name: "test.txt",
    storagePath: "test-project/123-test.txt",
    file: new File(["Mock text content"], "test.txt", { type: "text/plain" }),
    size: 100,
    type: "text/plain",
    contentType: "text",
    ...overrides,
  });
  const createMockStagedPdf = (
    overrides: Partial<StagedFile> = {},
  ): StagedFile => ({
    id: "test-pdf-id",
    name: "test.pdf",
    storagePath: "test-project/123-test.pdf",
    file: new File(["PDF content"], "test.pdf", { type: "application/pdf" }),
    size: 500,
    type: "application/pdf",
    contentType: "text",
    ...overrides,
  });
  it("should build content with text only", () => {
    const result = buildMessageContent("Hello world", []);
    expect(result).toEqual([
      {
        type: "text",
        text: "Hello world",
      },
    ]);
  });
  it("should build content with images only", () => {
    const image = createMockStagedImage({
      storagePath: "test-project/123-image.png",
    });
    const result = buildMessageContent("", [image]);
    expect(result).toEqual([
      {
        type: "image_url",
        image_url: {
          url: "storage://test-project/123-image.png",
          detail: "auto",
        },
      },
    ]);
  });
  it("should build content with both text and images", () => {
    const images = [
      createMockStagedImage({
        id: "img1",
        storagePath: "test-project/img1.png",
      }),
      createMockStagedImage({
        id: "img2",
        storagePath: "test-project/img2.jpeg",
      }),
    ];
    const result = buildMessageContent("Check these images:", images);
    expect(result).toEqual([
      {
        type: "text",
        text: "Check these images:",
      },
      {
        type: "image_url",
        image_url: {
          url: "storage://test-project/img1.png",
          detail: "auto",
        },
      },
      {
        type: "image_url",
        image_url: {
          url: "storage://test-project/img2.jpeg",
          detail: "auto",
        },
      },
    ]);
  });
  it("should trim whitespace from text", () => {
    const result = buildMessageContent("  Hello world  ", []);
    expect(result).toEqual([
      {
        type: "text",
        text: "Hello world",
      },
    ]);
  });
  it("should skip empty text but keep images", () => {
    const image = createMockStagedImage();
    const result = buildMessageContent("   ", [image]);
    expect(result).toEqual([
      {
        type: "image_url",
        image_url: {
          url: "storage://test-project/123-test-image.png",
          detail: "auto",
        },
      },
    ]);
  });
  it("should handle multiple images correctly", () => {
    const images = [
      createMockStagedImage({
        id: "img1",
        name: "photo1.jpg",
        storagePath: "test-project/photo1.jpg",
      }),
      createMockStagedImage({
        id: "img2",
        name: "photo2.png",
        storagePath: "test-project/photo2.png",
      }),
      createMockStagedImage({
        id: "img3",
        name: "photo3.gif",
        storagePath: "test-project/photo3.gif",
      }),
    ];
    const result = buildMessageContent("Multiple images:", images);
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({
      type: "text",
      text: "Multiple images:",
    });
    expect(result[1]).toEqual({
      type: "image_url",
      image_url: {
        url: "storage://test-project/photo1.jpg",
        detail: "auto",
      },
    });
    expect(result[2]).toEqual({
      type: "image_url",
      image_url: {
        url: "storage://test-project/photo2.png",
        detail: "auto",
      },
    });
    expect(result[3]).toEqual({
      type: "image_url",
      image_url: {
        url: "storage://test-project/photo3.gif",
        detail: "auto",
      },
    });
  });
  it("should handle text files", () => {
    const textFile = createMockStagedTextFile();
    const result = buildMessageContent("", [textFile]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: "text",
      text: "storage://test-project/123-test.txt|text/plain|test.txt",
    });
  });
  it("should handle PDF files", () => {
    const pdfFile = createMockStagedPdf();
    const result = buildMessageContent("", [pdfFile]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: "text",
      text: "storage://test-project/123-test.pdf|application/pdf|test.pdf",
    });
  });
  it("should handle mixed file types", () => {
    const image = createMockStagedImage();
    const textFile = createMockStagedTextFile();
    const result = buildMessageContent("Check these files:", [image, textFile]);
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe("text");
    expect(result[0].text).toBe("Check these files:");
    expect(result[1].type).toBe("text");
    expect(result[1].text).toContain("storage://");
    expect(result[2].type).toBe("image_url");
  });
  it("should throw error when no content provided", () => {
    expect(() => {
      buildMessageContent("", []);
    }).toThrow("Message must contain text or files");
  });
  it("should throw error when only whitespace provided", () => {
    expect(() => {
      buildMessageContent("   \n\t  ", []);
    }).toThrow("Message must contain text or files");
  });
  it("should return correct content type structure", () => {
    const image = createMockStagedImage();
    const result = buildMessageContent("Test", [image]);
    result.forEach((part: TamboAI.Beta.Threads.ChatCompletionContentPart) => {
      expect(part).toHaveProperty("type");
      expect(["text", "image_url", "input_audio"]).toContain(part.type);
      if (part.type === "text") {
        expect(part).toHaveProperty("text");
        expect(typeof part.text).toBe("string");
      }
      if (part.type === "image_url") {
        expect(part).toHaveProperty("image_url");
        expect(part.image_url).toHaveProperty("url");
        expect(typeof part.image_url?.url).toBe("string");
      }
    });
  });
  it("should handle edge case with empty array but valid text", () => {
    const result = buildMessageContent("Just text", []);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: "text",
      text: "Just text",
    });
  });
  it("should maintain order of text first then images", () => {
    const images = [
      createMockStagedImage({
        id: "first",
        storagePath: "test-project/first.png",
      }),
      createMockStagedImage({
        id: "second",
        storagePath: "test-project/second.png",
      }),
    ];
    const result = buildMessageContent("Text content", images);
    expect(result[0].type).toBe("text");
    expect(result[1].type).toBe("image_url");
    expect(result[2].type).toBe("image_url");
    if (result[1].type === "image_url") {
      expect(result[1].image_url?.url).toBe("storage://test-project/first.png");
    }
    if (result[2].type === "image_url") {
      expect(result[2].image_url?.url).toBe(
        "storage://test-project/second.png",
      );
    }
  });
});
