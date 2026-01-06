import {
  ContentPartType,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";

import { limitTokens } from "./token-limiter";

function createMessage(
  role: MessageRole,
  content: ThreadMessage["content"],
  overrides: Partial<ThreadMessage> = {},
): ThreadMessage {
  return {
    id: `msg-${Math.random().toString(36).slice(2)}`,
    threadId: "thread-1",
    role,
    content,
    createdAt: new Date(),
    ...overrides,
  } as ThreadMessage;
}

describe("limitTokens", () => {
  it("returns messages unchanged when under token limit", () => {
    const messages = [
      createMessage(MessageRole.User, [{ type: "text", text: "Hello" }]),
      createMessage(MessageRole.Assistant, [
        { type: "text", text: "Hi there" },
      ]),
    ];

    const result = limitTokens(messages, 1000);

    expect(result).toEqual(messages);
  });

  it("truncates messages when over token limit, keeping newest", () => {
    const messages = [
      createMessage(MessageRole.User, [
        { type: "text", text: "First message with some content" },
      ]),
      createMessage(MessageRole.User, [
        { type: "text", text: "Second message with some content" },
      ]),
      createMessage(MessageRole.User, [
        { type: "text", text: "Third message with some content" },
      ]),
    ];

    // Use a limit that allows only 1-2 messages
    const result = limitTokens(messages, 100);

    // Should keep only the newest messages that fit
    expect(result.length).toBeLessThan(messages.length);
    expect(result.length).toBeGreaterThan(0);
    // Should include the last message (newest)
    expect(result[result.length - 1]).toEqual(messages[messages.length - 1]);
  });

  it("keeps system message when truncating", () => {
    const systemMessage = createMessage(MessageRole.System, [
      { type: "text", text: "You are a helpful assistant" },
    ]);
    const messages = [
      systemMessage,
      createMessage(MessageRole.User, [
        { type: "text", text: "First message" },
      ]),
      createMessage(MessageRole.User, [
        { type: "text", text: "Second message" },
      ]),
      createMessage(MessageRole.User, [
        { type: "text", text: "Third message" },
      ]),
    ];

    const result = limitTokens(messages, 100);

    // System message should always be first
    expect(result[0]).toEqual(systemMessage);
  });

  describe("blob stripping for token counting", () => {
    it("does not count base64 blob data as tokens", () => {
      // Create a large base64 blob (simulating ~100KB image)
      const largeBlob = "a".repeat(100000);

      const messagesWithBlob = [
        createMessage(MessageRole.User, [
          {
            type: ContentPartType.Resource,
            resource: {
              uri: "file:///image.png",
              mimeType: "image/png",
              blob: largeBlob,
            },
          },
        ]),
      ];

      const messagesWithoutBlob = [
        createMessage(MessageRole.User, [
          {
            type: ContentPartType.Resource,
            resource: {
              uri: "file:///image.png",
              mimeType: "image/png",
            },
          },
        ]),
      ];

      // With the fix, both should have similar token counts
      // because the blob is stripped before counting
      // A 100KB blob would be ~100K+ tokens if counted as text
      // With a 1000 token limit, the message with blob should still pass
      const resultWithBlob = limitTokens(messagesWithBlob, 1000);
      const resultWithoutBlob = limitTokens(messagesWithoutBlob, 1000);

      // Both should return the messages unchanged (not truncated)
      expect(resultWithBlob).toEqual(messagesWithBlob);
      expect(resultWithoutBlob).toEqual(messagesWithoutBlob);
    });

    it("does not count data URL images as tokens", () => {
      // Create a large data URL
      const largeDataUrl = `data:image/png;base64,${"a".repeat(100000)}`;

      const messagesWithDataUrl = [
        createMessage(MessageRole.User, [
          {
            type: "image_url",
            image_url: {
              url: largeDataUrl,
            },
          },
        ]),
      ];

      // Should not be truncated despite the large data URL
      const result = limitTokens(messagesWithDataUrl, 1000);
      expect(result).toEqual(messagesWithDataUrl);
    });

    it("preserves non-data-URL images in token count", () => {
      const messagesWithUrl = [
        createMessage(MessageRole.User, [
          {
            type: "image_url",
            image_url: {
              url: "https://example.com/image.png",
            },
          },
        ]),
      ];

      const result = limitTokens(messagesWithUrl, 1000);
      expect(result).toEqual(messagesWithUrl);
    });

    it("handles mixed content with blobs and text", () => {
      const largeBlob = "a".repeat(50000);

      const messages = [
        createMessage(MessageRole.User, [
          { type: "text", text: "Here is an image:" },
          {
            type: ContentPartType.Resource,
            resource: {
              uri: "file:///image.png",
              mimeType: "image/png",
              blob: largeBlob,
            },
          },
        ]),
        createMessage(MessageRole.Assistant, [
          { type: "text", text: "I can see the image." },
        ]),
      ];

      // Should not be truncated because blobs are not counted
      const result = limitTokens(messages, 1000);
      expect(result).toEqual(messages);
    });

    it("correctly truncates when text content exceeds limit", () => {
      // Create messages with a lot of actual text (not blobs)
      const longText = "word ".repeat(10000);

      const messages = [
        createMessage(MessageRole.User, [{ type: "text", text: longText }]),
        createMessage(MessageRole.Assistant, [
          { type: "text", text: "Short response" },
        ]),
      ];

      // With a small limit, should truncate
      const result = limitTokens(messages, 100);

      expect(result.length).toBeLessThan(messages.length);
    });
  });
});
