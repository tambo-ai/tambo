import type TamboAI from "@tambo-ai/typescript-sdk";
import { StagedImage } from "../hooks/use-message-images";
import { buildMessageContent } from "./message-builder";

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
    const result = buildMessageContent("Hello world", [], {});

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

    const result = buildMessageContent("", [image], {});

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

    const result = buildMessageContent("Check these images:", images, {});

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
    const result = buildMessageContent("  Hello world  ", [], {});

    expect(result).toEqual([
      {
        type: "text",
        text: "Hello world",
      },
    ]);
  });

  it("should skip empty text but keep images", () => {
    const image = createMockStagedImage();
    const result = buildMessageContent("   ", [image], {});

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

    const result = buildMessageContent("Multiple images:", images, {});

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
      buildMessageContent("", [], {});
    }).toThrow("Message must contain text or images");
  });

  it("should throw error when only whitespace provided", () => {
    expect(() => {
      buildMessageContent("   \n\t  ", [], {});
    }).toThrow("Message must contain text or images");
  });

  it("should return correct content type structure", () => {
    const image = createMockStagedImage();
    const result = buildMessageContent("Test", [image], {});

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
    const result = buildMessageContent("Just text", [], {});

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

    const result = buildMessageContent("Text content", images, {});

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

  describe("resource parsing", () => {
    it("should parse a single resource reference", () => {
      const result = buildMessageContent(
        "Check @tambo-1hfs429:tambo:test://static/resource/1",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "Check ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
      ]);
    });

    it("should parse resource reference at the start of text", () => {
      const result = buildMessageContent(
        "@tambo-1hfs429:tambo:test://static/resource/1 check this",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
        {
          type: "text",
          text: " check this",
        },
      ]);
    });

    it("should parse resource reference at the end of text", () => {
      const result = buildMessageContent(
        "Check this @tambo-1hfs429:tambo:test://static/resource/1",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "Check this ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
      ]);
    });

    it("should parse resource reference with name from resourceNames map", () => {
      const resourceNames = {
        "tambo-1hfs429:tambo:test://static/resource/1": "Documentation.pdf",
      };

      const result = buildMessageContent(
        "Check @tambo-1hfs429:tambo:test://static/resource/1",
        [],
        resourceNames,
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "Check ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
            name: "Documentation.pdf",
          },
        },
      ]);
    });

    it("should parse resource reference without name when not in resourceNames map", () => {
      const resourceNames = {
        "other-server:other-uri": "Other Resource",
      };

      const result = buildMessageContent(
        "Check @tambo-1hfs429:tambo:test://static/resource/1",
        [],
        resourceNames,
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "Check ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
      ]);
    });

    it("should parse multiple resource references", () => {
      const result = buildMessageContent(
        "Check @tambo-1hfs429:tambo:test://static/resource/1 and @tambo-1hfs429:tambo:test://static/resource/2",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "Check ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
        {
          type: "text",
          text: " and ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/2",
          },
        },
      ]);
    });

    it("should parse consecutive resource references with space separator (whitespace skipped)", () => {
      const result = buildMessageContent(
        "@tambo-1hfs429:tambo:test://static/resource/1 @tambo-1hfs429:tambo:test://static/resource/2",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/2",
          },
        },
      ]);
    });

    it("should parse resources with text before, between, and after", () => {
      const result = buildMessageContent(
        "Before @tambo-1hfs429:tambo:test://static/resource/1 middle @linear:file://path/to/file.txt after",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "Before ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
        {
          type: "text",
          text: " middle ",
        },
        {
          type: "resource",
          resource: {
            uri: "file://path/to/file.txt",
          },
        },
        {
          type: "text",
          text: " after",
        },
      ]);
    });

    it("should parse resources from different server keys", () => {
      const result = buildMessageContent(
        "@tambo-1hfs429:tambo:test://static/resource/1 and @linear:linear://issue/123",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
        {
          type: "text",
          text: " and ",
        },
        {
          type: "resource",
          resource: {
            uri: "linear://issue/123",
          },
        },
      ]);
    });

    it("should parse resources with various URI formats", () => {
      const result = buildMessageContent(
        "@server1:file:///path/to/file.txt @server2:https://example.com/doc.pdf @server3:s3://bucket/key.json",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "file:///path/to/file.txt",
          },
        },
        {
          type: "resource",
          resource: {
            uri: "https://example.com/doc.pdf",
          },
        },
        {
          type: "resource",
          resource: {
            uri: "s3://bucket/key.json",
          },
        },
      ]);
    });

    it("should parse resources with hyphens in server key", () => {
      const result = buildMessageContent(
        "@my-server-123:file:///path/to/file.txt",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "file:///path/to/file.txt",
          },
        },
      ]);
    });

    it("should parse resources with numbers in server key", () => {
      const result = buildMessageContent(
        "@server123:tambo:test://static/resource/1",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
      ]);
    });

    it("should preserve whitespace in text segments around resource references", () => {
      const result = buildMessageContent(
        "  Before  @tambo-1hfs429:tambo:test://static/resource/1  After  ",
        [],
        {},
      );

      // Input is trimmed, so leading/trailing whitespace removed, but internal whitespace preserved
      expect(result).toEqual([
        {
          type: "text",
          text: "Before  ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
        {
          type: "text",
          text: "  After",
        },
      ]);
    });

    it("should handle resource with only whitespace text segments", () => {
      const result = buildMessageContent(
        "   @tambo-1hfs429:tambo:test://static/resource/1   ",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
      ]);
    });

    it("should parse resource-only message without text", () => {
      const result = buildMessageContent(
        "@tambo-1hfs429:tambo:test://static/resource/1",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
      ]);
    });

    it("should parse multiple resources with names", () => {
      const resourceNames = {
        "tambo-1hfs429:tambo:test://static/resource/1": "First Resource",
        "tambo-1hfs429:tambo:test://static/resource/2": "Second Resource",
      };

      const result = buildMessageContent(
        "Check @tambo-1hfs429:tambo:test://static/resource/1 and @tambo-1hfs429:tambo:test://static/resource/2",
        [],
        resourceNames,
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "Check ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
            name: "First Resource",
          },
        },
        {
          type: "text",
          text: " and ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/2",
            name: "Second Resource",
          },
        },
      ]);
    });

    it("should parse resources mixed with images", () => {
      const images = [
        createMockStagedImage({
          id: "img1",
          dataUrl: "data:image/png;base64,abc123",
        }),
      ];

      const result = buildMessageContent(
        "Check @tambo-1hfs429:tambo:test://static/resource/1",
        images,
        {},
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "Check ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
        {
          type: "image_url",
          image_url: {
            url: "data:image/png;base64,abc123",
          },
        },
      ]);
    });

    it("should parse resources and images with proper ordering", () => {
      const images = [
        createMockStagedImage({
          id: "img1",
          dataUrl: "data:image/png;base64,img1",
        }),
        createMockStagedImage({
          id: "img2",
          dataUrl: "data:image/jpeg;base64,img2",
        }),
      ];

      const result = buildMessageContent(
        "Text @tambo-1hfs429:tambo:test://static/resource/1 more text",
        images,
        {},
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "Text ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
        {
          type: "text",
          text: " more text",
        },
        {
          type: "image_url",
          image_url: {
            url: "data:image/png;base64,img1",
          },
        },
        {
          type: "image_url",
          image_url: {
            url: "data:image/jpeg;base64,img2",
          },
        },
      ]);
    });

    it("should parse resource reference with URI containing colons", () => {
      const result = buildMessageContent(
        "@server:http://example.com:8080/path",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "http://example.com:8080/path",
          },
        },
      ]);
    });

    it("should parse resource reference with URI containing special characters", () => {
      const result = buildMessageContent(
        "@server:file:///path/to/file%20with%20spaces.txt",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "file:///path/to/file%20with%20spaces.txt",
          },
        },
      ]);
    });

    it("should not parse @ symbol without server key and colon", () => {
      const result = buildMessageContent(
        "Mention @user but not a resource",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "Mention @user but not a resource",
        },
      ]);
    });

    it("should not parse malformed resource reference missing colon", () => {
      const result = buildMessageContent(
        "@serverkey-missing-colon resource",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "@serverkey-missing-colon resource",
        },
      ]);
    });

    it("should not parse resource reference with space before colon", () => {
      const result = buildMessageContent("@server key :uri", [], {});

      expect(result).toEqual([
        {
          type: "text",
          text: "@server key :uri",
        },
      ]);
    });

    it("should skip whitespace-only text between consecutive resources", () => {
      const result = buildMessageContent(
        "@tambo-1hfs429:tambo:test://static/resource/1   @tambo-1hfs429:tambo:test://static/resource/2",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/2",
          },
        },
      ]);
    });

    it("should parse resource with only URI and no surrounding text", () => {
      const result = buildMessageContent(
        "@tambo-1hfs429:tambo:test://static/resource/1",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
      ]);
    });

    it("should throw error when only resources with empty text segments", () => {
      // This should work - resources alone should be valid
      const result = buildMessageContent(
        "@tambo-1hfs429:tambo:test://static/resource/1",
        [],
        {},
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].type).toBe("resource");
    });
  });
});
