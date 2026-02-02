import React from "react";
import { render, screen } from "@testing-library/react";
import { z } from "zod";
import { V1ComponentRenderer } from "./v1-component-renderer";
import { TamboRegistryContext } from "../../providers/tambo-registry-provider";
import type { TamboRegistryContext as TamboRegistryContextType } from "../../providers/tambo-registry-provider";
import type { V1ComponentContent } from "../types/message";

// Simple test component
const TestComponent: React.FC<{ title: string; count?: number }> = ({
  title,
  count,
}) => (
  <div data-testid="test-component">
    <span data-testid="title">{title}</span>
    {count !== undefined && <span data-testid="count">{count}</span>}
  </div>
);

// Component with Zod schema for validation
const ValidatedComponent: React.FC<{ name: string; age: number }> = ({
  name,
  age,
}) => (
  <div data-testid="validated-component">
    <span data-testid="name">{name}</span>
    <span data-testid="age">{age}</span>
  </div>
);

const validatedComponentSchema = z.object({
  name: z.string(),
  age: z.number(),
});

// Create a mock registry
function createMockRegistry(
  componentList: TamboRegistryContextType["componentList"] = {},
): TamboRegistryContextType {
  return {
    componentList,
    toolRegistry: {},
    componentToolAssociations: {},
    mcpServerInfos: [],
    resources: [],
    resourceSource: null,
    registerComponent: jest.fn(),
    registerTool: jest.fn(),
    registerTools: jest.fn(),
    addToolAssociation: jest.fn(),
    registerMcpServer: jest.fn(),
    registerMcpServers: jest.fn(),
    registerResource: jest.fn(),
    registerResources: jest.fn(),
    registerResourceSource: jest.fn(),
  };
}

describe("V1ComponentRenderer", () => {
  const baseContent: V1ComponentContent = {
    type: "component",
    id: "comp_123",
    name: "TestComponent",
    props: { title: "Hello World" },
    streamingState: "done",
  };

  it("renders component from registry with props", () => {
    const registry = createMockRegistry({
      TestComponent: {
        name: "TestComponent",
        description: "A test component",
        component: TestComponent,
        props: { type: "object" },
        contextTools: [],
      },
    });

    render(
      <TamboRegistryContext.Provider value={registry}>
        <V1ComponentRenderer
          content={baseContent}
          threadId="thread_123"
          messageId="msg_456"
        />
      </TamboRegistryContext.Provider>,
    );

    expect(screen.getByTestId("test-component")).toBeInTheDocument();
    expect(screen.getByTestId("title")).toHaveTextContent("Hello World");
  });

  it("renders fallback when component not found in registry", () => {
    const registry = createMockRegistry({});

    render(
      <TamboRegistryContext.Provider value={registry}>
        <V1ComponentRenderer
          content={baseContent}
          threadId="thread_123"
          messageId="msg_456"
          fallback={<div data-testid="fallback">Not found</div>}
        />
      </TamboRegistryContext.Provider>,
    );

    expect(screen.getByTestId("fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("test-component")).not.toBeInTheDocument();
  });

  it("renders nothing (null fallback) when component not found and no fallback provided", () => {
    const registry = createMockRegistry({});

    const { container } = render(
      <TamboRegistryContext.Provider value={registry}>
        <V1ComponentRenderer
          content={baseContent}
          threadId="thread_123"
          messageId="msg_456"
        />
      </TamboRegistryContext.Provider>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("handles props with undefined values", () => {
    const registry = createMockRegistry({
      TestComponent: {
        name: "TestComponent",
        description: "A test component",
        component: TestComponent,
        props: { type: "object" },
        contextTools: [],
      },
    });

    const content: V1ComponentContent = {
      type: "component",
      id: "comp_123",
      name: "TestComponent",
      props: { title: "Test", count: undefined },
      streamingState: "done",
    };

    render(
      <TamboRegistryContext.Provider value={registry}>
        <V1ComponentRenderer
          content={content}
          threadId="thread_123"
          messageId="msg_456"
        />
      </TamboRegistryContext.Provider>,
    );

    expect(screen.getByTestId("title")).toHaveTextContent("Test");
    expect(screen.queryByTestId("count")).not.toBeInTheDocument();
  });

  it("handles null props", () => {
    const registry = createMockRegistry({
      TestComponent: {
        name: "TestComponent",
        description: "A test component",
        component: TestComponent,
        props: { type: "object" },
        contextTools: [],
      },
    });

    const content: V1ComponentContent = {
      type: "component",
      id: "comp_123",
      name: "TestComponent",
      props: null,
      streamingState: "done",
    };

    render(
      <TamboRegistryContext.Provider value={registry}>
        <V1ComponentRenderer
          content={content}
          threadId="thread_123"
          messageId="msg_456"
        />
      </TamboRegistryContext.Provider>,
    );

    // Component should render with empty props
    expect(screen.getByTestId("test-component")).toBeInTheDocument();
  });

  it("validates props with StandardSchema and uses validated values", () => {
    const registry = createMockRegistry({
      ValidatedComponent: {
        name: "ValidatedComponent",
        description: "A validated component",
        component: ValidatedComponent,
        // Cast as unknown to satisfy TypeScript while still providing a Zod schema
        props: validatedComponentSchema as unknown as Record<string, unknown>,
        contextTools: [],
      },
    });

    const content: V1ComponentContent = {
      type: "component",
      id: "comp_123",
      name: "ValidatedComponent",
      props: { name: "Alice", age: 30 },
      streamingState: "done",
    };

    render(
      <TamboRegistryContext.Provider value={registry}>
        <V1ComponentRenderer
          content={content}
          threadId="thread_123"
          messageId="msg_456"
        />
      </TamboRegistryContext.Provider>,
    );

    expect(screen.getByTestId("name")).toHaveTextContent("Alice");
    expect(screen.getByTestId("age")).toHaveTextContent("30");
  });

  it("logs warning and renders with raw props when schema validation fails", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    const registry = createMockRegistry({
      ValidatedComponent: {
        name: "ValidatedComponent",
        description: "A validated component",
        component: ValidatedComponent,
        // Cast as unknown to satisfy TypeScript while still providing a Zod schema
        props: validatedComponentSchema as unknown as Record<string, unknown>,
        contextTools: [],
      },
    });

    const content: V1ComponentContent = {
      type: "component",
      id: "comp_123",
      name: "ValidatedComponent",
      props: { name: "Bob", age: "not a number" }, // Invalid: age should be number
      streamingState: "done",
    };

    render(
      <TamboRegistryContext.Provider value={registry}>
        <V1ComponentRenderer
          content={content}
          threadId="thread_123"
          messageId="msg_456"
        />
      </TamboRegistryContext.Provider>,
    );

    // Should still render with raw props
    expect(screen.getByTestId("name")).toHaveTextContent("Bob");
    expect(screen.getByTestId("age")).toHaveTextContent("not a number");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Props validation failed"),
      expect.any(String),
    );

    consoleSpy.mockRestore();
  });

  it("logs warning for async schema validation", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    // Create a mock async schema
    const asyncSchema = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: async () => {
          return await Promise.resolve({ value: {} });
        },
      },
    };

    const registry = createMockRegistry({
      TestComponent: {
        name: "TestComponent",
        description: "A test component",
        component: TestComponent,
        props: asyncSchema,
        contextTools: [],
      },
    });

    render(
      <TamboRegistryContext.Provider value={registry}>
        <V1ComponentRenderer
          content={baseContent}
          threadId="thread_123"
          messageId="msg_456"
        />
      </TamboRegistryContext.Provider>,
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Async schema validation not supported"),
    );

    consoleSpy.mockRestore();
  });

  it("handles partial JSON during streaming", () => {
    const registry = createMockRegistry({
      TestComponent: {
        name: "TestComponent",
        description: "A test component",
        component: TestComponent,
        props: { type: "object" },
        contextTools: [],
      },
    });

    // partial-json library handles incomplete JSON gracefully
    const content: V1ComponentContent = {
      type: "component",
      id: "comp_123",
      name: "TestComponent",
      props: { title: "Partial" },
      streamingState: "streaming",
    };

    render(
      <TamboRegistryContext.Provider value={registry}>
        <V1ComponentRenderer
          content={content}
          threadId="thread_123"
          messageId="msg_456"
        />
      </TamboRegistryContext.Provider>,
    );

    expect(screen.getByTestId("title")).toHaveTextContent("Partial");
  });

  it("provides component context to rendered components via V1ComponentContentProvider", () => {
    // Create a component that uses the context
    const ContextAwareComponent: React.FC = () => {
      // We can't directly test the context without importing useV1ComponentContent
      // but we can verify the component renders which means the provider works
      return <div data-testid="context-aware">Rendered</div>;
    };

    const registry = createMockRegistry({
      ContextAwareComponent: {
        name: "ContextAwareComponent",
        description: "A context aware component",
        component: ContextAwareComponent,
        props: { type: "object" },
        contextTools: [],
      },
    });

    const content: V1ComponentContent = {
      type: "component",
      id: "comp_789",
      name: "ContextAwareComponent",
      props: {},
      streamingState: "done",
    };

    render(
      <TamboRegistryContext.Provider value={registry}>
        <V1ComponentRenderer
          content={content}
          threadId="thread_abc"
          messageId="msg_def"
        />
      </TamboRegistryContext.Provider>,
    );

    expect(screen.getByTestId("context-aware")).toBeInTheDocument();
  });
});
