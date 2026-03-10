import { describe, expect, it, jest } from "@jest/globals";
import { useTambo } from "@tambo-ai/react";
import { render, screen } from "@testing-library/react";
import { ThreadContent } from "../index";

describe("ThreadContent", () => {
  const mockUseTambo = jest.mocked(useTambo);

  beforeEach(() => {
    mockUseTambo.mockReturnValue({
      messages: [],
      isStreaming: false,
      isIdle: true,
      currentThreadId: "thread-1",
      switchThread: jest.fn(),
      startNewThread: jest.fn().mockReturnValue("new-thread-id"),
    } as never);
  });

  it("renders Root with data-slot attribute", () => {
    const { container } = render(
      <ThreadContent.Root>
        <span>child</span>
      </ThreadContent.Root>,
    );

    expect(
      container.querySelector('[data-slot="thread-content"]'),
    ).toBeTruthy();
    expect(screen.getByText("child")).toBeTruthy();
  });

  it("throws when parts are used outside Root", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ThreadContent.Messages />)).toThrow(
      "ThreadContentContext is missing",
    );
    spy.mockRestore();
  });

  it("exposes messages data-slot", () => {
    mockUseTambo.mockReturnValue({
      messages: [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "hello" }],
        },
      ],
      isStreaming: false,
      isIdle: true,
      currentThreadId: "thread-1",
      switchThread: jest.fn(),
      startNewThread: jest.fn().mockReturnValue("new-thread-id"),
    } as never);

    const { container } = render(
      <ThreadContent.Root>
        <ThreadContent.Messages />
      </ThreadContent.Root>,
    );

    expect(
      container.querySelector('[data-slot="thread-content-messages"]'),
    ).toBeTruthy();
  });

  it("renders Empty slot when no messages exist", () => {
    const { container } = render(
      <ThreadContent.Root>
        <ThreadContent.Empty>
          <span>No messages yet</span>
        </ThreadContent.Empty>
      </ThreadContent.Root>,
    );

    expect(
      container.querySelector('[data-slot="thread-content-empty"]'),
    ).toBeTruthy();
    expect(screen.getByText("No messages yet")).toBeTruthy();
  });

  it("hides Empty slot when messages exist", () => {
    mockUseTambo.mockReturnValue({
      messages: [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "hello" }],
        },
      ],
      isStreaming: false,
      isIdle: true,
      currentThreadId: "thread-1",
      switchThread: jest.fn(),
      startNewThread: jest.fn().mockReturnValue("new-thread-id"),
    } as never);

    const { container } = render(
      <ThreadContent.Root>
        <ThreadContent.Empty>
          <span>No messages yet</span>
        </ThreadContent.Empty>
      </ThreadContent.Root>,
    );

    expect(
      container.querySelector('[data-slot="thread-content-empty"]'),
    ).toBeNull();
  });

  it("keeps Empty mounted with keepMounted and sets data-hidden", () => {
    mockUseTambo.mockReturnValue({
      messages: [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "hello" }],
        },
      ],
      isStreaming: false,
      isIdle: true,
      currentThreadId: "thread-1",
      switchThread: jest.fn(),
      startNewThread: jest.fn().mockReturnValue("new-thread-id"),
    } as never);

    const { container } = render(
      <ThreadContent.Root>
        <ThreadContent.Empty keepMounted>
          <span>No messages yet</span>
        </ThreadContent.Empty>
      </ThreadContent.Root>,
    );

    const emptySlot = container.querySelector(
      '[data-slot="thread-content-empty"]',
    );
    expect(emptySlot).toBeTruthy();
    expect(emptySlot?.hasAttribute("data-hidden")).toBe(true);
  });

  it("renders Loading slot when generating with no messages", () => {
    mockUseTambo.mockReturnValue({
      messages: [],
      isStreaming: true,
      isIdle: false,
      currentThreadId: "thread-1",
      switchThread: jest.fn(),
      startNewThread: jest.fn().mockReturnValue("new-thread-id"),
    } as never);

    const { container } = render(
      <ThreadContent.Root>
        <ThreadContent.Loading>
          <span>Loading...</span>
        </ThreadContent.Loading>
      </ThreadContent.Root>,
    );

    expect(
      container.querySelector('[data-slot="thread-content-loading"]'),
    ).toBeTruthy();
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("hides Loading slot when not loading", () => {
    const { container } = render(
      <ThreadContent.Root>
        <ThreadContent.Loading>
          <span>Loading...</span>
        </ThreadContent.Loading>
      </ThreadContent.Root>,
    );

    expect(
      container.querySelector('[data-slot="thread-content-loading"]'),
    ).toBeNull();
  });

  it("keeps Loading mounted with keepMounted and sets data-hidden", () => {
    const { container } = render(
      <ThreadContent.Root>
        <ThreadContent.Loading keepMounted>
          <span>Loading...</span>
        </ThreadContent.Loading>
      </ThreadContent.Root>,
    );

    const loadingSlot = container.querySelector(
      '[data-slot="thread-content-loading"]',
    );
    expect(loadingSlot).toBeTruthy();
    expect(loadingSlot?.hasAttribute("data-hidden")).toBe(true);
  });

  it("filters out system messages from Messages render state", () => {
    mockUseTambo.mockReturnValue({
      messages: [
        {
          id: "sys-1",
          role: "system",
          content: [{ type: "text", text: "system prompt" }],
        },
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "hello" }],
        },
      ],
      isStreaming: false,
      isIdle: true,
      currentThreadId: "thread-1",
      switchThread: jest.fn(),
      startNewThread: jest.fn().mockReturnValue("new-thread-id"),
    } as never);

    let capturedState: { messageCount: number } | undefined;
    render(
      <ThreadContent.Root>
        <ThreadContent.Messages
          render={(props, state) => {
            capturedState = state;
            return <div {...props} />;
          }}
        />
      </ThreadContent.Root>,
    );

    expect(capturedState?.messageCount).toBe(1);
  });

  it("filters out standalone tool_result messages from Messages", () => {
    mockUseTambo.mockReturnValue({
      messages: [
        {
          id: "msg-1",
          role: "user",
          content: [{ type: "text", text: "hello" }],
        },
        {
          id: "msg-2",
          role: "user",
          content: [
            { type: "tool_result", tool_use_id: "tool-1", content: "result" },
          ],
        },
      ],
      isStreaming: false,
      isIdle: true,
      currentThreadId: "thread-1",
      switchThread: jest.fn(),
      startNewThread: jest.fn().mockReturnValue("new-thread-id"),
    } as never);

    let capturedState: { messageCount: number } | undefined;
    render(
      <ThreadContent.Root>
        <ThreadContent.Messages
          render={(props, state) => {
            capturedState = state;
            return <div {...props} />;
          }}
        />
      </ThreadContent.Root>,
    );

    expect(capturedState?.messageCount).toBe(1);
  });

  it("exposes isGenerating state on Root render prop", () => {
    mockUseTambo.mockReturnValue({
      messages: [],
      isStreaming: true,
      isIdle: false,
      currentThreadId: "thread-1",
      switchThread: jest.fn(),
      startNewThread: jest.fn().mockReturnValue("new-thread-id"),
    } as never);

    let capturedState: { isGenerating: boolean } | undefined;
    render(
      <ThreadContent.Root
        render={(props, state) => {
          capturedState = state;
          return <div {...props} />;
        }}
      />,
    );

    expect(capturedState?.isGenerating).toBe(true);
  });
});
