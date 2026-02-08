import React from "react";
import { render, screen } from "@testing-library/react";
import {
  useComponentContent,
  ComponentContentProvider,
} from "./component-renderer";

// Test component that uses the content context
const ContextAwareComponent: React.FC = () => {
  const context = useComponentContent();
  return (
    <div data-testid="context-aware">
      <span data-testid="componentId">{context.componentId}</span>
      <span data-testid="threadId">{context.threadId}</span>
      <span data-testid="messageId">{context.messageId}</span>
      <span data-testid="componentName">{context.componentName}</span>
    </div>
  );
};

describe("ComponentContentProvider", () => {
  it("provides context to child components", () => {
    render(
      <ComponentContentProvider
        componentId="comp_123"
        threadId="thread_456"
        messageId="msg_789"
        componentName="TestComponent"
      >
        <ContextAwareComponent />
      </ComponentContentProvider>,
    );

    expect(screen.getByTestId("componentId")).toHaveTextContent("comp_123");
    expect(screen.getByTestId("threadId")).toHaveTextContent("thread_456");
    expect(screen.getByTestId("messageId")).toHaveTextContent("msg_789");
    expect(screen.getByTestId("componentName")).toHaveTextContent(
      "TestComponent",
    );
  });
});

describe("useComponentContent", () => {
  it("throws when used outside provider", () => {
    function TestConsumer() {
      useComponentContent();
      return <div>Should not render</div>;
    }

    // Suppress React error boundary logs
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => render(<TestConsumer />)).toThrow(
      "useComponentContent must be used within a rendered component",
    );

    consoleSpy.mockRestore();
  });

  it("returns context when used within provider", () => {
    render(
      <ComponentContentProvider
        componentId="comp_test"
        threadId="thread_test"
        messageId="msg_test"
        componentName="TestComp"
      >
        <ContextAwareComponent />
      </ComponentContentProvider>,
    );

    expect(screen.getByTestId("componentId")).toHaveTextContent("comp_test");
  });
});
