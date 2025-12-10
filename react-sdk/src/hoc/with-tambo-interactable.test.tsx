import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { z } from "zod/v3";
import { useTamboCurrentComponent } from "../hooks/use-current-message";
import { TamboInteractableProvider } from "../providers/tambo-interactable-provider";
import { withTamboInteractable } from "./with-tambo-interactable";

// Create a consistent mock implementation
const mockAddInteractableComponent = jest.fn(() => "mock-id-123");
const mockUpdateInteractableComponentProps = jest.fn();
const mockGetInteractableComponent = jest.fn(() => null);
const mockRemoveInteractableComponent = jest.fn();
const mockGetInteractableComponentsByName = jest.fn(() => []);
const mockClearAllInteractableComponents = jest.fn();

// Mock the interactable provider
jest.mock("../providers/tambo-interactable-provider", () => ({
  TamboInteractableProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="interactable-provider">{children}</div>
  ),
  useTamboInteractable: () => ({
    addInteractableComponent: mockAddInteractableComponent,
    updateInteractableComponentProps: mockUpdateInteractableComponentProps,
    getInteractableComponent: mockGetInteractableComponent,
    removeInteractableComponent: mockRemoveInteractableComponent,
    getInteractableComponentsByName: mockGetInteractableComponentsByName,
    clearAllInteractableComponents: mockClearAllInteractableComponents,
    interactableComponents: [],
  }),
}));

describe("withTamboInteractable", () => {
  // Simple test component
  interface TestComponentProps {
    title: string;
    count?: number;
  }

  const TestComponent: React.FC<TestComponentProps> = ({ title, count }) => (
    <div>
      <h1 data-testid="title">{title}</h1>
      {count !== undefined && <span data-testid="count">{count}</span>}
    </div>
  );

  const testSchema = z.object({
    title: z.string(),
    count: z.number().optional(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockAddInteractableComponent.mockReturnValue("mock-id-123");
    mockGetInteractableComponent.mockReturnValue(null);
    mockGetInteractableComponentsByName.mockReturnValue([]);
  });

  it("should render the wrapped component with provided props", () => {
    const InteractableComponent = withTamboInteractable(TestComponent, {
      componentName: "TestComponent",
      description: "A test component",
      propsSchema: testSchema,
    });

    render(
      <TamboInteractableProvider>
        <InteractableComponent title="Hello" count={42} />
      </TamboInteractableProvider>,
    );

    expect(screen.getByTestId("title")).toHaveTextContent("Hello");
    expect(screen.getByTestId("count")).toHaveTextContent("42");
  });

  it("should set displayName correctly", () => {
    const InteractableComponent = withTamboInteractable(TestComponent, {
      componentName: "TestComponent",
      description: "A test component",
    });

    expect(InteractableComponent.displayName).toBe(
      "withTamboInteractable(TestComponent)",
    );
  });

  it("should handle components without displayName", () => {
    const AnonymousComponent = () => <div>Anonymous</div>;

    const InteractableComponent = withTamboInteractable(AnonymousComponent, {
      componentName: "AnonymousComponent",
      description: "An anonymous component",
    });

    // Anonymous components get their name from the function name
    expect(InteractableComponent.displayName).toBe(
      "withTamboInteractable(AnonymousComponent)",
    );
  });

  it("should provide TamboMessageProvider with interactable metadata", async () => {
    // Child component that uses the context
    const ContextConsumer = () => {
      const component = useTamboCurrentComponent();
      return (
        <div>
          <span data-testid="interactable-id">{component?.interactableId}</span>
          <span data-testid="component-name">{component?.componentName}</span>
          <span data-testid="description">{component?.description}</span>
        </div>
      );
    };

    // Wrap TestComponent to include ContextConsumer
    const TestComponentWithConsumer: React.FC<TestComponentProps> = (props) => (
      <div>
        <TestComponent {...props} />
        <ContextConsumer />
      </div>
    );

    const InteractableWithConsumer = withTamboInteractable(
      TestComponentWithConsumer,
      {
        componentName: "TestComponent",
        description: "A test component",
        propsSchema: testSchema,
      },
    );

    render(
      <TamboInteractableProvider>
        <InteractableWithConsumer title="Hello" />
      </TamboInteractableProvider>,
    );

    // Wait for the component to register and render
    await waitFor(() => {
      expect(screen.getByTestId("interactable-id")).toHaveTextContent(
        "mock-id-123",
      );
    });

    expect(screen.getByTestId("component-name")).toHaveTextContent(
      "TestComponent",
    );
    expect(screen.getByTestId("description")).toHaveTextContent(
      "A test component",
    );
  });

  it("should create minimal message with correct structure", async () => {
    // Child component that checks the message structure
    const MessageChecker = () => {
      const component = useTamboCurrentComponent();
      return (
        <div>
          <span data-testid="has-component-name">
            {component?.componentName ? "yes" : "no"}
          </span>
          <span data-testid="has-props">{component?.props ? "yes" : "no"}</span>
          <span data-testid="has-interactable-id">
            {component?.interactableId ? "yes" : "no"}
          </span>
          <span data-testid="has-description">
            {component?.description ? "yes" : "no"}
          </span>
        </div>
      );
    };

    const TestComponentWithChecker: React.FC<TestComponentProps> = (props) => (
      <div>
        <TestComponent {...props} />
        <MessageChecker />
      </div>
    );

    const InteractableWithChecker = withTamboInteractable(
      TestComponentWithChecker,
      {
        componentName: "TestComponent",
        description: "A test component",
        propsSchema: testSchema,
      },
    );

    render(
      <TamboInteractableProvider>
        <InteractableWithChecker title="Hello" count={42} />
      </TamboInteractableProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("has-component-name")).toHaveTextContent("yes");
    });

    expect(screen.getByTestId("has-props")).toHaveTextContent("yes");
    expect(screen.getByTestId("has-interactable-id")).toHaveTextContent("yes");
    expect(screen.getByTestId("has-description")).toHaveTextContent("yes");
  });

  it("should pass through all component props correctly", () => {
    const InteractableComponent = withTamboInteractable(TestComponent, {
      componentName: "TestComponent",
      description: "A test component",
      propsSchema: testSchema,
    });

    render(
      <TamboInteractableProvider>
        <InteractableComponent title="Test Title" count={100} />
      </TamboInteractableProvider>,
    );

    expect(screen.getByTestId("title")).toHaveTextContent("Test Title");
    expect(screen.getByTestId("count")).toHaveTextContent("100");
  });

  it("should filter out interactable-specific props from component props", () => {
    interface ExtendedProps extends TestComponentProps {
      onInteractableReady?: (id: string) => void;
      onPropsUpdate?: (props: Record<string, any>) => void;
    }

    const ExtendedComponent: React.FC<ExtendedProps> = ({
      title,
      onInteractableReady,
      onPropsUpdate,
    }) => (
      <div>
        <span data-testid="title">{title}</span>
        <span data-testid="has-ready">
          {onInteractableReady ? "yes" : "no"}
        </span>
        <span data-testid="has-update">{onPropsUpdate ? "yes" : "no"}</span>
      </div>
    );

    const InteractableComponent = withTamboInteractable(ExtendedComponent, {
      componentName: "ExtendedComponent",
      description: "An extended component",
    });

    const mockReady = jest.fn();
    const mockUpdate = jest.fn();

    render(
      <TamboInteractableProvider>
        <InteractableComponent
          title="Test"
          onInteractableReady={mockReady}
          onPropsUpdate={mockUpdate}
        />
      </TamboInteractableProvider>,
    );

    expect(screen.getByTestId("title")).toHaveTextContent("Test");
    // These props should be filtered out
    expect(screen.getByTestId("has-ready")).toHaveTextContent("no");
    expect(screen.getByTestId("has-update")).toHaveTextContent("no");
  });

  it("should work without propsSchema", () => {
    const InteractableComponent = withTamboInteractable(TestComponent, {
      componentName: "TestComponent",
      description: "A test component",
    });

    render(
      <TamboInteractableProvider>
        <InteractableComponent title="No Schema" />
      </TamboInteractableProvider>,
    );

    expect(screen.getByTestId("title")).toHaveTextContent("No Schema");
  });

  it("should render before interactable ID is set", () => {
    const InteractableComponent = withTamboInteractable(TestComponent, {
      componentName: "TestComponent",
      description: "A test component",
    });

    const { container } = render(
      <TamboInteractableProvider>
        <InteractableComponent title="Early Render" />
      </TamboInteractableProvider>,
    );

    // Component should render even before ID is available
    expect(
      container.querySelector('[data-testid="title"]'),
    ).toBeInTheDocument();
  });

  it("should handle null/undefined values in props", () => {
    interface NullableProps {
      title: string;
      optional?: string;
      nullable: string | null;
    }

    const NullableComponent: React.FC<NullableProps> = ({
      title,
      optional,
      nullable,
    }) => (
      <div>
        <span data-testid="title">{title}</span>
        <span data-testid="optional">{optional ?? "undefined"}</span>
        <span data-testid="nullable">{nullable ?? "null"}</span>
      </div>
    );

    const InteractableComponent = withTamboInteractable(NullableComponent, {
      componentName: "NullableComponent",
      description: "A component with nullable props",
    });

    render(
      <TamboInteractableProvider>
        <InteractableComponent title="Test" nullable={null} />
      </TamboInteractableProvider>,
    );

    expect(screen.getByTestId("title")).toHaveTextContent("Test");
    expect(screen.getByTestId("optional")).toHaveTextContent("undefined");
    expect(screen.getByTestId("nullable")).toHaveTextContent("null");
  });
});
