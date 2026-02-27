import { describe, expect, it, jest } from "@jest/globals";
import { useTambo } from "@tambo-ai/react";

await jest.unstable_mockModule("@tambo-ai/react/mcp", () => ({
  useTamboMcpPrompt: jest.fn(() => ({ data: null })),
  useTamboMcpPromptList: jest.fn(() => ({ data: [], isLoading: false })),
  useTamboMcpResourceList: jest.fn(() => ({ data: [], isLoading: false })),
  useTamboElicitationContext: jest.fn(() => ({
    elicitation: null,
    resolveElicitation: null,
  })),
}));

const { render, screen } = await import("@testing-library/react");
const { ThreadContent, ThreadContentMessages } =
  await import("./thread-content");

describe("ThreadContent (registry)", () => {
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

  it("exports ThreadContent and ThreadContentMessages", () => {
    expect(ThreadContent).toBeDefined();
    expect(ThreadContentMessages).toBeDefined();
  });

  it("renders with data-slot attribute from base primitive", () => {
    const { container } = render(
      <ThreadContent>
        <span>child</span>
      </ThreadContent>,
    );

    expect(
      container.querySelector('[data-slot="thread-content"]'),
    ).toBeTruthy();
    expect(screen.getByText("child")).toBeTruthy();
  });

  it("renders messages with data-slot attributes", () => {
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
      <ThreadContent>
        <ThreadContentMessages />
      </ThreadContent>,
    );

    expect(
      container.querySelector('[data-slot="thread-content-messages"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-slot="thread-content-item"]'),
    ).toBeTruthy();
  });

  it("does not render thread-content-item when no messages", () => {
    const { container } = render(
      <ThreadContent>
        <ThreadContentMessages />
      </ThreadContent>,
    );

    expect(
      container.querySelector('[data-slot="thread-content-item"]'),
    ).toBeNull();
  });
});
