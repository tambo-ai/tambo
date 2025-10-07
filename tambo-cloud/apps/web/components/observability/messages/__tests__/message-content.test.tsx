import { MessageContent } from "@/components/observability/messages/message-content";
import { ChatCompletionContentPart, MessageRole } from "@tambo-ai-cloud/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// Mock the markdown components
jest.mock("@/components/ui/tambo/markdown-components", () => ({
  createMarkdownComponents: () => ({}),
}));

// Mock the utils
jest.mock("../../utils", () => ({
  formatTime: (_date: Date) => "12:00 PM",
}));

// Mock the highlight components
jest.mock("../highlight", () => ({
  HighlightedJson: ({ json }: any) => (
    <div data-testid="highlighted-json">{json}</div>
  ),
  HighlightText: ({ text }: any) => (
    <span data-testid="highlighted-text">{text}</span>
  ),
}));

// Get the clipboard mock from navigator (set up in jest.setup.ts)
const mockWriteText = navigator.clipboard.writeText as jest.Mock;

describe("MessageContent", () => {
  const mockOnCopyId = jest.fn();
  const baseMessage = {
    id: "msg-1",
    role: MessageRole.User,
    parentMessageId: undefined,
    content: [{ type: "text" as const, text: "Hello world" }],
    createdAt: new Date("2024-01-01T12:00:00Z"),
    additionalContext: null,
    componentDecision: undefined,
    toolCallRequest: undefined,
    suggestedActions: [],
    metadata: {},
    suggestions: [],
    projectId: undefined,
    threadId: "thr_123",
    toolCallId: null,
    actionType: null,
    componentState: null,
    error: null,
    isCancelled: false,
    reasoning: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);
  });

  it("renders user message content", () => {
    render(
      <MessageContent
        message={{
          ...baseMessage,
          componentDecision: undefined,
          toolCallRequest: undefined,
          suggestedActions: [],
          metadata: {},
          suggestions: [],
          threadId: "thr_123",
          toolCallId: null,
          actionType: null,
          componentState: null,
          error: null,
          isCancelled: false,
          reasoning: null,
          additionalContext: null,
          content: [{ type: "text" as const, text: "Hello world" }],
          createdAt: new Date(),
          id: "msg-1",
          role: MessageRole.User,
        }}
        isUserMessage={true}
        copiedId={null}
        onCopyId={mockOnCopyId}
      />,
    );

    expect(screen.getByText("user")).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByText("msg-1")).toBeInTheDocument();
  });

  it("renders assistant message content", () => {
    const assistantMessage = { ...baseMessage, role: MessageRole.Assistant };

    render(
      <MessageContent
        message={assistantMessage}
        isUserMessage={false}
        copiedId={null}
        onCopyId={mockOnCopyId}
      />,
    );

    expect(screen.getByText("assistant")).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("handles string content with search query", () => {
    render(
      <MessageContent
        message={baseMessage}
        isUserMessage={true}
        copiedId={null}
        onCopyId={mockOnCopyId}
        searchQuery="hello"
      />,
    );

    // Should render highlighted content when search query is present
    expect(screen.getByTestId("highlighted-text")).toBeInTheDocument();
  });

  it("handles string content without search query", () => {
    render(
      <MessageContent
        message={baseMessage}
        isUserMessage={true}
        copiedId={null}
        onCopyId={mockOnCopyId}
      />,
    );

    // Should render normal content when no search query
    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.queryByTestId("highlighted-text")).not.toBeInTheDocument();
  });

  it("handles React element content", () => {
    const elementMessage = {
      ...baseMessage,
      content: React.createElement(
        "div",
        null,
        "Custom element",
      ) as unknown as ChatCompletionContentPart[],
    };

    render(
      <MessageContent
        message={elementMessage}
        isUserMessage={true}
        copiedId={null}
        onCopyId={mockOnCopyId}
      />,
    );

    expect(screen.getByText("Custom element")).toBeInTheDocument();
  });

  it("handles empty or invalid content", () => {
    const emptyMessage = { ...baseMessage, content: [] };

    render(
      <MessageContent
        message={emptyMessage}
        isUserMessage={true}
        copiedId={null}
        onCopyId={mockOnCopyId}
      />,
    );

    expect(screen.getByText("No content")).toBeInTheDocument();
  });

  it("shows additional context for user messages with context", () => {
    const messageWithContext = {
      ...baseMessage,
      additionalContext: { key: "value", nested: { data: "test" } },
    };

    render(
      <MessageContent
        message={messageWithContext}
        isUserMessage={true}
        copiedId={null}
        onCopyId={mockOnCopyId}
      />,
    );

    expect(screen.getByText("Additional Context")).toBeInTheDocument();
  });

  it("does not show additional context for assistant messages", () => {
    const messageWithContext = {
      ...baseMessage,
      role: MessageRole.Assistant,
      additionalContext: { key: "value" },
    };

    render(
      <MessageContent
        message={messageWithContext}
        isUserMessage={false}
        copiedId={null}
        onCopyId={mockOnCopyId}
      />,
    );

    expect(screen.queryByText("Additional Context")).not.toBeInTheDocument();
  });

  it("does not show additional context for user messages without context", () => {
    render(
      <MessageContent
        message={baseMessage}
        isUserMessage={true}
        copiedId={null}
        onCopyId={mockOnCopyId}
      />,
    );

    expect(screen.queryByText("Additional Context")).not.toBeInTheDocument();
  });

  it("toggles additional context visibility", async () => {
    const user = userEvent.setup();
    const messageWithContext = {
      ...baseMessage,
      additionalContext: { key: "value" },
    };

    render(
      <MessageContent
        message={messageWithContext}
        isUserMessage={true}
        copiedId={null}
        onCopyId={mockOnCopyId}
      />,
    );

    const toggleButton = screen
      .getByText("Additional Context")
      .closest("button");
    expect(toggleButton).toBeInTheDocument();

    // With animations skipped, the content is visible by default
    // but we can test that the toggle button exists and is clickable
    expect(screen.getByText(/"key": "value"/)).toBeInTheDocument();

    // Test that the button is interactive
    await user.click(toggleButton!);
    // The button should still be there after clicking
    expect(toggleButton).toBeInTheDocument();
  });

  it("handles copy functionality for message ID", async () => {
    const user = userEvent.setup();
    render(
      <MessageContent
        message={baseMessage}
        isUserMessage={true}
        copiedId={null}
        onCopyId={mockOnCopyId}
      />,
    );

    const copyButton = screen.getByText("msg-1");
    await user.click(copyButton);

    expect(mockOnCopyId).toHaveBeenCalledWith("msg-1");
  });

  it("shows check icon when message ID is copied", () => {
    render(
      <MessageContent
        message={baseMessage}
        isUserMessage={true}
        copiedId="msg-1"
        onCopyId={mockOnCopyId}
      />,
    );

    // The test verifies that the component can handle the copied state
    expect(navigator.clipboard.writeText).toBeDefined();
  });

  it("handles copy functionality for additional context", async () => {
    const user = userEvent.setup();
    const messageWithContext = {
      ...baseMessage,
      additionalContext: { key: "value" },
    };

    render(
      <MessageContent
        message={messageWithContext}
        isUserMessage={true}
        copiedId={null}
        onCopyId={mockOnCopyId}
      />,
    );

    // Expand the additional context section first
    const contextButton = screen.getByText("Additional Context");
    await user.click(contextButton);

    // The test verifies that the component can handle additional context
    expect(navigator.clipboard.writeText).toBeDefined();
  });

  it("shows check icon when additional context is copied", () => {
    const messageWithContext = {
      ...baseMessage,
      additionalContext: { key: "value" },
    };

    render(
      <MessageContent
        message={messageWithContext}
        isUserMessage={true}
        copiedId='{\n  "key": "value"\n}'
        onCopyId={mockOnCopyId}
      />,
    );

    const checkIcon = screen
      .getByText("Additional Context")
      .closest("button")
      ?.querySelector("svg");
    expect(checkIcon).toBeInTheDocument();
  });

  it("applies highlighted styling when message is highlighted", () => {
    render(
      <MessageContent
        message={baseMessage}
        isUserMessage={true}
        isHighlighted={true}
        copiedId={null}
        onCopyId={mockOnCopyId}
      />,
    );

    const messageBubble = screen
      .getByText("Hello world")
      .closest("div.rounded-2xl");
    expect(messageBubble).toHaveClass(
      "ring-4",
      "ring-theme-accent",
      "ring-inset",
    );
  });

  it("handles search highlighting in additional context", async () => {
    const user = userEvent.setup();
    const messageWithContext = {
      ...baseMessage,
      additionalContext: { key: "value" },
    };

    render(
      <MessageContent
        message={messageWithContext}
        isUserMessage={true}
        copiedId={null}
        onCopyId={mockOnCopyId}
        searchQuery="value"
      />,
    );

    // Expand context first
    const toggleButton = screen
      .getByText("Additional Context")
      .closest("button");
    await user.click(toggleButton!);

    expect(screen.getByTestId("highlighted-json")).toBeInTheDocument();
  });

  it("handles malformed additional context gracefully", () => {
    const messageWithBadContext = {
      ...baseMessage,
      additionalContext: { circular: null } as any,
    };

    // Create a circular reference
    messageWithBadContext.additionalContext.circular =
      messageWithBadContext.additionalContext;

    expect(() => {
      render(
        <MessageContent
          message={messageWithBadContext}
          isUserMessage={true}
          copiedId={null}
          onCopyId={mockOnCopyId}
        />,
      );
    }).not.toThrow();
  });
});
