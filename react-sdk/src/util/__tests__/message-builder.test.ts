import { buildMessageContent } from "../message-builder";
import { StagedImage } from "../../hooks/use-message-images";
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

  it("should preserve whitespace from text", () => {
    const result = buildMessageContent("  Hello world  ", []);

    expect(result).toEqual([
      {
        type: "text",
        text: "  Hello world  ",
      },
    ]);
  });

  it("should include whitespace-only text", () => {
    const image = createMockStagedImage();
    const result = buildMessageContent("   ", [image]);

    expect(result).toEqual([
      {
        type: "text",
        text: "   ",
      },
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

  it("should handle empty string with an error", () => {
    expect(() => {
      buildMessageContent("", []);
    }).toThrow("Message must contain text or images");
  });

  it("should handle whitespace-only string and include it", () => {
    const result = buildMessageContent("   \n\t  ", []);

    expect(result).toEqual([
      {
        type: "text",
        text: "   \n\t  ",
      },
    ]);
  });

  it("should return correct content type structure", () => {
    const image = createMockStagedImage();
    const result = buildMessageContent("Test", [image]);

    // Verify the structure matches ChatCompletionContentPart interface
    result.forEach((part: TamboAI.Beta.Threads.ChatCompletionContentPart) => {
      expect(part).toHaveProperty("type");
      expect(["text", "image_url", "input_audio", "resource"]).toContain(
        part.type,
      );

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

  it("should parse simple resource mentions with URI only", () => {
    const result = buildMessageContent(
      "Please update @my-spreadsheet://page2/cell4 with the new total",
      [],
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      type: "text",
      text: "Please update ",
    });
    expect(result[1]).toEqual({
      type: "resource",
      resource: {
        uri: "my-spreadsheet://page2/cell4",
      },
    });
    expect(result[2]).toEqual({
      type: "text",
      text: " with the new total",
    });
  });

  it("should parse resource mentions with server-key prefix", () => {
    const result = buildMessageContent(
      "Check @my-mcp:my-spreadsheet://page2/cell4 for the value",
      [],
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      type: "text",
      text: "Check ",
    });
    expect(result[1]).toEqual({
      type: "resource",
      resource: {
        uri: "my-mcp:my-spreadsheet://page2/cell4",
      },
    });
    expect(result[2]).toEqual({
      type: "text",
      text: " for the value",
    });
  });

  it("should handle multiple resource mentions in one message", () => {
    const result = buildMessageContent(
      "Copy data from @src://table1 to @dst://table2",
      [],
    );

    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({
      type: "text",
      text: "Copy data from ",
    });
    expect(result[1]).toEqual({
      type: "resource",
      resource: {
        uri: "src://table1",
      },
    });
    expect(result[2]).toEqual({
      type: "text",
      text: " to ",
    });
    expect(result[3]).toEqual({
      type: "resource",
      resource: {
        uri: "dst://table2",
      },
    });
  });

  it("should handle resource mentions with complex URIs", () => {
    const result = buildMessageContent(
      "Update @file://path/to/file.txt now",
      [],
    );

    expect(result).toHaveLength(3);
    expect(result[1]).toEqual({
      type: "resource",
      resource: {
        uri: "file://path/to/file.txt",
      },
    });
  });

  it("should handle resource mention at the start of message", () => {
    const result = buildMessageContent("@my-resource://data is important", []);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      type: "resource",
      resource: {
        uri: "my-resource://data",
      },
    });
    expect(result[1]).toEqual({
      type: "text",
      text: " is important",
    });
  });

  it("should handle resource mention at the end of message", () => {
    const result = buildMessageContent("Check this @my-resource://data", []);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      type: "text",
      text: "Check this ",
    });
    expect(result[1]).toEqual({
      type: "resource",
      resource: {
        uri: "my-resource://data",
      },
    });
  });

  it("should handle resource mention as entire message", () => {
    const result = buildMessageContent("@my-resource://data", []);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: "resource",
      resource: {
        uri: "my-resource://data",
      },
    });
  });

  it("should handle multiple consecutive mentions", () => {
    const result = buildMessageContent("@res1://a @res2://b @res3://c", []);

    expect(result).toHaveLength(5);
    expect(result[0].type).toBe("resource");
    expect(result[1].type).toBe("text");
    expect(result[2].type).toBe("resource");
    expect(result[3].type).toBe("text");
    expect(result[4].type).toBe("resource");
  });

  it("should not parse @ symbols without valid resource URIs", () => {
    const result = buildMessageContent("Email me at user@example.com", []);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: "text",
      text: "Email me at user@example.com",
    });
  });

  it("should combine resources with images", () => {
    const images = [
      createMockStagedImage({
        id: "img1",
        dataUrl: "data:image/png;base64,abc123",
      }),
    ];

    const result = buildMessageContent(
      "Update @spreadsheet://data with @image://chart",
      images,
    );

    expect(result).toHaveLength(5);
    expect(result[0].type).toBe("text");
    expect(result[1].type).toBe("resource");
    expect(result[2].type).toBe("text");
    expect(result[3].type).toBe("resource");
    expect(result[4].type).toBe("image_url");
  });

  it("should handle whitespace around resources correctly", () => {
    const result = buildMessageContent("Update  @res://data  with value", []);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      type: "text",
      text: "Update  ",
    });
    expect(result[1]).toEqual({
      type: "resource",
      resource: {
        uri: "res://data",
      },
    });
    expect(result[2]).toEqual({
      type: "text",
      text: "  with value",
    });
  });

  it("should handle resources with special URL characters", () => {
    const result = buildMessageContent(
      "Check @https://example.com/path?query=value&other=param",
      [],
    );

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      type: "resource",
      resource: {
        uri: "https://example.com/path?query=value&other=param",
      },
    });
  });

  it("should handle message with only resources and no other text", () => {
    const result = buildMessageContent("@res1://a @res2://b", []);

    expect(result).toHaveLength(3);
    expect(result[0].type).toBe("resource");
    expect(result[1].type).toBe("text");
    expect(result[2].type).toBe("resource");
  });

  it("should handle empty whitespace text parts gracefully", () => {
    const result = buildMessageContent("@resource://a", []);

    // Should only have the resource, no empty text part
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: "resource",
      resource: {
        uri: "resource://a",
      },
    });
  });

  describe("prefix stripping with knownPrefixes whitelist", () => {
    it("should strip a single known prefix from resource URI", () => {
      const result = buildMessageContent(
        "Check @linear:issue://123 for details",
        [],
        new Set(["linear"]),
      );

      expect(result).toHaveLength(3);
      expect(result[1]).toEqual({
        type: "resource",
        resource: {
          uri: "issue://123",
        },
      });
    });

    it("should strip prefix from multiple resources if they match known prefixes", () => {
      const result = buildMessageContent(
        "Copy from @linear:spreadsheet://data to @github:repo://path",
        [],
        new Set(["linear", "github"]),
      );

      expect(result).toHaveLength(4);
      expect(result[1]).toEqual({
        type: "resource",
        resource: {
          uri: "spreadsheet://data",
        },
      });
      expect(result[3]).toEqual({
        type: "resource",
        resource: {
          uri: "repo://path",
        },
      });
    });

    it("should not strip prefix if not in whitelist", () => {
      const result = buildMessageContent(
        "Check @unknown:resource://data",
        [],
        new Set(["linear"]),
      );

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "resource",
        resource: {
          uri: "unknown:resource://data",
        },
      });
    });

    it("should not strip prefix if whitelist is empty", () => {
      const result = buildMessageContent(
        "Check @linear:resource://data",
        [],
        new Set(),
      );

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "resource",
        resource: {
          uri: "linear:resource://data",
        },
      });
    });

    it("should not strip prefix if knownPrefixes is undefined", () => {
      const result = buildMessageContent(
        "Check @linear:resource://data",
        [],
        undefined,
      );

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "resource",
        resource: {
          uri: "linear:resource://data",
        },
      });
    });

    it("should handle mixed known and unknown prefixes", () => {
      const result = buildMessageContent(
        "Data from @linear:sheet://a and @slack:msg://b",
        [],
        new Set(["linear"]),
      );

      expect(result).toHaveLength(4);
      expect(result[1]).toEqual({
        type: "resource",
        resource: {
          uri: "sheet://a",
        },
      });
      expect(result[3]).toEqual({
        type: "resource",
        resource: {
          uri: "slack:msg://b",
        },
      });
    });

    it("should only strip the first matching prefix", () => {
      // Test with a URI that could have multiple colons
      const result = buildMessageContent(
        "Use @server:http://example.com",
        [],
        new Set(["server"]),
      );

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "resource",
        resource: {
          uri: "http://example.com",
        },
      });
    });

    it("should work with hyphens in prefix", () => {
      const result = buildMessageContent(
        "Check @my-server:data://123",
        [],
        new Set(["my-server"]),
      );

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "resource",
        resource: {
          uri: "data://123",
        },
      });
    });

    it("should combine prefix stripping with images", () => {
      const images = [
        {
          id: "img1",
          name: "test.png",
          dataUrl: "data:image/png;base64,abc123",
          file: new File([""], "test.png", { type: "image/png" }),
          size: 1024,
          type: "image/png",
        },
      ];

      const result = buildMessageContent(
        "Check @linear:doc://file",
        images,
        new Set(["linear"]),
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        type: "text",
        text: "Check ",
      });
      expect(result[1]).toEqual({
        type: "resource",
        resource: {
          uri: "doc://file",
        },
      });
      expect(result[2].type).toBe("image_url");
    });

    it("should strip prefix from resource at start of message", () => {
      const result = buildMessageContent(
        "@linear:issue://456 needs review",
        [],
        new Set(["linear"]),
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: "resource",
        resource: {
          uri: "issue://456",
        },
      });
    });

    it("should strip prefix from resource at end of message", () => {
      const result = buildMessageContent(
        "Review this @linear:issue://789",
        [],
        new Set(["linear"]),
      );

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "resource",
        resource: {
          uri: "issue://789",
        },
      });
    });
  });
});
