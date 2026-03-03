import { describe, expect, it, jest } from "@jest/globals";
import { useTamboMcpResourceList } from "@tambo-ai/react/mcp";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { McpResources } from "../index";

function makeResourceEntry(uri: string, name?: string, description?: string) {
  return {
    server: { url: "http://test-server", key: "test" },
    resource: { uri, name, description },
  };
}

describe("McpResources", () => {
  const mockUseTamboMcpResourceList = jest.mocked(useTamboMcpResourceList);

  beforeEach(() => {
    mockUseTamboMcpResourceList.mockReturnValue({
      data: [
        makeResourceEntry("test:file://doc.md", "Documentation", "Main docs"),
        makeResourceEntry("test:file://readme.md", "README"),
      ],
      isLoading: false,
      error: undefined,
    } as never);
  });

  it("renders Root with data-slot attribute when resources are available", () => {
    const { container } = render(
      <McpResources.Root>
        <span>child</span>
      </McpResources.Root>,
    );

    expect(container.querySelector('[data-slot="mcp-resources"]')).toBeTruthy();
    expect(screen.getByText("child")).toBeTruthy();
  });

  it("renders nothing when no resources are available", () => {
    mockUseTamboMcpResourceList.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined,
    } as never);

    const { container } = render(
      <McpResources.Root>
        <span>should not render</span>
      </McpResources.Root>,
    );

    expect(container.querySelector('[data-slot="mcp-resources"]')).toBeNull();
  });

  it("throws when parts are used outside Root", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<McpResources.Trigger />)).toThrow(
      "McpResourcesContext is missing",
    );
    expect(() => render(<McpResources.Search />)).toThrow(
      "McpResourcesContext is missing",
    );
    expect(() => render(<McpResources.List />)).toThrow(
      "McpResourcesContext is missing",
    );
    expect(() => render(<McpResources.Item uri="test:file://x" />)).toThrow(
      "McpResourcesContext is missing",
    );
    spy.mockRestore();
  });

  it("renders trigger with data-slot attribute", () => {
    const { container } = render(
      <McpResources.Root>
        <McpResources.Trigger>Open</McpResources.Trigger>
      </McpResources.Root>,
    );

    expect(
      container.querySelector('[data-slot="mcp-resources-trigger"]'),
    ).toBeTruthy();
  });

  it("renders list with resource data via render prop", () => {
    let capturedState: { resourceCount: number } | undefined;

    render(
      <McpResources.Root>
        <McpResources.List
          render={(props, state) => {
            capturedState = state;
            return <div {...props} />;
          }}
        />
      </McpResources.Root>,
    );

    expect(capturedState?.resourceCount).toBe(2);
  });

  it("renders search input that updates search value", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <McpResources.Root>
        <McpResources.Search placeholder="Search resources..." />
      </McpResources.Root>,
    );

    const searchInput = screen.getByPlaceholderText("Search resources...");
    expect(searchInput).toBeTruthy();

    await user.type(searchInput, "doc");
    expect((searchInput as HTMLInputElement).value).toBe("doc");

    // Advance past the 150ms debounce so the hook receives the search value
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(mockUseTamboMcpResourceList).toHaveBeenCalledWith("doc");

    jest.useRealTimers();
  });

  it("calls onSelectResource when item is clicked", async () => {
    const onSelectResource = jest.fn();
    const user = userEvent.setup();

    render(
      <McpResources.Root onSelectResource={onSelectResource}>
        <McpResources.Item uri="test:file://doc.md" name="Documentation">
          Doc
        </McpResources.Item>
      </McpResources.Root>,
    );

    await user.click(screen.getByText("Doc"));
    expect(onSelectResource).toHaveBeenCalledWith(
      "test:file://doc.md",
      "Documentation",
    );
  });

  it("uses URI as label when name is not provided", async () => {
    const onSelectResource = jest.fn();
    const user = userEvent.setup();

    render(
      <McpResources.Root onSelectResource={onSelectResource}>
        <McpResources.Item uri="test:file://readme.md">
          Readme
        </McpResources.Item>
      </McpResources.Root>,
    );

    await user.click(screen.getByText("Readme"));
    expect(onSelectResource).toHaveBeenCalledWith(
      "test:file://readme.md",
      "test:file://readme.md",
    );
  });

  it("exposes item state via render prop", () => {
    let capturedState:
      | {
          uri: string;
          name: string | undefined;
          description: string | undefined;
        }
      | undefined;

    render(
      <McpResources.Root>
        <McpResources.Item
          uri="test:file://doc.md"
          name="Documentation"
          description="Main docs"
          render={(props, state) => {
            capturedState = state;
            return <button {...props} />;
          }}
        />
      </McpResources.Root>,
    );

    expect(capturedState?.uri).toBe("test:file://doc.md");
    expect(capturedState?.name).toBe("Documentation");
    expect(capturedState?.description).toBe("Main docs");
  });
});
