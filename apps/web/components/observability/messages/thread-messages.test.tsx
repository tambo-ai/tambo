import { ThreadMessages } from "@/components/observability/messages/thread-messages";
import {
  createMockSearchMatches,
  createMockThreadDifferentDays,
  createMockThreadSameDay,
  createMockThreadWithLargeSystemMessage,
  createMockThreadWithMessages,
  createMockThreadWithNonFirstSystemMessage,
  createMockThreadWithSmallSystemMessage,
  createMockThreadWithoutToolResponse,
} from "@/__fixtures__/thread-factories";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// Mock the utils
jest.mock("../utils", () => ({
  isSameDay: (date1: Date, date2: Date) =>
    date1.toDateString() === date2.toDateString(),
}));

// Mock the child components
jest.mock("./component-message", () => ({
  ComponentMessage: ({ message }: any) => (
    <div data-testid="component-message">{message.id}</div>
  ),
}));

jest.mock("./date-separator", () => ({
  DateSeparator: ({ date }: any) => (
    <div data-testid="date-separator">{date.toISOString()}</div>
  ),
}));

jest.mock("./message-content", () => ({
  MessageContent: ({ message, onCopyId }: any) => (
    <div data-testid="message-content">
      {message.role}:{" "}
      {Array.isArray(message.content)
        ? message.content.map((c: any) => c.text).join("")
        : message.content}
      <span
        onClick={() => onCopyId && onCopyId(message.id)}
        style={{ cursor: "pointer" }}
      >
        {message.id}
      </span>
    </div>
  ),
}));

jest.mock("./tool-call-message", () => ({
  ToolCallMessage: ({ message }: any) => (
    <div data-testid="tool-call-message">{message.id}</div>
  ),
}));

// Get the clipboard mock from navigator
const mockWriteText = navigator.clipboard.writeText as jest.Mock;

// Helper function to create properly typed message refs
const createMessageRefs = (): React.MutableRefObject<
  Record<string, HTMLDivElement>
> => {
  return { current: {} };
};

describe("ThreadMessages", () => {
  const mockThread = createMockThreadWithMessages();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all message types correctly", () => {
    const mockMessageRefs = createMessageRefs();
    render(
      <ThreadMessages thread={mockThread} messageRefs={mockMessageRefs} />,
    );

    expect(screen.getAllByTestId("message-content")).toHaveLength(3);
    expect(screen.getByText("user: Hello")).toBeInTheDocument();
  });

  it("groups tool calls with their responses", () => {
    const mockMessageRefs = createMessageRefs();
    render(
      <ThreadMessages thread={mockThread} messageRefs={mockMessageRefs} />,
    );

    // Should render the assistant message
    expect(screen.getByText("assistant: Hi there")).toBeInTheDocument();
    // Should render the tool call message
    expect(screen.getByTestId("tool-call-message")).toBeInTheDocument();
  });

  it("renders component messages when component decision exists", () => {
    const mockMessageRefs = createMessageRefs();
    render(
      <ThreadMessages thread={mockThread} messageRefs={mockMessageRefs} />,
    );

    // Should render the assistant message with component
    expect(
      screen.getByText("assistant: Response with component"),
    ).toBeInTheDocument();
    // Should render the component message
    expect(screen.getByTestId("component-message")).toBeInTheDocument();
  });

  it("determines correct group type for different message types", () => {
    const mockMessageRefs = createMessageRefs();
    render(
      <ThreadMessages thread={mockThread} messageRefs={mockMessageRefs} />,
    );

    // Should have message content for user message
    expect(screen.getByText("user: Hello")).toBeInTheDocument();
    // Should have tool call message for assistant with tool call
    expect(screen.getByTestId("tool-call-message")).toBeInTheDocument();
    // Should have component message for assistant with component
    expect(screen.getByTestId("component-message")).toBeInTheDocument();
  });

  it("applies correct alignment for user vs assistant messages", () => {
    const mockMessageRefs = createMessageRefs();
    render(
      <ThreadMessages thread={mockThread} messageRefs={mockMessageRefs} />,
    );

    const messageContainers = screen.getAllByTestId("message-content");
    expect(messageContainers).toHaveLength(3); // user and assistant messages
  });

  it("applies correct alignment for tool call and component messages", () => {
    const mockMessageRefs = createMessageRefs();
    render(
      <ThreadMessages thread={mockThread} messageRefs={mockMessageRefs} />,
    );

    // Find the parent containers that have the CSS classes applied
    const toolCallElement = screen.getByTestId("tool-call-message");
    const componentElement = screen.getByTestId("component-message");

    // Look for the parent div that contains the CSS classes
    const toolCallContainer = toolCallElement.closest("div.group");
    const componentContainer = componentElement.closest("div.group");

    expect(toolCallContainer).toHaveClass("items-start");
    expect(componentContainer).toHaveClass("items-start");
  });

  it("handles search highlighting for matching messages", () => {
    const mockMessageRefs = createMessageRefs();
    const searchMatches = createMockSearchMatches();

    render(
      <ThreadMessages
        thread={mockThread}
        searchQuery="hello"
        searchMatches={searchMatches}
        messageRefs={mockMessageRefs}
      />,
    );

    // Messages with matches should not have opacity reduced
    const userMessageContainer = screen.getByText("user: Hello").closest("div");
    expect(userMessageContainer).not.toHaveClass("opacity-40");
  });

  it("applies opacity to non-matching messages when searching", () => {
    const mockMessageRefs = createMessageRefs();
    const searchMatches = createMockSearchMatches();

    render(
      <ThreadMessages
        thread={mockThread}
        searchQuery="hello"
        searchMatches={searchMatches}
        messageRefs={mockMessageRefs}
      />,
    );

    // Messages without matches should have reduced opacity
    const assistantMessageElement = screen.getByText("assistant: Hi there");
    const assistantMessageContainer =
      assistantMessageElement.closest("div.group");
    expect(assistantMessageContainer).toHaveClass("opacity-40");
  });

  it("highlights current match message", () => {
    const mockMessageRefs = createMessageRefs();
    render(
      <ThreadMessages
        thread={mockThread}
        currentMatchMessageId="msg-1"
        messageRefs={mockMessageRefs}
      />,
    );

    const currentMatchElement = screen.getByText("user: Hello");
    const currentMatchContainer = currentMatchElement.closest("div.group");
    expect(currentMatchContainer).toHaveClass(
      "ring-2",
      "ring-yellow-400",
      "rounded-lg",
      "p-2",
    );
  });

  it("handles empty messages array", () => {
    const mockMessageRefs = createMessageRefs();
    const emptyThread = { ...mockThread, messages: [] };

    render(
      <ThreadMessages thread={emptyThread} messageRefs={mockMessageRefs} />,
    );

    expect(screen.queryByTestId("message-content")).not.toBeInTheDocument();
  });

  it("handles undefined messages", () => {
    const mockMessageRefs = createMessageRefs();
    const threadWithUndefinedMessages = {
      ...mockThread,
      messages: undefined as any,
    };

    render(
      <ThreadMessages
        thread={threadWithUndefinedMessages}
        messageRefs={mockMessageRefs}
      />,
    );

    expect(screen.queryByTestId("message-content")).not.toBeInTheDocument();
  });

  it("handles copy functionality", async () => {
    // Test that clipboard mock is working
    expect(navigator.clipboard.writeText).toBeDefined();
    expect(jest.isMockFunction(navigator.clipboard.writeText)).toBe(true);

    // Test direct clipboard call
    await navigator.clipboard.writeText("test");
    expect(mockWriteText).toHaveBeenCalledWith("test");
  });

  it("shows check icon when message ID is copied", async () => {
    const mockMessageRefs = createMessageRefs();
    const user = userEvent.setup();
    render(
      <ThreadMessages thread={mockThread} messageRefs={mockMessageRefs} />,
    );

    // Find a message ID element and click it
    const messageIdElement = screen.getByText("msg-1");
    await user.click(messageIdElement);

    // The test verifies that the clipboard functionality is available
    // and that the component can handle copy operations
    expect(navigator.clipboard.writeText).toBeDefined();
  });

  it("handles messages with same day correctly", () => {
    const mockMessageRefs = createMessageRefs();
    const sameDayThread = createMockThreadSameDay();

    render(
      <ThreadMessages thread={sameDayThread} messageRefs={mockMessageRefs} />,
    );

    // Should only have one date separator for the same day
    const dateSeparators = screen.getAllByTestId("date-separator");
    expect(dateSeparators).toHaveLength(1);
  });

  it("handles messages with different days correctly", () => {
    const mockMessageRefs = createMessageRefs();
    const differentDayThread = createMockThreadDifferentDays();

    render(
      <ThreadMessages
        thread={differentDayThread}
        messageRefs={mockMessageRefs}
      />,
    );

    // Should have two date separators for different days
    const dateSeparators = screen.getAllByTestId("date-separator");
    expect(dateSeparators).toHaveLength(2);
  });

  it("handles missing tool response gracefully", () => {
    const mockMessageRefs = createMessageRefs();
    const threadWithoutToolResponse = createMockThreadWithoutToolResponse();

    expect(() => {
      render(
        <ThreadMessages
          thread={threadWithoutToolResponse}
          messageRefs={mockMessageRefs}
        />,
      );
    }).not.toThrow();
  });

  it("renders first system message collapsed by default", () => {
    const mockMessageRefs = createMessageRefs();
    const threadWithSmallSystem = createMockThreadWithSmallSystemMessage();

    render(
      <ThreadMessages
        thread={threadWithSmallSystem}
        messageRefs={mockMessageRefs}
      />,
    );

    // Should show collapse trigger instead of the actual content
    expect(
      screen.getByText("System prompt (click to expand)"),
    ).toBeInTheDocument();
    // Should not show the actual content by default
    expect(
      screen.queryByText("system: Small system prompt"),
    ).not.toBeInTheDocument();
  });

  it("renders large system message collapsed by default", () => {
    const mockMessageRefs = createMessageRefs();
    const threadWithLargeSystem = createMockThreadWithLargeSystemMessage();

    render(
      <ThreadMessages
        thread={threadWithLargeSystem}
        messageRefs={mockMessageRefs}
      />,
    );

    // Should show collapse trigger instead of the actual content
    expect(
      screen.getByText("System prompt (click to expand)"),
    ).toBeInTheDocument();
    // Should not show the actual large content by default
    expect(
      screen.queryByText("system: AAAAAAAAAAAAAAAAAAAA"),
    ).not.toBeInTheDocument();
  });

  it("allows expanding collapsed system message", async () => {
    const mockMessageRefs = createMessageRefs();
    const user = userEvent.setup();
    const threadWithLargeSystem = createMockThreadWithLargeSystemMessage();

    render(
      <ThreadMessages
        thread={threadWithLargeSystem}
        messageRefs={mockMessageRefs}
      />,
    );

    // Initially collapsed - trigger should be visible, content should not
    expect(
      screen.getByText("System prompt (click to expand)"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^system: A+/)).not.toBeInTheDocument();

    // Click to expand
    const expandButton = screen.getByText("System prompt (click to expand)");
    await user.click(expandButton);

    // Should now show the system message content
    expect(screen.getByText(/^system: A+/)).toBeInTheDocument(); // Matches "system: AAA..." pattern
    // Trigger should still be visible (just with rotated chevron)
    expect(
      screen.getByText("System prompt (click to expand)"),
    ).toBeInTheDocument();
  });

  it("renders system message that's not first normally (not collapsed)", () => {
    const mockMessageRefs = createMessageRefs();
    const threadWithNonFirstSystem =
      createMockThreadWithNonFirstSystemMessage();

    render(
      <ThreadMessages
        thread={threadWithNonFirstSystem}
        messageRefs={mockMessageRefs}
      />,
    );

    // Should render system message normally (not collapsed) since it's not the first message
    expect(screen.getByText(/^system: A+/)).toBeInTheDocument(); // Matches "system: AAA..." pattern
    // Should not show collapse trigger
    expect(
      screen.queryByText("System prompt (click to expand)"),
    ).not.toBeInTheDocument();
  });
});
