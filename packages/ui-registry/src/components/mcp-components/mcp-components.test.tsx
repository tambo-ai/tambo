/// <reference types="@testing-library/jest-dom" />
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import React from "react";
import { render, screen } from "@testing-library/react";
import { McpPromptButton, McpResourceButton } from "./mcp-components";
import {
  useTamboMcpPromptList,
  useTamboMcpPrompt,
  useTamboMcpResourceList,
} from "@tambo-ai/react/mcp";

// Mocks are provided via moduleNameMapper in jest.config.ts

const mockUseTamboMcpPromptList = jest.mocked(useTamboMcpPromptList);
const mockUseTamboMcpPrompt = jest.mocked(useTamboMcpPrompt);
const mockUseTamboMcpResourceList = jest.mocked(useTamboMcpResourceList);

describe("McpPromptButton", () => {
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
    it("handles valid prompt data with text content", () => {
      const validPromptData = {
        messages: [
          { content: { type: "text", text: "Hello, world!" } },
          { content: { type: "text", text: "Second message" } },
        ],
      };

      const { rerender } = render(
        <McpPromptButton value="" onInsertText={mockOnInsertText} />,
      );

      mockUseTamboMcpPrompt.mockReturnValue({
        data: validPromptData,
        error: undefined,
      } as ReturnType<typeof useTamboMcpPrompt>);

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

      expect(mockOnInsertText).not.toHaveBeenCalled();
    });

    it("handles completely null prompt data", () => {
      mockUseTamboMcpPrompt.mockReturnValue({
        data: null,
        error: undefined,
      } as ReturnType<typeof useTamboMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

      expect(mockOnInsertText).not.toHaveBeenCalled();
    });

    it("handles undefined prompt data", () => {
      mockUseTamboMcpPrompt.mockReturnValue({
        data: undefined,
        error: undefined,
      } as ReturnType<typeof useTamboMcpPrompt>);

      render(<McpPromptButton value="" onInsertText={mockOnInsertText} />);

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

      expect(
        screen.getByRole("button", { name: "Insert MCP Prompt" }),
      ).toBeInTheDocument();
    });
  });
});

describe("McpResourceButton", () => {
  const mockOnInsertResource = jest.fn();
  const defaultResourceList = [
    {
      server: { url: "http://localhost:3000" },
      resource: {
        uri: "test:file://doc.md",
        name: "Documentation",
        description: "Main docs",
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTamboMcpResourceList.mockReturnValue({
      data: defaultResourceList,
      isLoading: false,
    } as ReturnType<typeof useTamboMcpResourceList>);
  });

  it("renders the button when resources are available", () => {
    render(
      <McpResourceButton value="" onInsertResource={mockOnInsertResource} />,
    );

    expect(
      screen.getByRole("button", { name: "Insert MCP Resource" }),
    ).toBeInTheDocument();
  });

  it("does not render when no resources are available", () => {
    mockUseTamboMcpResourceList.mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useTamboMcpResourceList>);

    const { container } = render(
      <McpResourceButton value="" onInsertResource={mockOnInsertResource} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("does not render when resources are undefined", () => {
    mockUseTamboMcpResourceList.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useTamboMcpResourceList>);

    const { container } = render(
      <McpResourceButton value="" onInsertResource={mockOnInsertResource} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
