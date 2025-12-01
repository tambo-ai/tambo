import { buildMessageContent } from "./message-builder";
import { StagedImage } from "../hooks/use-message-images";
import type TamboAI from "@tambo-ai/typescript-sdk";

describe("buildMessageContent", () => {
  const createMockStagedImage = (
    overrides: Partial<StagedImage> = {},
  ): StagedImage => ({
    id: "test-id",
    name: "test-image.png",
    dataUrl: "data:image/png;base64,mock-data",
    file: new File([""], "test-image.png", { type: "image/png" }),
    size: 1024,
    type: "image/png",
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
      dataUrl: "data:image/png;base64,abc123",
    });

    const result = buildMessageContent("", [image]);

    expect(result).toEqual([
      {
        type: "image_url",
        image_url: {
          url: "data:image/png;base64,abc123",
        },
      },
    ]);
  });

  it("should build content with both text and images", () => {
    const images = [
      createMockStagedImage({
        id: "img1",
        dataUrl: "data:image/png;base64,abc123",
      }),
      createMockStagedImage({
        id: "img2",
        dataUrl: "data:image/jpeg;base64,def456",
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
          url: "data:image/png;base64,abc123",
        },
      },
      {
        type: "image_url",
        image_url: {
          url: "data:image/jpeg;base64,def456",
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
          url: "data:image/png;base64,mock-data",
        },
      },
    ]);
  });

  it("should handle multiple images correctly", () => {
    const images = [
      createMockStagedImage({
        id: "img1",
        name: "photo1.jpg",
        dataUrl: "data:image/jpeg;base64,photo1data",
      }),
      createMockStagedImage({
        id: "img2",
        name: "photo2.png",
        dataUrl: "data:image/png;base64,photo2data",
      }),
      createMockStagedImage({
        id: "img3",
        name: "photo3.gif",
        dataUrl: "data:image/gif;base64,photo3data",
      }),
    ];

    const result = buildMessageContent("Multiple images:", images);

    expect(result).toHaveLength(4); // 1 text + 3 images
    expect(result[0]).toEqual({
      type: "text",
      text: "Multiple images:",
    });
    expect(result[1]).toEqual({
      type: "image_url",
      image_url: {
        url: "data:image/jpeg;base64,photo1data",
      },
    });
    expect(result[2]).toEqual({
      type: "image_url",
      image_url: {
        url: "data:image/png;base64,photo2data",
      },
    });
    expect(result[3]).toEqual({
      type: "image_url",
      image_url: {
        url: "data:image/gif;base64,photo3data",
      },
    });
  });

  it("should throw error when no content provided", () => {
    expect(() => {
      buildMessageContent("", []);
    }).toThrow("Message must contain text or images");
  });

  it("should throw error when only whitespace provided", () => {
    expect(() => {
      buildMessageContent("   \n\t  ", []);
    }).toThrow("Message must contain text or images");
  });

  it("should return correct content type structure", () => {
    const image = createMockStagedImage();
    const result = buildMessageContent("Test", [image]);

    // Verify the structure matches ChatCompletionContentPart interface
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
        dataUrl: "data:image/png;base64,first",
      }),
      createMockStagedImage({
        id: "second",
        dataUrl: "data:image/png;base64,second",
      }),
    ];

    const result = buildMessageContent("Text content", images);

    expect(result[0].type).toBe("text");
    expect(result[1].type).toBe("image_url");
    expect(result[2].type).toBe("image_url");

    if (result[1].type === "image_url") {
      expect(result[1].image_url?.url).toBe("data:image/png;base64,first");
    }
    if (result[2].type === "image_url") {
      expect(result[2].image_url?.url).toBe("data:image/png;base64,second");
    }
  });
});
