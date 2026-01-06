import type TamboAI from "@tambo-ai/typescript-sdk";
import { StagedAttachment } from "../hooks/use-message-attachments";
import { buildMessageContent } from "./message-builder";

describe("buildMessageContent", () => {
  const createMockStagedAttachment = (
    overrides: Partial<StagedAttachment> = {},
  ): StagedAttachment => ({
    id: "test-id",
    name: "test-image.png",
    file: new File([""], "test-image.png", { type: "image/png" }),
    size: 1024,
    mimeType: "image/png",
    status: "uploaded",
    storagePath: "project123/1699999999-test-image.png",
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

  it("should build content with attachments only", () => {
    const attachment = createMockStagedAttachment({
      storagePath: "project123/abc123-image.png",
    });

    const result = buildMessageContent("", [attachment], {});

    expect(result).toEqual([
      {
        type: "resource",
        resource: {
          uri: "attachment://project123/abc123-image.png",
          name: "test-image.png",
          mimeType: "image/png",
        },
      },
    ]);
  });

  it("should build content with both text and attachments", () => {
    const attachments = [
      createMockStagedAttachment({
        id: "img1",
        name: "photo1.png",
        storagePath: "project123/abc123-photo1.png",
      }),
      createMockStagedAttachment({
        id: "img2",
        name: "photo2.jpeg",
        mimeType: "image/jpeg",
        storagePath: "project123/def456-photo2.jpeg",
      }),
    ];

    const result = buildMessageContent(
      "Check these attachments:",
      attachments,
      {},
    );

    expect(result).toEqual([
      {
        type: "text",
        text: "Check these attachments:",
      },
      {
        type: "resource",
        resource: {
          uri: "attachment://project123/abc123-photo1.png",
          name: "photo1.png",
          mimeType: "image/png",
        },
      },
      {
        type: "resource",
        resource: {
          uri: "attachment://project123/def456-photo2.jpeg",
          name: "photo2.jpeg",
          mimeType: "image/jpeg",
        },
      },
    ]);
  });

  it("should preserve leading and trailing whitespace in text", () => {
    const result = buildMessageContent("  Hello world  ", [], {});

    expect(result).toEqual([
      {
        type: "text",
        text: "  Hello world  ",
      },
    ]);
  });

  it("should skip empty text but keep attachments", () => {
    const attachment = createMockStagedAttachment();
    const result = buildMessageContent("   ", [attachment], {});

    expect(result).toEqual([
      {
        type: "resource",
        resource: {
          uri: "attachment://project123/1699999999-test-image.png",
          name: "test-image.png",
          mimeType: "image/png",
        },
      },
    ]);
  });

  it("should handle multiple attachments correctly", () => {
    const attachments = [
      createMockStagedAttachment({
        id: "img1",
        name: "photo1.jpg",
        mimeType: "image/jpeg",
        storagePath: "project123/photo1.jpg",
      }),
      createMockStagedAttachment({
        id: "img2",
        name: "photo2.png",
        mimeType: "image/png",
        storagePath: "project123/photo2.png",
      }),
      createMockStagedAttachment({
        id: "img3",
        name: "photo3.gif",
        mimeType: "image/gif",
        storagePath: "project123/photo3.gif",
      }),
    ];

    const result = buildMessageContent(
      "Multiple attachments:",
      attachments,
      {},
    );

    expect(result).toHaveLength(4); // 1 text + 3 attachments
    expect(result[0]).toEqual({
      type: "text",
      text: "Multiple attachments:",
    });
    expect(result[1]).toEqual({
      type: "resource",
      resource: {
        uri: "attachment://project123/photo1.jpg",
        name: "photo1.jpg",
        mimeType: "image/jpeg",
      },
    });
    expect(result[2]).toEqual({
      type: "resource",
      resource: {
        uri: "attachment://project123/photo2.png",
        name: "photo2.png",
        mimeType: "image/png",
      },
    });
    expect(result[3]).toEqual({
      type: "resource",
      resource: {
        uri: "attachment://project123/photo3.gif",
        name: "photo3.gif",
        mimeType: "image/gif",
      },
    });
  });

  it("should throw error when no content provided", () => {
    expect(() => {
      buildMessageContent("", [], {});
    }).toThrow("Message must contain text or attachments");
  });

  it("should throw error when only whitespace provided", () => {
    expect(() => {
      buildMessageContent("   \n\t  ", [], {});
    }).toThrow("Message must contain text or attachments");
  });

  it("should return correct content type structure", () => {
    const attachment = createMockStagedAttachment();
    const result = buildMessageContent("Test", [attachment], {});

    // Verify the structure matches ChatCompletionContentPart interface
    result.forEach((part: TamboAI.Beta.Threads.ChatCompletionContentPart) => {
      expect(part).toHaveProperty("type");
      expect(["text", "resource", "image_url", "input_audio"]).toContain(
        part.type,
      );

      if (part.type === "text") {
        expect(part).toHaveProperty("text");
        expect(typeof part.text).toBe("string");
      }

      if (part.type === "resource") {
        expect(part).toHaveProperty("resource");
        expect(part.resource).toHaveProperty("uri");
        expect(typeof part.resource?.uri).toBe("string");
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

  it("should maintain order of text first then attachments", () => {
    const attachments = [
      createMockStagedAttachment({
        id: "first",
        name: "first.png",
        storagePath: "project123/first.png",
      }),
      createMockStagedAttachment({
        id: "second",
        name: "second.png",
        storagePath: "project123/second.png",
      }),
    ];

    const result = buildMessageContent("Text content", attachments, {});

    expect(result[0].type).toBe("text");
    expect(result[1].type).toBe("resource");
    expect(result[2].type).toBe("resource");

    if (result[1].type === "resource") {
      expect(result[1].resource?.uri).toBe("attachment://project123/first.png");
    }
    if (result[2].type === "resource") {
      expect(result[2].resource?.uri).toBe(
        "attachment://project123/second.png",
      );
    }
  });

  it("should only include uploaded attachments, not pending or error attachments", () => {
    const attachments = [
      createMockStagedAttachment({
        id: "uploaded",
        name: "uploaded.png",
        status: "uploaded",
        storagePath: "project123/uploaded.png",
      }),
      createMockStagedAttachment({
        id: "pending",
        name: "pending.png",
        status: "pending",
        storagePath: undefined,
      }),
      createMockStagedAttachment({
        id: "error",
        name: "error.png",
        status: "error",
        error: "Upload failed",
      }),
    ];

    const result = buildMessageContent("Text content", attachments, {});

    expect(result).toHaveLength(2); // 1 text + 1 uploaded attachment
    expect(result[1]).toEqual({
      type: "resource",
      resource: {
        uri: "attachment://project123/uploaded.png",
        name: "uploaded.png",
        mimeType: "image/png",
      },
    });
  });

  describe("dataUrl fallback (local mode)", () => {
    it("should include attachments with dataUrl when storagePath is not available", () => {
      const attachment = createMockStagedAttachment({
        id: "local-img-123",
        name: "local-image.png",
        storagePath: undefined,
        dataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==",
      });

      const result = buildMessageContent("Check this image:", [attachment], {});

      expect(result).toHaveLength(2); // 1 text + 1 attachment
      expect(result[1]).toEqual({
        type: "resource",
        resource: {
          uri: "local://local-img-123",
          name: "local-image.png",
          mimeType: "image/png",
          blob: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==",
        },
      });
    });

    it("should prefer storagePath over dataUrl when both are present", () => {
      const attachment = createMockStagedAttachment({
        id: "img-123",
        name: "image.png",
        storagePath: "project123/abc123-image.png",
        dataUrl: "data:image/png;base64,somebase64data",
      });

      const result = buildMessageContent("", [attachment], {});

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "resource",
        resource: {
          uri: "attachment://project123/abc123-image.png",
          name: "image.png",
          mimeType: "image/png",
        },
      });
    });

    it("should handle mix of storagePath and dataUrl attachments", () => {
      const attachments = [
        createMockStagedAttachment({
          id: "cloud-img",
          name: "cloud.png",
          storagePath: "project123/cloud.png",
        }),
        createMockStagedAttachment({
          id: "local-img",
          name: "local.png",
          storagePath: undefined,
          dataUrl: "data:image/png;base64,localdata123",
        }),
      ];

      const result = buildMessageContent("Attachments:", attachments, {});

      expect(result).toHaveLength(3); // 1 text + 2 attachments
      expect(result[1]).toEqual({
        type: "resource",
        resource: {
          uri: "attachment://project123/cloud.png",
          name: "cloud.png",
          mimeType: "image/png",
        },
      });
      expect(result[2]).toEqual({
        type: "resource",
        resource: {
          uri: "local://local-img",
          name: "local.png",
          mimeType: "image/png",
          blob: "localdata123",
        },
      });
    });

    it("should exclude attachments with neither storagePath nor dataUrl", () => {
      const attachments = [
        createMockStagedAttachment({
          id: "complete",
          name: "complete.png",
          storagePath: undefined,
          dataUrl: "data:image/png;base64,completedata",
        }),
        createMockStagedAttachment({
          id: "incomplete",
          name: "incomplete.png",
          storagePath: undefined,
          dataUrl: undefined,
        }),
      ];

      const result = buildMessageContent("Check:", attachments, {});

      expect(result).toHaveLength(2); // 1 text + 1 attachment (incomplete excluded)
      expect(result[1]).toEqual({
        type: "resource",
        resource: {
          uri: "local://complete",
          name: "complete.png",
          mimeType: "image/png",
          blob: "completedata",
        },
      });
    });

    it("should handle JPEG dataUrl correctly", () => {
      const attachment = createMockStagedAttachment({
        id: "jpeg-img",
        name: "photo.jpg",
        mimeType: "image/jpeg",
        storagePath: undefined,
        dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD",
      });

      const result = buildMessageContent("", [attachment], {});

      expect(result[0]).toEqual({
        type: "resource",
        resource: {
          uri: "local://jpeg-img",
          name: "photo.jpg",
          mimeType: "image/jpeg",
          blob: "/9j/4AAQSkZJRgABAQEASABIAAD",
        },
      });
    });

    it("should handle dataUrl with charset parameter (text attachments)", () => {
      const attachment = createMockStagedAttachment({
        id: "text-file",
        name: "document.txt",
        mimeType: "text/plain",
        storagePath: undefined,
        dataUrl: "data:text/plain;charset=utf-8;base64,SGVsbG8gV29ybGQh",
      });

      const result = buildMessageContent("", [attachment], {});

      expect(result[0]).toEqual({
        type: "resource",
        resource: {
          uri: "local://text-file",
          name: "document.txt",
          mimeType: "text/plain",
          blob: "SGVsbG8gV29ybGQh",
        },
      });
    });

    it("should handle dataUrl with multiple parameters before base64", () => {
      const attachment = createMockStagedAttachment({
        id: "json-file",
        name: "data.json",
        mimeType: "application/json",
        storagePath: undefined,
        dataUrl:
          "data:application/json;charset=utf-8;base64,eyJrZXkiOiJ2YWx1ZSJ9",
      });

      const result = buildMessageContent("", [attachment], {});

      expect(result[0]).toEqual({
        type: "resource",
        resource: {
          uri: "local://json-file",
          name: "data.json",
          mimeType: "application/json",
          blob: "eyJrZXkiOiJ2YWx1ZSJ9",
        },
      });
    });

    it("should skip attachments with invalid dataUrl format", () => {
      // Spy on console.warn to verify warning is logged
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();

      const attachment = createMockStagedAttachment({
        id: "invalid-img",
        name: "invalid.png",
        storagePath: undefined,
        dataUrl: "not-a-valid-dataurl",
      });

      // Should throw because no valid content is present
      expect(() => buildMessageContent("", [attachment], {})).toThrow(
        "Message must contain text or attachments",
      );

      expect(warnSpy).toHaveBeenCalledWith(
        'Unable to parse dataUrl for attachment "invalid.png", skipping from message',
      );

      warnSpy.mockRestore();
    });

    it("should include valid attachments but skip invalid ones in mixed array", () => {
      // Spy on console.warn to verify warning is logged
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();

      const attachments = [
        createMockStagedAttachment({
          id: "valid-img",
          name: "valid.png",
          storagePath: undefined,
          dataUrl: "data:image/png;base64,validbase64data",
        }),
        createMockStagedAttachment({
          id: "invalid-img",
          name: "invalid.png",
          storagePath: undefined,
          dataUrl: "not-a-valid-dataurl",
        }),
      ];

      const result = buildMessageContent("", attachments, {});

      // Only valid attachment should be included
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "resource",
        resource: {
          uri: "local://valid-img",
          name: "valid.png",
          mimeType: "image/png",
          blob: "validbase64data",
        },
      });

      expect(warnSpy).toHaveBeenCalledWith(
        'Unable to parse dataUrl for attachment "invalid.png", skipping from message',
      );

      warnSpy.mockRestore();
    });
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

    it("should preserve whitespace between consecutive resource references", () => {
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
          type: "text",
          text: " ",
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

    it("should parse resources with various URI formats and preserve whitespace", () => {
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
          type: "text",
          text: " ",
        },
        {
          type: "resource",
          resource: {
            uri: "https://example.com/doc.pdf",
          },
        },
        {
          type: "text",
          text: " ",
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
      expect(result).toEqual([
        {
          type: "text",
          text: "  Before  ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
        {
          type: "text",
          text: "  After  ",
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
          type: "text",
          text: "   ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
        {
          type: "text",
          text: "   ",
        },
      ]);
    });

    it("should preserve newlines and spaces around resource references", () => {
      const result = buildMessageContent(
        "\n  @tambo-1hfs429:tambo:test://static/resource/1  text",
        [],
        {},
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "\n  ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo:test://static/resource/1",
          },
        },
        {
          type: "text",
          text: "  text",
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

    it("should parse MCP resources mixed with attachment resources", () => {
      const attachments = [
        createMockStagedAttachment({
          id: "img1",
          name: "image.png",
          storagePath: "project123/abc123-image.png",
        }),
      ];

      const result = buildMessageContent(
        "Check @tambo-1hfs429:tambo:test://static/resource/1",
        attachments,
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
          type: "resource",
          resource: {
            uri: "attachment://project123/abc123-image.png",
            name: "image.png",
            mimeType: "image/png",
          },
        },
      ]);
    });

    it("should parse MCP resources and attachment resources with proper ordering", () => {
      const attachments = [
        createMockStagedAttachment({
          id: "img1",
          name: "image1.png",
          storagePath: "project123/img1.png",
        }),
        createMockStagedAttachment({
          id: "img2",
          name: "image2.jpeg",
          mimeType: "image/jpeg",
          storagePath: "project123/img2.jpeg",
        }),
      ];

      const result = buildMessageContent(
        "Text @tambo-1hfs429:tambo:test://static/resource/1 more text",
        attachments,
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
          type: "resource",
          resource: {
            uri: "attachment://project123/img1.png",
            name: "image1.png",
            mimeType: "image/png",
          },
        },
        {
          type: "resource",
          resource: {
            uri: "attachment://project123/img2.jpeg",
            name: "image2.jpeg",
            mimeType: "image/jpeg",
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

    it("should preserve multiple whitespace characters between consecutive resources", () => {
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
          type: "text",
          text: "   ",
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

  describe("resource content resolution", () => {
    it("should include text content from resolved resource", () => {
      const resourceContent = new Map([
        [
          "registry:file:///doc.txt",
          {
            contents: [
              {
                uri: "file:///doc.txt",
                mimeType: "text/plain",
                text: "This is the document content",
              },
            ],
          },
        ],
      ]);

      const result = buildMessageContent(
        "Check @registry:file:///doc.txt",
        [],
        {},
        resourceContent,
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "Check ",
        },
        {
          type: "resource",
          resource: {
            uri: "file:///doc.txt",
            text: "This is the document content",
            mimeType: "text/plain",
          },
        },
      ]);
    });

    it("should include blob content from resolved resource", () => {
      const resourceContent = new Map([
        [
          "registry:file:///image.png",
          {
            contents: [
              {
                uri: "file:///image.png",
                mimeType: "image/png",
                blob: "base64encodeddata",
              },
            ],
          },
        ],
      ]);

      const result = buildMessageContent(
        "Check @registry:file:///image.png",
        [],
        {},
        resourceContent,
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "Check ",
        },
        {
          type: "resource",
          resource: {
            uri: "file:///image.png",
            blob: "base64encodeddata",
            mimeType: "image/png",
          },
        },
      ]);
    });

    it("should include name and resolved content together", () => {
      const resourceNames = {
        "registry:file:///doc.txt": "Important Document",
      };
      const resourceContent = new Map([
        [
          "registry:file:///doc.txt",
          {
            contents: [
              {
                uri: "file:///doc.txt",
                mimeType: "text/plain",
                text: "Document content here",
              },
            ],
          },
        ],
      ]);

      const result = buildMessageContent(
        "@registry:file:///doc.txt",
        [],
        resourceNames,
        resourceContent,
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "file:///doc.txt",
            name: "Important Document",
            text: "Document content here",
            mimeType: "text/plain",
          },
        },
      ]);
    });

    it("should handle multiple resources with mixed resolved content", () => {
      const resourceContent = new Map([
        [
          "registry:file:///doc1.txt",
          {
            contents: [
              {
                uri: "file:///doc1.txt",
                text: "First doc content",
              },
            ],
          },
        ],
        // doc2 is NOT in resourceContent - simulates internal server resource
      ]);

      const result = buildMessageContent(
        "@registry:file:///doc1.txt and @tambo-abc:tambo://doc2",
        [],
        {},
        resourceContent,
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "file:///doc1.txt",
            text: "First doc content",
          },
        },
        {
          type: "text",
          text: " and ",
        },
        {
          type: "resource",
          resource: {
            uri: "tambo://doc2",
            // No text/blob - internal server resource
          },
        },
      ]);
    });

    it("should handle resolved content without mimeType", () => {
      const resourceContent = new Map([
        [
          "server:file:///doc.txt",
          {
            contents: [
              {
                uri: "file:///doc.txt",
                text: "Content without mimeType",
              },
            ],
          },
        ],
      ]);

      const result = buildMessageContent(
        "@server:file:///doc.txt",
        [],
        {},
        resourceContent,
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "file:///doc.txt",
            text: "Content without mimeType",
          },
        },
      ]);
    });

    it("should handle empty resourceContent map gracefully", () => {
      const result = buildMessageContent(
        "@registry:file:///doc.txt",
        [],
        {},
        new Map(),
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "file:///doc.txt",
          },
        },
      ]);
    });

    it("should handle undefined resourceContent gracefully", () => {
      const result = buildMessageContent(
        "@registry:file:///doc.txt",
        [],
        {},
        undefined,
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "file:///doc.txt",
          },
        },
      ]);
    });

    it("should handle resolved content with empty contents array", () => {
      const resourceContent = new Map([
        [
          "registry:file:///doc.txt",
          {
            contents: [],
          },
        ],
      ]);

      const result = buildMessageContent(
        "@registry:file:///doc.txt",
        [],
        {},
        resourceContent,
      );

      expect(result).toEqual([
        {
          type: "resource",
          resource: {
            uri: "file:///doc.txt",
          },
        },
      ]);
    });

    it("should include resolved content with MCP server resources", () => {
      const resourceContent = new Map([
        [
          "linear:linear://issue/123",
          {
            contents: [
              {
                uri: "linear://issue/123",
                mimeType: "application/json",
                text: '{"title": "Bug fix", "status": "open"}',
              },
            ],
          },
        ],
      ]);

      const result = buildMessageContent(
        "Check issue @linear:linear://issue/123",
        [],
        {},
        resourceContent,
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "Check issue ",
        },
        {
          type: "resource",
          resource: {
            uri: "linear://issue/123",
            text: '{"title": "Bug fix", "status": "open"}',
            mimeType: "application/json",
          },
        },
      ]);
    });

    it("should combine resolved content with attachment resources", () => {
      const resourceContent = new Map([
        [
          "registry:file:///doc.txt",
          {
            contents: [
              {
                uri: "file:///doc.txt",
                text: "Document content",
              },
            ],
          },
        ],
      ]);

      const attachments = [
        createMockStagedAttachment({
          name: "image.png",
          storagePath: "project123/imagedata.png",
        }),
      ];

      const result = buildMessageContent(
        "Check @registry:file:///doc.txt",
        attachments,
        {},
        resourceContent,
      );

      expect(result).toEqual([
        {
          type: "text",
          text: "Check ",
        },
        {
          type: "resource",
          resource: {
            uri: "file:///doc.txt",
            text: "Document content",
          },
        },
        {
          type: "resource",
          resource: {
            uri: "attachment://project123/imagedata.png",
            name: "image.png",
            mimeType: "image/png",
          },
        },
      ]);
    });
  });
});
