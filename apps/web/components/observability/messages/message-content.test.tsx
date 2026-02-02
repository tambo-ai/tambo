import { MessageContent } from "@/components/observability/messages/message-content";
import { ChatCompletionContentPart, MessageRole } from "@tambo-ai-cloud/core";
import { TamboContextAttachmentProvider } from "@tambo-ai/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import * as utils from "../utils";

// Mock the markdown components from ui-registry
jest.mock("@tambo-ai/ui-registry/components/message", () => ({
  createMarkdownComponents: () => ({}),
}));

// Mock the highlight components
jest.mock("./highlight", () => ({
  HighlightedJson: ({ json }: any) => (
    <div data-testid="highlighted-json">{json}</div>
  ),
  HighlightText: ({ text }: any) => (
    <span data-testid="highlighted-text">{text}</span>
  ),
}));

// Mock usehooks-ts to use the mocked clipboard
jest.mock("usehooks-ts", () => ({
  useCopyToClipboard: () => [
    null,
    async (text: string) => {
      await navigator.clipboard.writeText(text);
      return true;
    },
  ],
}));

// Mock the Tambo React hooks
jest.mock("@tambo-ai/react", () => ({
  useTamboThreadInput: () => ({
    value: "",
    setValue: jest.fn(),
    submit: jest.fn(),
    isPending: false,
    error: null,
    images: [],
    addImage: jest.fn(),
    removeImage: jest.fn(),
  }),
  useTamboContextHelpers: () => ({
    addContextHelper: jest.fn(),
    removeContextHelper: jest.fn(),
  }),
  useTamboContextAttachment: () => ({
    attachments: [],
    removeContextAttachment: jest.fn(),
  }),
  useCurrentInteractablesSnapshot: () => [],
  TamboContextAttachmentProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactElement => children as React.ReactElement,
}));

// Get the clipboard mock from navigator (set up in jest.setup.ts)
const mockWriteText = navigator.clipboard.writeText as jest.Mock;

// Test wrapper component that provides necessary contexts
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TamboContextAttachmentProvider>{children}</TamboContextAttachmentProvider>
  );
}

// Helper function to render with providers
function renderWithProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: TestWrapper });
}

describe("MessageContent", () => {
  beforeEach(() => {
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
    // Spy on and mock formatTime
    jest.spyOn(utils, "formatTime").mockImplementation(() => "12:00 PM");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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
    reasoningDurationMS: null,
  };

  it("renders user message content", () => {
    renderWithProviders(
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
          reasoningDurationMS: null,
        }}
        isUserMessage={true}
      />,
    );

    expect(screen.getByText("user")).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByText("msg-1")).toBeInTheDocument();
  });

  it("renders assistant message content", () => {
    const assistantMessage = { ...baseMessage, role: MessageRole.Assistant };

    renderWithProviders(
      <MessageContent message={assistantMessage} isUserMessage={false} />,
    );

    expect(screen.getByText("assistant")).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("handles string content with search query", () => {
    renderWithProviders(
      <MessageContent
        message={baseMessage}
        isUserMessage={true}
        searchQuery="hello"
      />,
    );

    // Should render highlighted content when search query is present
    expect(screen.getByTestId("highlighted-text")).toBeInTheDocument();
  });

  it("handles string content without search query", () => {
    renderWithProviders(
      <MessageContent message={baseMessage} isUserMessage={true} />,
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

    renderWithProviders(
      <MessageContent message={elementMessage} isUserMessage={true} />,
    );

    expect(screen.getByText("Custom element")).toBeInTheDocument();
  });

  it("handles empty or invalid content", () => {
    const emptyMessage = { ...baseMessage, content: [] };

    renderWithProviders(
      <MessageContent message={emptyMessage} isUserMessage={true} />,
    );

    expect(screen.getByText("No content")).toBeInTheDocument();
  });

  it("shows additional context for user messages with context", () => {
    const messageWithContext = {
      ...baseMessage,
      additionalContext: { key: "value", nested: { data: "test" } },
    };

    renderWithProviders(
      <MessageContent message={messageWithContext} isUserMessage={true} />,
    );

    expect(screen.getByText("Additional Context")).toBeInTheDocument();
  });

  it("does not show additional context for assistant messages", () => {
    const messageWithContext = {
      ...baseMessage,
      role: MessageRole.Assistant,
      additionalContext: { key: "value" },
    };

    renderWithProviders(
      <MessageContent message={messageWithContext} isUserMessage={false} />,
    );

    expect(screen.queryByText("Additional Context")).not.toBeInTheDocument();
  });

  it("does not show additional context for user messages without context", () => {
    renderWithProviders(
      <MessageContent message={baseMessage} isUserMessage={true} />,
    );

    expect(screen.queryByText("Additional Context")).not.toBeInTheDocument();
  });

  it("toggles additional context visibility", async () => {
    const user = userEvent.setup();
    const messageWithContext = {
      ...baseMessage,
      additionalContext: { key: "value" },
    };

    renderWithProviders(
      <MessageContent message={messageWithContext} isUserMessage={true} />,
    );

    const toggleButton = screen.getByRole("button", {
      name: /^additional context$/i,
    });
    expect(toggleButton).toBeInTheDocument();

    // With animations skipped, the content is visible by default
    // but we can test that the toggle button exists and is clickable
    expect(screen.getByText(/"key": "value"/)).toBeInTheDocument();

    // Test that the button is interactive
    await user.click(toggleButton);
    // The button should still be there after clicking
    expect(toggleButton).toBeInTheDocument();
  });

  it("applies highlighted styling when message is highlighted", () => {
    renderWithProviders(
      <MessageContent
        message={baseMessage}
        isUserMessage={true}
        isHighlighted={true}
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

    renderWithProviders(
      <MessageContent
        message={messageWithContext}
        isUserMessage={true}
        searchQuery="value"
      />,
    );

    // Expand context first
    const toggleButton = screen.getByRole("button", {
      name: /^additional context$/i,
    });
    await user.click(toggleButton);

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
      renderWithProviders(
        <MessageContent message={messageWithBadContext} isUserMessage={true} />,
      );
    }).not.toThrow();
  });
});
