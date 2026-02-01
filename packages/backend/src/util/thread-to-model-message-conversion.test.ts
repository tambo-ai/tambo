import {
  ContentPartType,
  MessageRole,
  type LegacyComponentDecision,
  type ThreadAssistantMessage,
} from "@tambo-ai-cloud/core";
import { convertAssistantMessage } from "./thread-to-model-message-conversion";

const baseAssistantMessage: Omit<
  ThreadAssistantMessage,
  "content" | "component"
> = {
  id: "msg_123",
  threadId: "thread_123",
  role: MessageRole.Assistant,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  componentState: {},
};

// Simple MIME type predicate for testing
const testMimeTypePredicate = (_mimeType: string): boolean => true;

describe("convertAssistantMessage", () => {
  describe("text content handling", () => {
    it("should use message.content for assistant message without component", () => {
      const message: ThreadAssistantMessage = {
        ...baseAssistantMessage,
        content: [
          { type: ContentPartType.Text, text: "Hello, how can I help?" },
        ],
      };

      const result = convertAssistantMessage(
        message,
        [],
        testMimeTypePredicate,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: "assistant",
        content: [{ type: "text", text: "Hello, how can I help?" }],
      });
    });

    it("should use message.content even when component exists (not JSON-stringify component)", () => {
      // This test verifies the bug fix: when message.component exists,
      // we should still use message.content for the LLM, not JSON.stringify(component)
      const component: LegacyComponentDecision = {
        message: "Here is the weather",
        componentName: "WeatherCard",
        props: { temperature: 72, city: "San Francisco" },
        componentState: null,
      };

      const message: ThreadAssistantMessage = {
        ...baseAssistantMessage,
        content: [{ type: ContentPartType.Text, text: "Here is the weather" }],
        component,
        componentState: { expanded: true },
      };

      const result = convertAssistantMessage(
        message,
        [],
        testMimeTypePredicate,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: "assistant",
        content: [{ type: "text", text: "Here is the weather" }],
      });

      // Verify we did NOT include JSON-stringified component data
      const textContent = (
        result[0] as { content: { type: string; text: string }[] }
      ).content[0].text;
      expect(textContent).not.toContain("componentName");
      expect(textContent).not.toContain("WeatherCard");
      expect(textContent).not.toContain("temperature");
      expect(textContent).not.toContain('"props"');
    });

    it("should use message.content when component has empty componentName", () => {
      // This is the common case: every LLM response creates a component object
      // even when no UI component is rendered (componentName is empty string)
      const component: LegacyComponentDecision = {
        message: "Eels and elephants are not related",
        componentName: "", // Empty string - no component rendered
        props: null,
        componentState: null,
      };

      const message: ThreadAssistantMessage = {
        ...baseAssistantMessage,
        content: [
          {
            type: ContentPartType.Text,
            text: "Eels and elephants are not related",
          },
        ],
        component,
      };

      const result = convertAssistantMessage(
        message,
        [],
        testMimeTypePredicate,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: "assistant",
        content: [{ type: "text", text: "Eels and elephants are not related" }],
      });

      // Verify the response is plain text, not JSON
      const textContent = (
        result[0] as { content: { type: string; text: string }[] }
      ).content[0].text;
      expect(textContent).not.toContain("{");
      expect(textContent).not.toContain('"message"');
    });

    it("should handle multiple text content parts", () => {
      const message: ThreadAssistantMessage = {
        ...baseAssistantMessage,
        content: [
          { type: ContentPartType.Text, text: "First part. " },
          { type: ContentPartType.Text, text: "Second part." },
        ],
      };

      const result = convertAssistantMessage(
        message,
        [],
        testMimeTypePredicate,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: "assistant",
        content: [
          { type: "text", text: "First part. " },
          { type: "text", text: "Second part." },
        ],
      });
    });
  });
});
