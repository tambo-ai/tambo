import { useTamboRegistry } from "@tambo-ai/react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Mock } from "vitest";
import { TamboDevtools } from "./tambo-devtools";

vi.mock("@tambo-ai/react", () => ({
  useTamboRegistry: vi.fn(),
}));

const mockUseTamboRegistry = useTamboRegistry as unknown as Mock;

const defaultRegistry = {
  __initialized: true,
  componentList: {},
  toolRegistry: {},
  componentToolAssociations: {},
  mcpServerInfos: [],
  resources: [],
  resourceSource: null,
  registerComponent: vi.fn(),
  registerTool: vi.fn(),
  registerTools: vi.fn(),
  addToolAssociation: vi.fn(),
  registerMcpServer: vi.fn(),
  registerMcpServers: vi.fn(),
  registerResource: vi.fn(),
  registerResources: vi.fn(),
  registerResourceSource: vi.fn(),
};

const registryWithComponents = {
  ...defaultRegistry,
  componentList: {
    WeatherCard: {
      name: "WeatherCard",
      description: "Shows weather data",
      component: () => null,
      props: { type: "object" },
      contextTools: [],
    },
    CardComponent: {
      name: "CardComponent",
      description: "A generic card",
      component: () => null,
      props: { type: "object" },
      contextTools: [],
    },
  },
  componentToolAssociations: {
    WeatherCard: ["getWeather"],
  },
};

const registryWithTools = {
  ...defaultRegistry,
  toolRegistry: {
    searchTool: {
      name: "searchTool",
      description: "Searches the web",
      tool: async () => "result",
      inputSchema: { type: "object" },
    },
  },
};

beforeEach(() => {
  localStorage.clear();
  document
    .querySelectorAll("[data-tambo-devtools-portal]")
    .forEach((el) => el.remove());
  mockUseTamboRegistry.mockReturnValue({ ...defaultRegistry });
  // Reset any color-scheme set by tests
  document.documentElement.style.colorScheme = "";
});

describe("TamboDevtools", () => {
  it("renders trigger button", () => {
    render(<TamboDevtools />);

    const trigger = screen.getByRole("button", {
      name: "Toggle Tambo DevTools",
    });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("applies tdt-light class by default (matchMedia returns false)", () => {
    render(<TamboDevtools />);

    const trigger = screen.getByRole("button", {
      name: "Toggle Tambo DevTools",
    });
    expect(trigger).toHaveClass("tdt-light");
    expect(trigger).toHaveAttribute("data-tdt", "");
  });

  it("applies tdt-dark class when theme is dark", () => {
    render(<TamboDevtools theme="dark" />);

    const trigger = screen.getByRole("button", {
      name: "Toggle Tambo DevTools",
    });
    expect(trigger).toHaveClass("tdt-dark");
  });

  it("applies tdt-light class when theme is light", () => {
    render(<TamboDevtools theme="light" />);

    const trigger = screen.getByRole("button", {
      name: "Toggle Tambo DevTools",
    });
    expect(trigger).toHaveClass("tdt-light");
  });

  it("reads color-scheme from html style attribute", () => {
    document.documentElement.style.colorScheme = "dark";

    render(<TamboDevtools />);

    const trigger = screen.getByRole("button", {
      name: "Toggle Tambo DevTools",
    });
    expect(trigger).toHaveClass("tdt-dark");
  });

  it("theme prop takes precedence over html color-scheme", () => {
    document.documentElement.style.colorScheme = "dark";

    render(<TamboDevtools theme="light" />);

    const trigger = screen.getByRole("button", {
      name: "Toggle Tambo DevTools",
    });
    expect(trigger).toHaveClass("tdt-light");
  });

  it("applies theme class and data-tdt to panel dialog", () => {
    render(<TamboDevtools theme="dark" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("tdt-dark");
    expect(dialog).toHaveAttribute("data-tdt", "");
  });

  it("opens panel when trigger is clicked", () => {
    render(<TamboDevtools />);

    const trigger = screen.getByRole("button", {
      name: "Toggle Tambo DevTools",
    });
    fireEvent.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Components/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Tools/ })).toBeInTheDocument();
  });

  it("shows empty state with docs link when no components registered", () => {
    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    expect(screen.getByText("No components registered")).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: "Read the docs to get started",
    });
    expect(link).toHaveAttribute(
      "href",
      "https://docs.tambo.co/docs/guides/enable-generative-ui/register-components",
    );
  });

  it("shows empty state with docs link when no tools registered", () => {
    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    fireEvent.click(screen.getByRole("tab", { name: /Tools/ }));

    expect(screen.getByText("No tools registered")).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: "Read the docs to get started",
    });
    expect(link).toHaveAttribute(
      "href",
      "https://docs.tambo.co/docs/guides/enable-generative-ui/register-interactables",
    );
  });

  it("displays registered components in sidebar", () => {
    mockUseTamboRegistry.mockReturnValue(registryWithComponents);

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    expect(screen.getByText("WeatherCard")).toBeInTheDocument();
    expect(screen.getByText("CardComponent")).toBeInTheDocument();
  });

  it("shows detail view when component is selected", () => {
    mockUseTamboRegistry.mockReturnValue(registryWithComponents);

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    fireEvent.click(screen.getByText("WeatherCard"));

    expect(screen.getByText("Shows weather data")).toBeInTheDocument();
    expect(screen.getByText("getWeather")).toBeInTheDocument();
  });

  it("displays registered tools in sidebar", () => {
    mockUseTamboRegistry.mockReturnValue(registryWithTools);

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );
    fireEvent.click(screen.getByRole("tab", { name: /Tools/ }));

    expect(screen.getByText("searchTool")).toBeInTheDocument();
  });

  it("shows tool detail when selected", () => {
    mockUseTamboRegistry.mockReturnValue(registryWithTools);

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );
    fireEvent.click(screen.getByRole("tab", { name: /Tools/ }));
    fireEvent.click(screen.getByText("searchTool"));

    expect(screen.getByText("Searches the web")).toBeInTheDocument();
  });

  it("shows tab counts", () => {
    mockUseTamboRegistry.mockReturnValue({
      ...defaultRegistry,
      componentList: {
        Card: {
          name: "Card",
          description: "A card",
          component: () => null,
          props: {},
          contextTools: [],
        },
      },
      toolRegistry: {
        tool1: {
          name: "tool1",
          description: "Tool 1",
          tool: async () => "",
          inputSchema: {},
        },
        tool2: {
          name: "tool2",
          description: "Tool 2",
          tool: async () => "",
          inputSchema: {},
        },
      },
    });

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    expect(screen.getByText("(1)")).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();
  });

  it("closes panel with close button", () => {
    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close DevTools" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes panel on Escape key", () => {
    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("throws when rendered outside TamboProvider", () => {
    mockUseTamboRegistry.mockReturnValue({
      ...defaultRegistry,
      __initialized: false,
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TamboDevtools />)).toThrow(
      "TamboDevtools must be rendered inside a TamboProvider",
    );

    consoleSpy.mockRestore();
  });

  it("opens panel when initialOpen is true", () => {
    render(<TamboDevtools initialOpen />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("has proper ARIA attributes on tabs", () => {
    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    const componentsTab = screen.getByRole("tab", { name: /Components/ });
    const toolsTab = screen.getByRole("tab", { name: /Tools/ });

    expect(componentsTab).toHaveAttribute("aria-selected", "true");
    expect(toolsTab).toHaveAttribute("aria-selected", "false");

    fireEvent.click(toolsTab);

    expect(componentsTab).toHaveAttribute("aria-selected", "false");
    expect(toolsTab).toHaveAttribute("aria-selected", "true");
  });

  it("filters sidebar items by search query", () => {
    mockUseTamboRegistry.mockReturnValue(registryWithComponents);

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    const searchInput = screen.getByLabelText("Search registry");
    fireEvent.change(searchInput, { target: { value: "weather" } });

    expect(screen.getByText("WeatherCard")).toBeInTheDocument();
    expect(screen.queryByText("CardComponent")).not.toBeInTheDocument();
  });

  it("shows no-match state when search has no results", () => {
    mockUseTamboRegistry.mockReturnValue(registryWithComponents);

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    const searchInput = screen.getByLabelText("Search registry");
    fireEvent.change(searchInput, { target: { value: "zzzznotfound" } });

    expect(screen.getByText("No matches")).toBeInTheDocument();
  });

  it("clears selection when switching tabs", () => {
    mockUseTamboRegistry.mockReturnValue({
      ...registryWithComponents,
      toolRegistry: registryWithTools.toolRegistry,
    });

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    // Select a component
    fireEvent.click(screen.getByText("WeatherCard"));
    expect(screen.getByText("Shows weather data")).toBeInTheDocument();

    // Switch to tools tab
    fireEvent.click(screen.getByRole("tab", { name: /Tools/ }));

    // Detail should show empty state
    expect(
      screen.getByText("Select an item to view details"),
    ).toBeInTheDocument();
  });

  it("shows empty detail prompt when no item selected", () => {
    mockUseTamboRegistry.mockReturnValue(registryWithComponents);

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    expect(
      screen.getByText("Select an item to view details"),
    ).toBeInTheDocument();
  });

  it("ArrowDown from search focuses first list item", () => {
    mockUseTamboRegistry.mockReturnValue(registryWithComponents);

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    const searchInput = screen.getByLabelText("Search registry");
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });

    // Items are sorted alphabetically: CardComponent, WeatherCard
    const firstOption = screen.getByRole("option", { name: "CardComponent" });
    expect(firstOption).toHaveFocus();
    // ArrowDown focuses but does not select
    expect(firstOption).toHaveAttribute("aria-selected", "false");
  });

  it("Enter from search focuses first list item", () => {
    mockUseTamboRegistry.mockReturnValue(registryWithComponents);

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    const searchInput = screen.getByLabelText("Search registry");
    fireEvent.keyDown(searchInput, { key: "Enter" });

    const firstOption = screen.getByRole("option", { name: "CardComponent" });
    expect(firstOption).toHaveFocus();
  });

  it("ArrowDown/ArrowUp navigates through list items", () => {
    mockUseTamboRegistry.mockReturnValue(registryWithComponents);

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    // Navigate into the list
    const searchInput = screen.getByLabelText("Search registry");
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });

    const firstOption = screen.getByRole("option", { name: "CardComponent" });
    expect(firstOption).toHaveFocus();

    // Move down to second item
    fireEvent.keyDown(firstOption, { key: "ArrowDown" });

    const secondOption = screen.getByRole("option", { name: "WeatherCard" });
    expect(secondOption).toHaveFocus();
    // Arrow keys focus but do not select
    expect(secondOption).toHaveAttribute("aria-selected", "false");

    // Move back up
    fireEvent.keyDown(secondOption, { key: "ArrowUp" });

    expect(firstOption).toHaveFocus();
  });

  it("hover on trigger applies hover style", () => {
    render(<TamboDevtools />);

    const trigger = screen.getByRole("button", {
      name: "Toggle Tambo DevTools",
    });

    fireEvent.mouseEnter(trigger);
    // Trigger should still be rendered (hover doesn't open)
    expect(trigger).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);
    expect(trigger).toBeInTheDocument();
  });

  it("returns focus to trigger when closing via toggle", () => {
    render(<TamboDevtools />);

    const trigger = screen.getByRole("button", {
      name: "Toggle Tambo DevTools",
    });
    fireEvent.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close via the close button (trigger re-appears and gets focus)
    fireEvent.click(screen.getByRole("button", { name: "Close DevTools" }));

    const newTrigger = screen.getByRole("button", {
      name: "Toggle Tambo DevTools",
    });
    expect(newTrigger).toBeInTheDocument();
  });

  it("renders tools with secondary schema labels", () => {
    mockUseTamboRegistry.mockReturnValue({
      ...defaultRegistry,
      toolRegistry: {
        myTool: {
          name: "myTool",
          description: "Does stuff",
          tool: async () => "",
          inputSchema: { type: "object" },
          outputSchema: { type: "string" },
        },
      },
    });

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );
    fireEvent.click(screen.getByRole("tab", { name: /Tools/ }));
    fireEvent.click(screen.getByText("myTool"));

    expect(screen.getByText("Input Schema")).toBeInTheDocument();
    expect(screen.getByText("Output Schema")).toBeInTheDocument();
  });

  it("ArrowDown at last item stays on last item", () => {
    mockUseTamboRegistry.mockReturnValue(registryWithComponents);

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    // Navigate to list and go to last item
    const searchInput = screen.getByLabelText("Search registry");
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });

    const firstOption = screen.getByRole("option", { name: "CardComponent" });
    fireEvent.keyDown(firstOption, { key: "ArrowDown" });

    const lastOption = screen.getByRole("option", { name: "WeatherCard" });
    expect(lastOption).toHaveFocus();

    // ArrowDown again should stay on last item
    fireEvent.keyDown(lastOption, { key: "ArrowDown" });
    expect(lastOption).toHaveFocus();
  });

  it("ArrowUp at first item stays on first item", () => {
    mockUseTamboRegistry.mockReturnValue(registryWithComponents);

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    const searchInput = screen.getByLabelText("Search registry");
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });

    const firstOption = screen.getByRole("option", { name: "CardComponent" });
    expect(firstOption).toHaveFocus();

    // ArrowUp at first item should stay
    fireEvent.keyDown(firstOption, { key: "ArrowUp" });
    expect(firstOption).toHaveFocus();
  });

  it("imperative focus targets selected item when one is selected", () => {
    mockUseTamboRegistry.mockReturnValue(registryWithComponents);

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    // Select WeatherCard
    fireEvent.click(screen.getByText("WeatherCard"));

    // Now press Enter in search to trigger imperative focus on the list
    const searchInput = screen.getByLabelText("Search registry");
    fireEvent.keyDown(searchInput, { key: "Enter" });

    // Should focus the selected item (WeatherCard), not the first one
    const weatherOption = screen.getByRole("option", { name: "WeatherCard" });
    expect(weatherOption).toHaveFocus();
  });

  it("Enter on a list item selects it and shows detail", () => {
    mockUseTamboRegistry.mockReturnValue(registryWithComponents);

    render(<TamboDevtools />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Tambo DevTools" }),
    );

    // Navigate into the list
    const searchInput = screen.getByLabelText("Search registry");
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });

    const firstOption = screen.getByRole("option", { name: "CardComponent" });
    fireEvent.keyDown(firstOption, { key: "ArrowDown" });

    const secondOption = screen.getByRole("option", { name: "WeatherCard" });
    fireEvent.keyDown(secondOption, { key: "Enter" });

    expect(screen.getByText("Shows weather data")).toBeInTheDocument();
  });
});
