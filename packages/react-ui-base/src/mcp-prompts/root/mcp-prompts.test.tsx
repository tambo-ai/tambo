import { describe, expect, it, jest } from "@jest/globals";
import { useTamboMcpPrompt, useTamboMcpPromptList } from "@tambo-ai/react/mcp";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { McpPrompts } from "../index";

function makePromptEntry(name: string, description?: string) {
  return {
    server: { url: "http://test-server", key: "test" },
    prompt: { name, description },
  };
}

describe("McpPrompts", () => {
  const mockUseTamboMcpPromptList = jest.mocked(useTamboMcpPromptList);
  const mockUseTamboMcpPrompt = jest.mocked(useTamboMcpPrompt);

  beforeEach(() => {
    mockUseTamboMcpPromptList.mockReturnValue({
      data: [
        makePromptEntry("test:greeting", "A greeting prompt"),
        makePromptEntry("test:farewell", "A farewell prompt"),
      ],
      isLoading: false,
      error: undefined,
    } as never);

    mockUseTamboMcpPrompt.mockReturnValue({
      data: undefined,
      error: undefined,
    } as never);
  });

  it("renders Root with data-slot attribute when prompts are available", () => {
    const { container } = render(
      <McpPrompts.Root>
        <span>child</span>
      </McpPrompts.Root>,
    );

    expect(container.querySelector('[data-slot="mcp-prompts"]')).toBeTruthy();
    expect(screen.getByText("child")).toBeTruthy();
  });

  it("renders nothing when no prompts are available", () => {
    mockUseTamboMcpPromptList.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined,
    } as never);

    const { container } = render(
      <McpPrompts.Root>
        <span>should not render</span>
      </McpPrompts.Root>,
    );

    expect(container.querySelector('[data-slot="mcp-prompts"]')).toBeNull();
  });

  it("throws when parts are used outside Root", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<McpPrompts.Trigger />)).toThrow(
      "McpPromptsContext is missing",
    );
    expect(() => render(<McpPrompts.List />)).toThrow(
      "McpPromptsContext is missing",
    );
    expect(() => render(<McpPrompts.Item name="test" />)).toThrow(
      "McpPromptsContext is missing",
    );
    expect(() => render(<McpPrompts.Error />)).toThrow(
      "McpPromptsContext is missing",
    );
    spy.mockRestore();
  });

  it("renders trigger with data-slot attribute", () => {
    const { container } = render(
      <McpPrompts.Root>
        <McpPrompts.Trigger>Open</McpPrompts.Trigger>
      </McpPrompts.Root>,
    );

    expect(
      container.querySelector('[data-slot="mcp-prompts-trigger"]'),
    ).toBeTruthy();
  });

  it("renders list with prompt data via render prop", () => {
    let capturedState: { promptCount: number } | undefined;

    render(
      <McpPrompts.Root>
        <McpPrompts.List
          render={(props, state) => {
            capturedState = state;
            return <div {...props} />;
          }}
        />
      </McpPrompts.Root>,
    );

    expect(capturedState?.promptCount).toBe(2);
  });

  it("calls select when item is clicked", async () => {
    const user = userEvent.setup();

    render(
      <McpPrompts.Root>
        <McpPrompts.Item name="test:greeting">Greeting</McpPrompts.Item>
      </McpPrompts.Root>,
    );

    await user.click(screen.getByText("Greeting"));

    // Verify useTamboMcpPrompt was called with the selected name
    // The effect that processes the prompt data would be triggered
    expect(mockUseTamboMcpPrompt).toHaveBeenCalledWith("test:greeting");
  });

  it("marks selected item with data-selected attribute", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <McpPrompts.Root>
        <McpPrompts.Item name="test:greeting">Greeting</McpPrompts.Item>
      </McpPrompts.Root>,
    );

    await user.click(screen.getByText("Greeting"));

    const item = container.querySelector('[data-slot="mcp-prompts-item"]');
    expect(item?.hasAttribute("data-selected")).toBe(true);
  });

  it("calls onInsertText when prompt data is valid", () => {
    const onInsertText = jest.fn();

    mockUseTamboMcpPrompt.mockReturnValue({
      data: {
        messages: [{ content: { type: "text", text: "Hello world" } }],
      },
      error: undefined,
    } as never);

    // Render with a selected prompt to trigger the effect
    const TestComponent = () => {
      const [, setRenderCount] = React.useState(0);
      return (
        <McpPrompts.Root onInsertText={onInsertText}>
          <McpPrompts.Item
            name="test:greeting"
            render={<button onClick={() => setRenderCount((c) => c + 1)} />}
          >
            Greeting
          </McpPrompts.Item>
        </McpPrompts.Root>
      );
    };

    render(<TestComponent />);

    // Click to select and trigger prompt fetch
    act(() => {
      screen.getByText("Greeting").click();
    });

    expect(onInsertText).toHaveBeenCalledWith("Hello world");
  });

  it("shows error state when prompt data is invalid", () => {
    mockUseTamboMcpPrompt.mockReturnValue({
      data: { invalid: true },
      error: undefined,
    } as never);

    let capturedState: { error: string | null } | undefined;

    const TestComponent = () => (
      <McpPrompts.Root>
        <McpPrompts.Item name="test:greeting">Greeting</McpPrompts.Item>
        <McpPrompts.Error
          render={(props, state) => {
            capturedState = state;
            return <div {...props}>{state.error}</div>;
          }}
        />
      </McpPrompts.Root>
    );

    render(<TestComponent />);

    act(() => {
      screen.getByText("Greeting").click();
    });

    expect(capturedState?.error).toBe("Invalid prompt format received");
  });

  it("shows error state when fetch fails", () => {
    mockUseTamboMcpPrompt.mockReturnValue({
      data: undefined,
      error: new Error("Network error"),
    } as never);

    let capturedState: { error: string | null } | undefined;

    const TestComponent = () => (
      <McpPrompts.Root>
        <McpPrompts.Item name="test:greeting">Greeting</McpPrompts.Item>
        <McpPrompts.Error
          render={(props, state) => {
            capturedState = state;
            return <div {...props}>{state.error}</div>;
          }}
        />
      </McpPrompts.Root>
    );

    render(<TestComponent />);

    act(() => {
      screen.getByText("Greeting").click();
    });

    expect(capturedState?.error).toBe("Failed to load prompt");
  });
});
