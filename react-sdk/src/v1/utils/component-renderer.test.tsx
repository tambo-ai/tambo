// React import needed for JSX transform (jsxImportSource is not set to react-jsx)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from "react";
import { render, screen } from "@testing-library/react";
import type { ComponentRegistry } from "../../model/component-metadata";
import type { V1ComponentContent } from "../types/message";
import {
  isComponentContent,
  renderComponentContent,
  renderMessageContent,
  renderMessageComponents,
  useV1ComponentContent,
  useV1ComponentContentOptional,
} from "./component-renderer";

// Test component that displays its props
function TestComponent({ title, count }: { title: string; count: number }) {
  return (
    <div data-testid="test-component">
      <span data-testid="title">{title}</span>
      <span data-testid="count">{count}</span>
    </div>
  );
}

// Test loading component
function TestLoadingComponent() {
  return <div data-testid="loading">Loading...</div>;
}

// Test component that uses the content context
function ContextAwareComponent() {
  const context = useV1ComponentContent();
  return (
    <div data-testid="context-aware">
      <span data-testid="componentId">{context.componentId}</span>
      <span data-testid="threadId">{context.threadId}</span>
      <span data-testid="messageId">{context.messageId}</span>
    </div>
  );
}

const mockRegistry: ComponentRegistry = {
  TestComponent: {
    component: TestComponent,
    name: "TestComponent",
    description: "A test component",
    props: {},
    contextTools: [],
  },
  TestWithLoading: {
    component: TestComponent,
    loadingComponent: TestLoadingComponent,
    name: "TestWithLoading",
    description: "A test component with loading state",
    props: {},
    contextTools: [],
  },
  ContextAware: {
    component: ContextAwareComponent,
    name: "ContextAware",
    description: "A context-aware component",
    props: {},
    contextTools: [],
  },
};

describe("isComponentContent", () => {
  it("returns true for component content", () => {
    const content: V1ComponentContent = {
      type: "component",
      id: "comp_1",
      name: "Test",
      props: {},
      streamingState: "done",
    };
    expect(isComponentContent(content)).toBe(true);
  });

  it("returns false for text content", () => {
    const content = { type: "text", text: "hello" };
    expect(isComponentContent(content as any)).toBe(false);
  });
});

describe("renderComponentContent", () => {
  it("renders a component from registry", () => {
    const content: V1ComponentContent = {
      type: "component",
      id: "comp_1",
      name: "TestComponent",
      props: { title: "Hello", count: 42 },
      streamingState: "done",
    };

    const result = renderComponentContent(content, {
      threadId: "thread_1",
      messageId: "msg_1",
      componentList: mockRegistry,
    });

    expect(result.renderedComponent).not.toBeNull();

    // Render and check output
    render(<>{result.renderedComponent}</>);
    expect(screen.getByTestId("title")).toHaveTextContent("Hello");
    expect(screen.getByTestId("count")).toHaveTextContent("42");
  });

  it("returns null renderedComponent for unknown component", () => {
    const content: V1ComponentContent = {
      type: "component",
      id: "comp_1",
      name: "UnknownComponent",
      props: {},
      streamingState: "done",
    };

    const consoleWarn = jest.spyOn(console, "warn").mockImplementation();

    const result = renderComponentContent(content, {
      threadId: "thread_1",
      messageId: "msg_1",
      componentList: mockRegistry,
    });

    expect(result.renderedComponent).toBeNull();
    expect(consoleWarn).toHaveBeenCalledWith(
      'Component "UnknownComponent" not found in registry',
    );

    consoleWarn.mockRestore();
  });

  it("shows loading component when streaming", () => {
    const content: V1ComponentContent = {
      type: "component",
      id: "comp_1",
      name: "TestWithLoading",
      props: { title: "Loading Test", count: 0 },
      streamingState: "streaming",
    };

    const result = renderComponentContent(content, {
      threadId: "thread_1",
      messageId: "msg_1",
      componentList: mockRegistry,
    });

    render(<>{result.renderedComponent}</>);
    expect(screen.getByTestId("loading")).toHaveTextContent("Loading...");
  });

  it("shows main component when done streaming", () => {
    const content: V1ComponentContent = {
      type: "component",
      id: "comp_1",
      name: "TestWithLoading",
      props: { title: "Done Test", count: 99 },
      streamingState: "done",
    };

    const result = renderComponentContent(content, {
      threadId: "thread_1",
      messageId: "msg_1",
      componentList: mockRegistry,
    });

    render(<>{result.renderedComponent}</>);
    expect(screen.getByTestId("title")).toHaveTextContent("Done Test");
    expect(screen.getByTestId("count")).toHaveTextContent("99");
  });

  it("provides component context to rendered components", () => {
    const content: V1ComponentContent = {
      type: "component",
      id: "comp_123",
      name: "ContextAware",
      props: {},
      streamingState: "done",
    };

    const result = renderComponentContent(content, {
      threadId: "thread_456",
      messageId: "msg_789",
      componentList: mockRegistry,
    });

    render(<>{result.renderedComponent}</>);
    expect(screen.getByTestId("componentId")).toHaveTextContent("comp_123");
    expect(screen.getByTestId("threadId")).toHaveTextContent("thread_456");
    expect(screen.getByTestId("messageId")).toHaveTextContent("msg_789");
  });
});

describe("renderMessageContent", () => {
  it("renders component content blocks and passes through others", () => {
    const content = [
      { type: "text", text: "Hello" },
      {
        type: "component",
        id: "comp_1",
        name: "TestComponent",
        props: { title: "Test", count: 1 },
        streamingState: "done",
      } as V1ComponentContent,
      { type: "text", text: "World" },
    ];

    const result = renderMessageContent(content as any, {
      threadId: "thread_1",
      messageId: "msg_1",
      componentList: mockRegistry,
    });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: "text", text: "Hello" });
    expect((result[1] as any).renderedComponent).not.toBeNull();
    expect(result[2]).toEqual({ type: "text", text: "World" });
  });

  it("handles multiple component blocks in a message", () => {
    const content = [
      {
        type: "component",
        id: "comp_1",
        name: "TestComponent",
        props: { title: "First", count: 1 },
        streamingState: "done",
      } as V1ComponentContent,
      {
        type: "component",
        id: "comp_2",
        name: "TestComponent",
        props: { title: "Second", count: 2 },
        streamingState: "done",
      } as V1ComponentContent,
    ];

    const result = renderMessageContent(content as any, {
      threadId: "thread_1",
      messageId: "msg_1",
      componentList: mockRegistry,
    });

    expect(result).toHaveLength(2);
    expect((result[0] as V1ComponentContent).renderedComponent).not.toBeNull();
    expect((result[1] as V1ComponentContent).renderedComponent).not.toBeNull();
  });

  it("handles tool_use content blocks unchanged", () => {
    const content = [
      {
        type: "tool_use",
        id: "tool_1",
        name: "search",
        input: { query: "test" },
      },
    ];

    const result = renderMessageContent(content as any, {
      threadId: "thread_1",
      messageId: "msg_1",
      componentList: mockRegistry,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(content[0]);
  });
});

describe("renderComponentContent edge cases", () => {
  it("shows main component when streamingState is 'started' (no loading component)", () => {
    const content: V1ComponentContent = {
      type: "component",
      id: "comp_1",
      name: "TestComponent",
      props: { title: "Started", count: 0 },
      streamingState: "started",
    };

    const result = renderComponentContent(content, {
      threadId: "thread_1",
      messageId: "msg_1",
      componentList: mockRegistry,
    });

    // TestComponent has no loading component, so it shows main even when streaming
    render(<>{result.renderedComponent}</>);
    expect(screen.getByTestId("title")).toHaveTextContent("Started");
  });

  it("shows loading component when streamingState is 'started' and loading exists", () => {
    const content: V1ComponentContent = {
      type: "component",
      id: "comp_1",
      name: "TestWithLoading",
      props: { title: "Started", count: 0 },
      streamingState: "started",
    };

    const result = renderComponentContent(content, {
      threadId: "thread_1",
      messageId: "msg_1",
      componentList: mockRegistry,
    });

    render(<>{result.renderedComponent}</>);
    expect(screen.getByTestId("loading")).toHaveTextContent("Loading...");
  });

  it("passes state as initialState prop", () => {
    // Component that reads initialState
    function StatefulComponent({
      initialState,
    }: {
      initialState?: { count: number };
    }) {
      return (
        <div data-testid="initial-count">{initialState?.count ?? "none"}</div>
      );
    }

    const registryWithStateful: ComponentRegistry = {
      StatefulComponent: {
        component: StatefulComponent,
        name: "StatefulComponent",
        description: "A stateful component",
        props: {},
        contextTools: [],
      },
    };

    const content: V1ComponentContent = {
      type: "component",
      id: "comp_1",
      name: "StatefulComponent",
      props: {},
      state: { count: 42 },
      streamingState: "done",
    };

    const result = renderComponentContent(content, {
      threadId: "thread_1",
      messageId: "msg_1",
      componentList: registryWithStateful,
    });

    render(<>{result.renderedComponent}</>);
    expect(screen.getByTestId("initial-count")).toHaveTextContent("42");
  });

  it("preserves original content properties in returned object", () => {
    const content: V1ComponentContent = {
      type: "component",
      id: "comp_custom",
      name: "TestComponent",
      props: { title: "Test", count: 5 },
      state: { value: "preserved" },
      streamingState: "done",
    };

    const result = renderComponentContent(content, {
      threadId: "thread_1",
      messageId: "msg_1",
      componentList: mockRegistry,
    });

    expect(result.id).toBe("comp_custom");
    expect(result.name).toBe("TestComponent");
    expect(result.props).toEqual({ title: "Test", count: 5 });
    expect(result.state).toEqual({ value: "preserved" });
    expect(result.streamingState).toBe("done");
  });
});

describe("useV1ComponentContentOptional", () => {
  it("returns null when used outside rendered component", () => {
    function TestConsumer() {
      const context = useV1ComponentContentOptional();
      return (
        <div data-testid="context">
          {context ? "has context" : "no context"}
        </div>
      );
    }

    render(<TestConsumer />);
    expect(screen.getByTestId("context")).toHaveTextContent("no context");
  });
});

describe("renderMessageComponents", () => {
  it("renders all components in a message", () => {
    const message = {
      id: "msg_1",
      role: "assistant" as const,
      content: [
        { type: "text" as const, text: "Here is the weather:" },
        {
          type: "component",
          id: "comp_1",
          name: "TestComponent",
          props: { title: "Weather", count: 72 },
          streamingState: "done",
        } as V1ComponentContent,
      ],
      createdAt: "2024-01-01T00:00:00.000Z",
    };

    const result = renderMessageComponents(message, {
      threadId: "thread_1",
      componentList: mockRegistry,
    });

    expect(result.id).toBe("msg_1");
    expect(result.content).toHaveLength(2);
    expect(result.content[0]).toEqual({
      type: "text",
      text: "Here is the weather:",
    });
    expect(
      (result.content[1] as V1ComponentContent).renderedComponent,
    ).not.toBeNull();
  });

  it("preserves message metadata", () => {
    const message = {
      id: "msg_123",
      role: "assistant" as const,
      content: [],
      createdAt: "2024-01-01T00:00:00.000Z",
      metadata: { custom: "value" },
    };

    const result = renderMessageComponents(message, {
      threadId: "thread_1",
      componentList: mockRegistry,
    });

    expect(result.id).toBe("msg_123");
    expect(result.role).toBe("assistant");
    expect(result.createdAt).toBe("2024-01-01T00:00:00.000Z");
    expect(result.metadata).toEqual({ custom: "value" });
  });
});

describe("useV1ComponentContent error handling", () => {
  it("throws when used outside rendered component", () => {
    function TestConsumer() {
      useV1ComponentContent();
      return <div>Should not render</div>;
    }

    // Suppress React error boundary logs
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => render(<TestConsumer />)).toThrow(
      "useV1ComponentContent must be used within a rendered component",
    );

    consoleSpy.mockRestore();
  });
});
