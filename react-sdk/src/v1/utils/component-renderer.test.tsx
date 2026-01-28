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
  useV1ComponentContent,
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
});
