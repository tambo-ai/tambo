import { describe, expect, it, jest } from "@jest/globals";
import {
  useTambo,
  type TamboThreadMessage,
  type TamboToolUseContent,
} from "@tambo-ai/react";
import { render } from "@testing-library/react";
import { ToolcallInfo } from "../index";

/**
 * Creates a test message with a tool_use content block.
 * In V1, tool calls are content blocks within messages.
 */
export function createToolCallMessage(
  overrides: Partial<TamboThreadMessage> & {
    toolUse?: Partial<TamboToolUseContent>;
  } = {},
): TamboThreadMessage {
  const { toolUse, ...messageOverrides } = overrides;
  const toolUseBlock: TamboToolUseContent = {
    type: "tool_use",
    id: "tool-call-id",
    name: "test-tool",
    input: {},
    ...toolUse,
  };
  return {
    id: "test-message-id",
    role: "assistant",
    content: [toolUseBlock],
    createdAt: new Date().toISOString(),
    ...messageOverrides,
  };
}

/**
 * Creates a test message with tool_result content blocks.
 * In V1, tool results are content blocks within user messages.
 */
export function createToolResponseMessage(
  content: TamboThreadMessage["content"],
): TamboThreadMessage {
  return {
    id: "tool-response-id",
    role: "user",
    content: content.map((block) =>
      block.type === "text"
        ? {
            type: "tool_result" as const,
            tool_use_id: "tool-call-id",
            content: block.text,
          }
        : block,
    ),
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
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <ToolcallInfo.Root message={toolCallMessage} />,
      );

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
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <ToolcallInfo.Root message={toolCallMessage} />,
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
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <ToolcallInfo.Root message={toolCallMessage} />,
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
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <ToolcallInfo.Root message={toolCallMessage} />,
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
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <ToolcallInfo.Root message={toolCallMessage} />,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });
  });

  describe("mixed content types", () => {
    it("renders text and resource together", () => {
      const toolCallMessage = createToolCallMessage();
      const toolResponse = createToolResponseMessage([
        { type: "text", text: "Analysis complete." },
        {
          type: "resource",
          resource: {
            uri: "file:///data/results.json",
            name: "results.json",
          },
        },
      ]);

      mockUseTambo.mockReturnValue({
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <ToolcallInfo.Root message={toolCallMessage} />,
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
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <ToolcallInfo.Root message={toolCallMessage} />,
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
        messages: [toolCallMessage, toolResponse],
        isStreaming: false,
        isIdle: true,
      } as never);

      const { container } = render(
        <ToolcallInfo.Root message={toolCallMessage} />,
      );

      expect(
        container.querySelector('[data-slot="toolcall-info"]'),
      ).toBeTruthy();
    });
  });
});
