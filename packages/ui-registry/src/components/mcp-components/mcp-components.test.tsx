/// <reference types="@testing-library/jest-dom" />
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import React from "react";
import { render, screen } from "@testing-library/react";
import { McpPromptButton } from "./mcp-components";
import { useTamboMcpPromptList, useTamboMcpPrompt } from "@tambo-ai/react/mcp";

// Mocks are provided via moduleNameMapper in jest.config.ts

const mockUseTamboMcpPromptList = jest.mocked(useTamboMcpPromptList);
const mockUseTamboMcpPrompt = jest.mocked(useTamboMcpPrompt);

describe("McpPromptButton validation", () => {
  const mockOnInsertText = jest.fn();
  const defaultPromptList = [
    {
      server: { url: "http://localhost:3000" },
      prompt: { name: "test-prompt", description: "A test prompt" },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTamboMcpPromptList.mockReturnValue({
      data: defaultPromptList,
      isLoading: false,
    } as ReturnType<typeof useTamboMcpPromptList>);
    mockUseTamboMcpPrompt.mockReturnValue({
      data: undefined,
      error: undefined,
    } as ReturnType<typeof useTamboMcpPrompt>);
  });

  it("renders the button when prompts are available", () => {
    render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

    expect(
      screen.getByRole("button", { name: "Insert MCP Prompt" }),
    ).toBeInTheDocument();
  });

  it("does not render when no prompts are available", () => {
    mockUseTamboMcpPromptList.mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useTamboMcpPromptList>);

    const { container } = render(
      <McpPromptButton value="" onInsertText={mockOnInsertText} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("does not render when prompts are undefined", () => {
    mockUseTamboMcpPromptList.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useTamboMcpPromptList>);

    const { container } = render(
      <McpPromptButton value="" onInsertText={mockOnInsertText} />,
    );

    expect(container.firstChild).toBeNull();
  });

  describe("prompt data validation", () => {
    it("handles valid prompt data with text content", async () => {
      const validPromptData = {
        messages: [
          { content: { type: "text", text: "Hello, world!" } },
          { content: { type: "text", text: "Second message" } },
        ],
      };

      // Initially no prompt selected
      const { rerender } = render(
        <McpPromptButton value="" onInsertText={mockOnInsertText} />,
      );

      // Simulate selecting a prompt and getting data
      mockUseTamboMcpPrompt.mockReturnValue({
        data: validPromptData,
        error: undefined,
      } as ReturnType<typeof useTamboMcpPrompt>);

      // Force a rerender to trigger the effect
      rerender(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      // The callback should not be called yet since no prompt is selected
      expect(mockOnInsertText).not.toHaveBeenCalled();
    });

    it("handles prompt data with missing messages array", () => {
      const invalidPromptData = {};

      mockUseTamboMcpPrompt.mockReturnValue({
        data: invalidPromptData,
        error: undefined,
      } as ReturnType<typeof useTamboMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      // Should not crash and should not call onInsertText
      expect(mockOnInsertText).not.toHaveBeenCalled();
    });

    it("handles prompt data with non-array messages", () => {
      const invalidPromptData = {
        messages: "not an array",
      };

      mockUseTamboMcpPrompt.mockReturnValue({
        data: invalidPromptData,
        error: undefined,
      } as ReturnType<typeof useTamboMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      // Should not crash and should not call onInsertText
      expect(mockOnInsertText).not.toHaveBeenCalled();
    });

    it("handles prompt data with null messages", () => {
      const invalidPromptData = {
        messages: null,
      };

      mockUseTamboMcpPrompt.mockReturnValue({
        data: invalidPromptData,
        error: undefined,
      } as ReturnType<typeof useTamboMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      // Should not crash and should not call onInsertText
      expect(mockOnInsertText).not.toHaveBeenCalled();
    });

    it("handles messages with missing content", () => {
      const promptDataWithMissingContent = {
        messages: [
          { content: { type: "text", text: "Valid message" } },
          {}, // Missing content
          { content: null }, // Null content
        ],
      };

      mockUseTamboMcpPrompt.mockReturnValue({
        data: promptDataWithMissingContent,
        error: undefined,
      } as ReturnType<typeof useTamboMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      // Should not crash
      expect(mockOnInsertText).not.toHaveBeenCalled();
    });

    it("handles messages with missing content type", () => {
      const promptDataWithMissingType = {
        messages: [
          { content: { text: "No type field" } },
          { content: { type: "text", text: "Valid message" } },
        ],
      };

      mockUseTamboMcpPrompt.mockReturnValue({
        data: promptDataWithMissingType,
        error: undefined,
      } as ReturnType<typeof useTamboMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      // Should not crash
      expect(mockOnInsertText).not.toHaveBeenCalled();
    });

    it("handles messages with non-text content types", () => {
      const promptDataWithMixedTypes = {
        messages: [
          { content: { type: "image", url: "http://example.com/image.png" } },
          { content: { type: "text", text: "Text message" } },
          { content: { type: "audio", data: "base64data" } },
        ],
      };

      mockUseTamboMcpPrompt.mockReturnValue({
        data: promptDataWithMixedTypes,
        error: undefined,
      } as ReturnType<typeof useTamboMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      // Should not crash, should only extract text content
      expect(mockOnInsertText).not.toHaveBeenCalled();
    });

    it("handles messages with text field that is not a string", () => {
      const promptDataWithInvalidText = {
        messages: [
          { content: { type: "text", text: 123 } }, // Number instead of string
          { content: { type: "text", text: { nested: "object" } } }, // Object instead of string
          { content: { type: "text", text: "Valid string" } },
        ],
      };

      mockUseTamboMcpPrompt.mockReturnValue({
        data: promptDataWithInvalidText,
        error: undefined,
      } as ReturnType<typeof useTamboMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      // Should not crash
      expect(mockOnInsertText).not.toHaveBeenCalled();
    });

    it("handles completely null prompt data", () => {
      mockUseTamboMcpPrompt.mockReturnValue({
        data: null,
        error: undefined,
      } as ReturnType<typeof useTamboMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      // Should not crash
      expect(mockOnInsertText).not.toHaveBeenCalled();
    });

    it("handles undefined prompt data", () => {
      mockUseTamboMcpPrompt.mockReturnValue({
        data: undefined,
        error: undefined,
      } as ReturnType<typeof useTamboMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      // Should not crash
      expect(mockOnInsertText).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("handles fetch errors gracefully", () => {
      mockUseTamboMcpPrompt.mockReturnValue({
        data: undefined,
        error: new Error("Network error"),
      } as ReturnType<typeof useTamboMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      // Should not crash
      expect(
        screen.getByRole("button", { name: "Insert MCP Prompt" }),
      ).toBeInTheDocument();
    });
  });
});
