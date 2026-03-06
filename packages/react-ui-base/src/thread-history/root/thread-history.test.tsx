import { describe, expect, it, jest } from "@jest/globals";
import { useTambo, useTamboThreadList } from "@tambo-ai/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThreadHistory } from "../index";

function makeThread(id: string) {
  return {
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    runStatus: "idle" as const,
  };
}

describe("ThreadHistory", () => {
  const mockUseTambo = jest.mocked(useTambo);
  const mockUseTamboThreadList = jest.mocked(useTamboThreadList);

  beforeEach(() => {
    mockUseTambo.mockReturnValue({
      switchThread: jest.fn(),
      startNewThread: jest.fn().mockReturnValue("new-thread-id"),
      currentThreadId: "thread-1",
      messages: [],
      isStreaming: false,
      isIdle: true,
    } as never);

    mockUseTamboThreadList.mockReturnValue({
      data: {
        threads: [makeThread("thread-1"), makeThread("thread-2")],
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as never);
  });

  it("renders Root with data-slot attribute", () => {
    const { container } = render(
      <ThreadHistory.Root>
        <span>child</span>
      </ThreadHistory.Root>,
    );

    expect(
      container.querySelector('[data-slot="thread-history"]'),
    ).toBeTruthy();
    expect(screen.getByText("child")).toBeTruthy();
  });

  it("throws when parts are used outside Root", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ThreadHistory.Search />)).toThrow(
      "ThreadHistoryContext is missing",
    );
    spy.mockRestore();
  });

  it("renders search input that updates search query", async () => {
    const user = userEvent.setup();

    render(
      <ThreadHistory.Root>
        <ThreadHistory.Search placeholder="Search..." />
        <ThreadHistory.List />
      </ThreadHistory.Root>,
    );

    const searchInput = screen.getByPlaceholderText("Search...");
    expect(searchInput).toBeTruthy();

    await user.type(searchInput, "thread-1");
    expect((searchInput as HTMLInputElement).value).toBe("thread-1");
  });

  it("calls switchThread when item is clicked", async () => {
    const mockSwitchThread = jest.fn();
    mockUseTambo.mockReturnValue({
      switchThread: mockSwitchThread,
      startNewThread: jest.fn().mockReturnValue("new-thread-id"),
      currentThreadId: "thread-1",
      messages: [],
      isStreaming: false,
      isIdle: true,
    } as never);

    const user = userEvent.setup();

    render(
      <ThreadHistory.Root>
        <ThreadHistory.Item thread={makeThread("thread-2")}>
          Switch to thread 2
        </ThreadHistory.Item>
      </ThreadHistory.Root>,
    );

    await user.click(screen.getByText("Switch to thread 2"));
    expect(mockSwitchThread).toHaveBeenCalledWith("thread-2");
  });

  it("marks active thread item with data-active and aria-current attributes", () => {
    const { container } = render(
      <ThreadHistory.Root>
        <ThreadHistory.Item thread={makeThread("thread-1")}>
          Active
        </ThreadHistory.Item>
        <ThreadHistory.Item thread={makeThread("thread-2")}>
          Inactive
        </ThreadHistory.Item>
      </ThreadHistory.Root>,
    );

    const buttons = container.querySelectorAll(
      '[data-slot="thread-history-item"]',
    );
    expect(buttons[0].hasAttribute("data-active")).toBe(true);
    expect(buttons[0].getAttribute("aria-current")).toBe("true");
    expect(buttons[1].hasAttribute("data-active")).toBe(false);
    expect(buttons[1].hasAttribute("aria-current")).toBe(false);
  });

  it("renders thread name as default children, falling back to id", () => {
    render(
      <ThreadHistory.Root>
        <ThreadHistory.Item
          thread={{ ...makeThread("thread-1"), name: "My Thread" }}
        />
        <ThreadHistory.Item thread={makeThread("thread-2")} />
      </ThreadHistory.Root>,
    );

    expect(screen.getByText("My Thread")).toBeTruthy();
    expect(screen.getByText("thread-2")).toBeTruthy();
  });

  it("calls startNewThread and refetch when new thread button is clicked", async () => {
    const mockStartNewThread = jest.fn().mockReturnValue("new-id");
    const mockRefetch = jest.fn(async () => undefined);

    mockUseTambo.mockReturnValue({
      switchThread: jest.fn(),
      startNewThread: mockStartNewThread,
      currentThreadId: "thread-1",
      messages: [],
      isStreaming: false,
      isIdle: true,
    } as never);

    mockUseTamboThreadList.mockReturnValue({
      data: { threads: [] },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as never);

    const user = userEvent.setup();

    render(
      <ThreadHistory.Root>
        <ThreadHistory.NewThreadButton>New</ThreadHistory.NewThreadButton>
      </ThreadHistory.Root>,
    );

    await user.click(screen.getByText("New"));
    expect(mockStartNewThread).toHaveBeenCalled();
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("exposes list data-slot", () => {
    mockUseTamboThreadList.mockReturnValue({
      data: { threads: [] },
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as never);

    const { container } = render(
      <ThreadHistory.Root>
        <ThreadHistory.List />
      </ThreadHistory.Root>,
    );

    expect(
      container.querySelector('[data-slot="thread-history-list"]'),
    ).toBeTruthy();
  });

  it("invokes onThreadChange callback when switching threads", async () => {
    const onThreadChange = jest.fn();
    const user = userEvent.setup();

    render(
      <ThreadHistory.Root onThreadChange={onThreadChange}>
        <ThreadHistory.Item thread={makeThread("thread-2")}>
          Thread 2
        </ThreadHistory.Item>
      </ThreadHistory.Root>,
    );

    await user.click(screen.getByText("Thread 2"));
    expect(onThreadChange).toHaveBeenCalled();
  });
});
