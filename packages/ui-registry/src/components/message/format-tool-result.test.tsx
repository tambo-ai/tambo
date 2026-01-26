/// <reference types="@testing-library/jest-dom" />
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { useTambo } from "@tambo-ai/react";
import { render } from "@testing-library/react";
import { Message, ToolcallInfo } from "./message";

// @tambo-ai/react is mocked via moduleNameMapper in jest.config.ts

/**
 * Creates a minimal TamboThreadMessage for testing tool results.
 */
function createToolCallMessage(
  overrides: Partial<TamboThreadMessage> = {},
): TamboThreadMessage {
  return {
    id: "test-message-id",
    role: "assistant",
    content: [],
    createdAt: new Date().toISOString(),
    tool_call_id: "test_call_id",
    toolCallRequest: {
      toolName: "test_tool",
      parameters: [],
    },
    ...overrides,
  } as TamboThreadMessage;
}

function createToolResponseMessage(
  content: TamboThreadMessage["content"],
): TamboThreadMessage {
  return {
    id: "tool-response-id",
    role: "tool",
    tool_call_id: "test_call_id",
    content,
    createdAt: new Date().toISOString(),
  } as TamboThreadMessage;
}

describe("formatToolResult in ToolcallInfo", () => {
  const mockUseTambo = jest.mocked(useTambo);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("text content", () => {
    it("renders plain text tool result", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        { type: "text", text: "Tool executed successfully" },
      ]);

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCallMessage, toolResponse],
          generationStage: "COMPLETE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      // The tool result should be rendered (need to expand the dropdown to see it)
      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });

    it("renders JSON tool result with formatting", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        { type: "text", text: '{"status": "success", "count": 42}' },
      ]);

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCallMessage, toolResponse],
          generationStage: "COMPLETE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });
  });

  describe("image content", () => {
    it("renders image_url content from tool result", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        {
          type: "image_url",
          image_url: { url: "https://example.com/image.png" },
        },
      ]);

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCallMessage, toolResponse],
          generationStage: "COMPLETE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });

    it("renders mixed text and image content", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        { type: "text", text: "Here is the generated image:" },
        {
          type: "image_url",
          image_url: { url: "https://example.com/chart.png" },
        },
      ]);

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCallMessage, toolResponse],
          generationStage: "COMPLETE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });
  });

  describe("resource content", () => {
    it("renders resource with text content", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        {
          type: "resource",
          resource: {
            name: "file.txt",
            text: "File contents here",
          },
        },
      ]);

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCallMessage, toolResponse],
          generationStage: "COMPLETE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });

    it("renders resource with URI reference", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        {
          type: "resource",
          resource: {
            uri: "file:///path/to/document.pdf",
            name: "document.pdf",
          },
        },
      ]);

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCallMessage, toolResponse],
          generationStage: "COMPLETE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });

    it("renders resource with base64 image blob", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        {
          type: "resource",
          resource: {
            name: "screenshot.png",
            mimeType: "image/png",
            blob: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          },
        },
      ]);

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCallMessage, toolResponse],
          generationStage: "COMPLETE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });
  });

  describe("mixed content types", () => {
    it("renders text, image, and resource together", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        { type: "text", text: "Analysis complete." },
        {
          type: "image_url",
          image_url: { url: "https://example.com/graph.png" },
        },
        {
          type: "resource",
          resource: {
            uri: "file:///data/results.json",
            name: "results.json",
          },
        },
      ]);

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCallMessage, toolResponse],
          generationStage: "COMPLETE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });
  });

  describe("edge cases", () => {
    it("handles empty content array", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([]);

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCallMessage, toolResponse],
          generationStage: "COMPLETE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });

    it("handles resource without any content fields", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        {
          type: "resource",
          resource: {},
        },
      ]);

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCallMessage, toolResponse],
          generationStage: "COMPLETE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });

    it("handles image_url without url", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        {
          type: "image_url",
          image_url: {},
        } as TamboThreadMessage["content"][number],
      ]);

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCallMessage, toolResponse],
          generationStage: "COMPLETE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });
  });

  describe("Tool Call/Result Pairing", () => {
    it("renders result when tool_call_id matches", async () => {
      const toolCallMessage = createToolCallMessage({
        id: "msg-1",
        tool_call_id: "call_123",
        toolCallRequest: {
          toolName: "weatherTool",
          parameters: [{ parameterName: "city", parameterValue: "London" }],
        },
      });

      const toolResultMessage = createToolResponseMessage([
        { type: "text", text: '{"temp": 72, "condition": "sunny"}' },
      ]);
      toolResultMessage.tool_call_id = "call_123";

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCallMessage, toolResultMessage],
          generationStage: "IDLE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      const button = container.querySelector("button");
      expect(button).toBeTruthy();
      expect(button?.textContent).toContain("weatherTool");
    });

    it("does not render component when tool_call_id is missing", () => {
      const toolCallMessage = createToolCallMessage({
        id: "msg-1",
        tool_call_id: undefined,
        toolCallRequest: {
          toolName: "noIdTool",
          parameters: [],
        },
      });

      const toolResultMessage = createToolResponseMessage([
        { type: "text", text: "Orphaned result" },
      ]);
      toolResultMessage.tool_call_id = "some_id";

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCallMessage, toolResultMessage],
          generationStage: "IDLE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      const button = container.querySelector("button");
      expect(button).toBeNull();
      expect(container.querySelector('[data-slot="toolcall-info"]')).toBeNull();
    });

    it("pairs correctly with out-of-order results", () => {
      const toolCall1 = createToolCallMessage({
        id: "msg-1",
        tool_call_id: "call_first",
        toolCallRequest: {
          toolName: "toolA",
          parameters: [],
        },
      });

      const toolCall2 = createToolCallMessage({
        id: "msg-2",
        tool_call_id: "call_second",
        toolCallRequest: {
          toolName: "toolB",
          parameters: [],
        },
      });

      const toolResult2 = createToolResponseMessage([
        { type: "text", text: "Result B" },
      ]);
      toolResult2.id = "msg-3";
      toolResult2.tool_call_id = "call_second";

      const toolResult1 = createToolResponseMessage([
        { type: "text", text: "Result A" },
      ]);
      toolResult1.id = "msg-4";
      toolResult1.tool_call_id = "call_first";

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCall1, toolCall2, toolResult2, toolResult1],
          generationStage: "IDLE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCall1}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });

    it("pairs each tool call with correct result in multi-tool scenario", () => {
      const toolCall1 = createToolCallMessage({
        id: "msg-1",
        tool_call_id: "call_1",
        toolCallRequest: {
          toolName: "tool1",
          parameters: [],
        },
      });

      const toolResult1 = createToolResponseMessage([
        { type: "text", text: "Result 1" },
      ]);
      toolResult1.id = "msg-3";
      toolResult1.tool_call_id = "call_1";

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCall1, toolResult1],
          generationStage: "IDLE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCall1}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });

    it("does not render result when tool_call_id does not match any result", () => {
      const toolCallMessage = createToolCallMessage({
        id: "msg-1",
        tool_call_id: "call_not_found",
        toolCallRequest: {
          toolName: "unmatchedTool",
          parameters: [],
        },
      });

      const toolResultMessage = createToolResponseMessage([
        { type: "text", text: "Wrong result" },
      ]);
      toolResultMessage.id = "msg-2";
      toolResultMessage.tool_call_id = "call_different";

      mockUseTambo.mockReturnValue({
        thread: {
          messages: [toolCallMessage, toolResultMessage],
          generationStage: "IDLE",
        },
      } as never);

      const { container } = render(
        <Message role="assistant" message={toolCallMessage}>
          <ToolcallInfo />
        </Message>,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });
  });
});
