import { act, render, renderHook, screen } from "@testing-library/react";
import React from "react";
import { z } from "zod/v3";
import { withTamboInteractable } from "../../hoc/with-tambo-interactable";
import { useTamboInteractable } from "../../providers/tambo-interactable-provider";
import { useTamboContextHelpers } from "../../providers/tambo-context-helpers-provider";
import {
  TamboRegistryContext,
  type TamboRegistryContext as TamboRegistryContextType,
} from "../../providers/tambo-registry-provider";
import { TamboContextHelpersProvider } from "../../providers/tambo-context-helpers-provider";
import { TamboInteractableProvider } from "../../providers/tambo-interactable-provider";

// Minimal registry mock that captures registered tools
function createMockRegistry() {
  const toolRegistry: Record<string, unknown> = {};
  return {
    value: {
      componentList: {},
      toolRegistry,
      componentToolAssociations: {},
      mcpServerInfos: [],
      resources: [],
      resourceSource: null,
      onCallUnregisteredTool: undefined,
      registerComponent: jest.fn(),
      registerTool: jest.fn((tool: { name: string }) => {
        toolRegistry[tool.name] = tool;
      }),
      registerTools: jest.fn(),
      addToolAssociation: jest.fn(),
      registerMcpServer: jest.fn(),
      registerMcpServers: jest.fn(),
      registerResource: jest.fn(),
      registerResources: jest.fn(),
      registerResourceSource: jest.fn(),
    } as unknown as TamboRegistryContextType,
    getRegisteredToolNames: () => Object.keys(toolRegistry),
  };
}

/**
 * Wrapper that provides the minimal provider tree for interactables:
 * TamboRegistryContext > TamboContextHelpersProvider > TamboInteractableProvider
 */
function V1InteractableWrapper({
  children,
  registry,
}: {
  children: React.ReactNode;
  registry: TamboRegistryContextType;
}) {
  return (
    <TamboRegistryContext.Provider value={registry}>
      <TamboContextHelpersProvider>
        <TamboInteractableProvider>{children}</TamboInteractableProvider>
      </TamboContextHelpersProvider>
    </TamboRegistryContext.Provider>
  );
}

describe("V1 Interactables Integration", () => {
  it("registers update_component_props and update_component_state tools when an interactable is added", () => {
    const mockRegistry = createMockRegistry();

    const { result } = renderHook(() => useTamboInteractable(), {
      wrapper: ({ children }) => (
        <V1InteractableWrapper registry={mockRegistry.value}>
          {children}
        </V1InteractableWrapper>
      ),
    });

    act(() => {
      result.current.addInteractableComponent({
        name: "TestWidget",
        description: "A test widget",
        component: () => <div>widget</div>,
        props: { label: "hello" },
        propsSchema: z.object({ label: z.string() }),
      });
    });

    const toolNames = mockRegistry.getRegisteredToolNames();
    expect(
      toolNames.some((n) => n.startsWith("update_component_props_TestWidget")),
    ).toBe(true);
    expect(
      toolNames.some((n) => n.startsWith("update_component_state_TestWidget")),
    ).toBe(true);
  });

  it("registers interactables context helper that includes component info", async () => {
    const mockRegistry = createMockRegistry();

    const { result } = renderHook(
      () => ({
        interactable: useTamboInteractable(),
        helpers: useTamboContextHelpers(),
      }),
      {
        wrapper: ({ children }) => (
          <V1InteractableWrapper registry={mockRegistry.value}>
            {children}
          </V1InteractableWrapper>
        ),
      },
    );

    // Add an interactable component
    act(() => {
      result.current.interactable.addInteractableComponent({
        name: "InfoCard",
        description: "An info card",
        component: () => <div>card</div>,
        props: { title: "Test" },
      });
    });

    // Get additional context - should include interactable info
    const contexts = await act(async () => {
      return await result.current.helpers.getAdditionalContext();
    });

    const interactablesContext = contexts.find(
      (c) => c.name === "interactables",
    );
    expect(interactablesContext).toBeDefined();
    expect(interactablesContext?.context).toBeDefined();
  });

  it("renders an interactable component via withTamboInteractable HOC", () => {
    const mockRegistry = createMockRegistry();

    interface CardProps {
      title: string;
    }

    const Card: React.FC<CardProps> = ({ title }) => (
      <div data-testid="card-title">{title}</div>
    );

    const InteractableCard = withTamboInteractable(Card, {
      componentName: "Card",
      description: "A card component",
      propsSchema: z.object({ title: z.string() }),
    });

    render(
      <V1InteractableWrapper registry={mockRegistry.value}>
        <InteractableCard title="Hello V1" />
      </V1InteractableWrapper>,
    );

    expect(screen.getByTestId("card-title")).toHaveTextContent("Hello V1");
  });

  it("updates component props via the interactable provider", () => {
    const mockRegistry = createMockRegistry();

    interface CounterProps {
      count: number;
    }

    const Counter: React.FC<CounterProps> = ({ count }) => (
      <div data-testid="count">{count}</div>
    );

    const InteractableCounter = withTamboInteractable(Counter, {
      componentName: "Counter",
      description: "A counter",
      propsSchema: z.object({ count: z.number() }),
    });

    // Inner component that triggers prop updates
    function TestHarness() {
      const { interactableComponents, updateInteractableComponentProps } =
        useTamboInteractable();
      const component = interactableComponents[0];

      return (
        <div>
          <InteractableCounter count={0} />
          {component && (
            <button
              data-testid="update-btn"
              onClick={() =>
                updateInteractableComponentProps(component.id, { count: 42 })
              }
            >
              Update
            </button>
          )}
        </div>
      );
    }

    render(
      <V1InteractableWrapper registry={mockRegistry.value}>
        <TestHarness />
      </V1InteractableWrapper>,
    );

    // Initial render
    expect(screen.getByTestId("count")).toHaveTextContent("0");

    // Update props via the interactable provider
    act(() => {
      screen.getByTestId("update-btn").click();
    });

    // The interactable should reflect updated props
    expect(screen.getByTestId("count")).toHaveTextContent("42");
  });
});
