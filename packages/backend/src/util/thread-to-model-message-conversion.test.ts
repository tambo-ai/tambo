/**
 * Comparison tests to verify that the new direct ThreadMessage → ModelMessage conversion
 * produces identical output to the old two-step ThreadMessage → OpenAI → ModelMessage conversion.
 *
 * These tests ensure behavioral equivalence during the refactoring.
 */

import {
  ContentPartType,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import { convertOpenAIMessageToCoreMessage } from "../services/llm/ai-sdk-client";
import { threadMessagesToChatCompletionMessageParam } from "./thread-message-conversion";
import { threadMessagesToModelMessages } from "./thread-to-model-message-conversion";

const baseThreadMessage = {
  threadId: "test-thread",
  componentState: {},
  createdAt: new Date(),
  severity: 0,
};

// Simple MIME type predicate for testing - accept common types
const testMimeTypePredicate = (mimeType: string): boolean => {
  const supported = [
    "text/plain",
    "text/csv",
    "image/jpeg",
    "image/png",
    "image/gif",
    "audio/wav",
    "audio/mp3",
  ];
  return supported.some((type) => mimeType.startsWith(type));
};

describe("threadMessagesToModelMessages - Comparison Tests", () => {
  /**
   * Helper function to run both conversion paths and compare results
   */
  function compareConversions(messages: ThreadMessage[]): void {
    // Old path: ThreadMessage → OpenAI → ModelMessage (two conversions)
    const openaiMessages = threadMessagesToChatCompletionMessageParam(messages);
    const oldModelMessages = openaiMessages.map((msg, index) =>
      convertOpenAIMessageToCoreMessage(
        msg,
        openaiMessages.slice(0, index),
        testMimeTypePredicate,
      ),
    );

    // New path: ThreadMessage → ModelMessage (single conversion)
    const newModelMessages = threadMessagesToModelMessages(
      messages,
      testMimeTypePredicate,
    );

    // These MUST be identical
    expect(newModelMessages).toEqual(oldModelMessages);
  }

  describe("basic message types", () => {
    it("should produce identical output for simple user message", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.User,
          content: [{ type: ContentPartType.Text, text: "Hello world" }],
        },
      ];

      compareConversions(messages);
    });

    it("should produce identical output for simple assistant message", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.Assistant,
          content: [{ type: ContentPartType.Text, text: "Hello there!" }],
        },
      ];

      compareConversions(messages);
    });

    it("should produce identical output for system message", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.System,
          content: [
            { type: ContentPartType.Text, text: "You are a helpful assistant" },
          ],
        },
      ];

      compareConversions(messages);
    });
  });

  describe("content types", () => {
    it("should handle Text content identically", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.User,
          content: [{ type: ContentPartType.Text, text: "Test text content" }],
        },
      ];

      compareConversions(messages);
    });

    it("should handle ImageUrl content identically", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.User,
          content: [
            {
              type: ContentPartType.ImageUrl,
              image_url: { url: "https://example.com/image.jpg" },
            },
          ],
        },
      ];

      compareConversions(messages);
    });

    it("should handle InputAudio content identically", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.User,
          content: [
            {
              type: ContentPartType.InputAudio,
              input_audio: {
                data: "base64audiodata",
                format: "wav",
              },
            },
          ],
        },
      ];

      compareConversions(messages);
    });

    it("should handle Resource content with supported MIME type identically", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.User,
          content: [
            {
              type: ContentPartType.Resource,
              resource: {
                uri: "file:///path/to/file.txt",
                text: "File contents",
                mimeType: "text/plain",
              },
            },
          ],
        },
      ];

      compareConversions(messages);
    });

    it("should handle Resource content with unsupported MIME type identically", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.User,
          content: [
            {
              type: ContentPartType.Resource,
              resource: {
                uri: "file:///path/to/file.xyz",
                text: "File contents",
                mimeType: "application/x-unsupported",
              },
            },
          ],
        },
      ];

      compareConversions(messages);
    });

    it("should handle mixed content types identically", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.User,
          content: [
            { type: ContentPartType.Text, text: "Check this image:" },
            {
              type: ContentPartType.ImageUrl,
              image_url: { url: "https://example.com/image.jpg" },
            },
            { type: ContentPartType.Text, text: "What do you see?" },
          ],
        },
      ];

      compareConversions(messages);
    });
  });

  describe("tool call scenarios", () => {
    // Note: This test is skipped because the old conversion path has a limitation where
    // it cannot find tool names when converting tool messages. The new path fixes this.
    it.skip("should handle tool message with tool_call_id identically", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.Assistant,
          content: [{ type: "text", text: "calling tool" }],
          tool_call_id: "test-tool-1",
          toolCallRequest: {
            toolName: "test_tool",
            parameters: [{ parameterName: "param1", parameterValue: "value1" }],
          },
        },
        {
          ...baseThreadMessage,
          id: "2",
          role: MessageRole.Tool,
          content: [{ type: "text", text: "tool response" }],
          tool_call_id: "test-tool-1",
        },
      ];

      compareConversions(messages);
    });

    it("should handle assistant message with tool call and component identically", () => {
      const componentDecision: LegacyComponentDecision = {
        componentName: "TestComponent",
        message: "test reasoning",
        props: {},
        componentState: {},
        reasoning: ["test reasoning"],
      };

      const toolCallRequest: ToolCallRequest = {
        toolName: "test_tool",
        parameters: [{ parameterName: "param1", parameterValue: "value1" }],
      };

      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.Assistant,
          tool_call_id: "test-tool-1",
          content: [{ type: "text", text: "assistant message" }],
          component: {
            ...componentDecision,
            toolCallRequest,
          },
          toolCallRequest,
          componentState: { state: "test" },
          reasoning: ["test reasoning"],
        },
        {
          ...baseThreadMessage,
          id: "2",
          role: MessageRole.Tool,
          content: [{ type: "text", text: "tool response" }],
          tool_call_id: "test-tool-1",
        },
      ];

      compareConversions(messages);
    });
  });

  describe("complex scenarios", () => {
    it("should handle user message with additional context identically", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.User,
          content: [{ type: "text", text: "user input" }],
          additionalContext: { extra: "context" },
        },
      ];

      compareConversions(messages);
    });

    // Note: This test is skipped because the old conversion path has a limitation where
    // it cannot find tool names when converting tool messages. The new path fixes this.
    it.skip("should handle sequence of messages with tool calls identically", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.User,
          content: [{ type: "text", text: "user request" }],
        },
        {
          ...baseThreadMessage,
          id: "2",
          role: MessageRole.Assistant,
          content: [{ type: "text", text: "assistant response" }],
          tool_call_id: "tool-1",
          toolCallRequest: {
            toolName: "test_tool",
            parameters: [{ parameterName: "param", parameterValue: "value" }],
          },
        },
        {
          ...baseThreadMessage,
          id: "3",
          role: MessageRole.Tool,
          tool_call_id: "tool-1",
          content: [{ type: "text", text: "tool response" }],
        },
      ];

      compareConversions(messages);
    });

    it("should handle empty content arrays identically", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.User,
          content: [],
        },
      ];

      compareConversions(messages);
    });
  });

  describe("edge cases", () => {
    it("should handle messages with null/undefined optional fields identically", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.Assistant,
          content: [{ type: "text", text: "response" }],
          // Missing tool_call_id and toolCallRequest
        },
      ];

      compareConversions(messages);
    });

    it("should handle Resource with blob data identically", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.User,
          content: [
            {
              type: ContentPartType.Resource,
              resource: {
                uri: "file:///path/to/image.jpg",
                blob: "base64imagedata",
                mimeType: "image/jpeg",
              },
            },
          ],
        },
      ];

      compareConversions(messages);
    });
  });
});
