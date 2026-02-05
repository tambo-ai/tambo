import React from "react";
import { render, screen } from "@testing-library/react";
import {
  useV1ComponentContent,
  V1ComponentContentProvider,
} from "./component-renderer";

// Test component that uses the content context
const ContextAwareComponent: React.FC = () => {
  const context = useV1ComponentContent();
  return (
    <div data-testid="context-aware">
      <span data-testid="componentId">{context.componentId}</span>
      <span data-testid="threadId">{context.threadId}</span>
      <span data-testid="messageId">{context.messageId}</span>
      <span data-testid="componentName">{context.componentName}</span>
    </div>
  );
};

describe("V1ComponentContentProvider", () => {
  it("provides context to child components", () => {
    render(
      <V1ComponentContentProvider
        componentId="comp_123"
        threadId="thread_456"
        messageId="msg_789"
        componentName="TestComponent"
      >
        <ContextAwareComponent />
      </V1ComponentContentProvider>,
    );

    expect(screen.getByTestId("componentId")).toHaveTextContent("comp_123");
    expect(screen.getByTestId("threadId")).toHaveTextContent("thread_456");
    expect(screen.getByTestId("messageId")).toHaveTextContent("msg_789");
    expect(screen.getByTestId("componentName")).toHaveTextContent(
      "TestComponent",
    );
  });
});

describe("useV1ComponentContent", () => {
  it("throws when used outside provider", () => {
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

  it("returns context when used within provider", () => {
    render(
      <V1ComponentContentProvider
        componentId="comp_test"
        threadId="thread_test"
        messageId="msg_test"
        componentName="TestComp"
      >
        <ContextAwareComponent />
      </V1ComponentContentProvider>,
    );

    expect(screen.getByTestId("componentId")).toHaveTextContent("comp_test");
  });
});
