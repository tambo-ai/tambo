import { render, renderHook, screen } from "@testing-library/react";
import React from "react";
import {
  InteractableMetadata,
  TamboThreadMessage,
} from "../model/generate-component-response";
import {
  TamboMessageProvider,
  useTamboCurrentComponent,
  useTamboCurrentMessage,
} from "./use-current-message";

describe("TamboMessageProvider", () => {
  const createMockMessage = (
    overrides: Partial<TamboThreadMessage> = {},
  ): TamboThreadMessage => ({
    id: "test-message-id",
    threadId: "test-thread-id",
    componentState: {},
    content: [{ type: "text", text: "Test message" }],
    createdAt: new Date().toISOString(),
    role: "assistant",
    ...overrides,
  });

  it("should provide message context to children", () => {
    const message = createMockMessage();

    const TestComponent = () => {
      const currentMessage = useTamboCurrentMessage();
      return <div>{currentMessage.id}</div>;
    };

    render(
      <TamboMessageProvider message={message}>
        <TestComponent />
      </TamboMessageProvider>,
    );

    expect(screen.getByText("test-message-id")).toBeInTheDocument();
  });

  it("should merge interactable metadata into message", () => {
    const message = createMockMessage();
    const interactableMetadata: InteractableMetadata = {
      id: "interactable-123",
      componentName: "TestComponent",
      description: "Test description",
    };

    const TestComponent = () => {
      const currentMessage = useTamboCurrentMessage();
      return (
        <div>
          <span data-testid="message-id">{currentMessage.id}</span>
          <span data-testid="interactable-id">
            {currentMessage.interactableMetadata?.id}
          </span>
        </div>
      );
    };

    render(
      <TamboMessageProvider
        message={message}
        interactableMetadata={interactableMetadata}
      >
        <TestComponent />
      </TamboMessageProvider>,
    );

    expect(screen.getByTestId("message-id")).toHaveTextContent(
      "test-message-id",
    );
    expect(screen.getByTestId("interactable-id")).toHaveTextContent(
      "interactable-123",
    );
  });

  it("should work without interactable metadata", () => {
    const message = createMockMessage();

    const TestComponent = () => {
      const currentMessage = useTamboCurrentMessage();
      return (
        <div>
          <span data-testid="has-metadata">
            {currentMessage.interactableMetadata ? "yes" : "no"}
          </span>
        </div>
      );
    };

    render(
      <TamboMessageProvider message={message}>
        <TestComponent />
      </TamboMessageProvider>,
    );

    expect(screen.getByTestId("has-metadata")).toHaveTextContent("no");
  });

  it("should use message.id as key for re-renders", () => {
    const message1 = createMockMessage({ id: "message-1" });
    const message2 = createMockMessage({ id: "message-2" });

    let renderCount = 0;
    const TestComponent = () => {
      renderCount++;
      const currentMessage = useTamboCurrentMessage();
      return <div>{currentMessage.id}</div>;
    };

    const { rerender } = render(
      <TamboMessageProvider message={message1}>
        <TestComponent />
      </TamboMessageProvider>,
    );

    expect(renderCount).toBe(1);
    expect(screen.getByText("message-1")).toBeInTheDocument();

    // Change to new message - should force re-render due to key change
    rerender(
      <TamboMessageProvider message={message2}>
        <TestComponent />
      </TamboMessageProvider>,
    );

    expect(renderCount).toBe(2);
    expect(screen.getByText("message-2")).toBeInTheDocument();
  });
});

describe("useTamboCurrentMessage", () => {
  const createMockMessage = (
    overrides: Partial<TamboThreadMessage> = {},
  ): TamboThreadMessage => ({
    id: "test-message-id",
    threadId: "test-thread-id",
    componentState: {},
    content: [{ type: "text", text: "Test message" }],
    createdAt: new Date().toISOString(),
    role: "assistant",
    ...overrides,
  });

  it("should throw error when used outside TamboMessageProvider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => {
      renderHook(() => useTamboCurrentMessage());
    }).toThrow(
      "useTamboCurrentMessage must be used within a TamboMessageProvider",
    );

    consoleSpy.mockRestore();
  });

  it("should return the current message", () => {
    const message = createMockMessage();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboMessageProvider message={message}>{children}</TamboMessageProvider>
    );

    const { result } = renderHook(() => useTamboCurrentMessage(), { wrapper });

    expect(result.current).toEqual(
      expect.objectContaining({
        id: "test-message-id",
        threadId: "test-thread-id",
      }),
    );
  });

  it("should return message with interactable metadata when provided", () => {
    const message = createMockMessage();
    const interactableMetadata: InteractableMetadata = {
      id: "interactable-123",
      componentName: "TestComponent",
      description: "Test description",
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboMessageProvider
        message={message}
        interactableMetadata={interactableMetadata}
      >
        {children}
      </TamboMessageProvider>
    );

    const { result } = renderHook(() => useTamboCurrentMessage(), { wrapper });

    expect(result.current.interactableMetadata).toEqual(interactableMetadata);
  });
});

describe("useTamboCurrentComponent", () => {
  const createMockMessage = (
    overrides: Partial<TamboThreadMessage> = {},
  ): TamboThreadMessage => ({
    id: "test-message-id",
    threadId: "test-thread-id",
    componentState: {},
    content: [{ type: "text", text: "Test message" }],
    createdAt: new Date().toISOString(),
    role: "assistant",
    ...overrides,
  });

  it("should return null when used outside TamboMessageProvider", () => {
    const { result } = renderHook(() => useTamboCurrentComponent());

    expect(result.current).toBeNull();
  });

  it("should return component info from message.component", () => {
    const message = createMockMessage({
      component: {
        componentName: "WeatherCard",
        componentState: {},
        message: "",
        props: {
          city: "San Francisco",
          temperature: 72,
        },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboMessageProvider message={message}>{children}</TamboMessageProvider>
    );

    const { result } = renderHook(() => useTamboCurrentComponent(), {
      wrapper,
    });

    expect(result.current).toEqual({
      componentName: "WeatherCard",
      props: {
        city: "San Francisco",
        temperature: 72,
      },
      interactableId: undefined,
      description: undefined,
      threadId: "test-thread-id",
    });
  });

  it("should return interactable metadata when provided", () => {
    const message = createMockMessage({
      component: {
        componentName: "WeatherCard",
        componentState: {},
        message: "",
        props: {
          city: "San Francisco",
          temperature: 72,
        },
      },
    });

    const interactableMetadata: InteractableMetadata = {
      id: "interactable-456",
      componentName: "WeatherCard",
      description: "Shows current weather",
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboMessageProvider
        message={message}
        interactableMetadata={interactableMetadata}
      >
        {children}
      </TamboMessageProvider>
    );

    const { result } = renderHook(() => useTamboCurrentComponent(), {
      wrapper,
    });

    expect(result.current).toEqual({
      componentName: "WeatherCard",
      props: {
        city: "San Francisco",
        temperature: 72,
      },
      interactableId: "interactable-456",
      description: "Shows current weather",
      threadId: "test-thread-id",
    });
  });

  it("should prioritize interactableMetadata.componentName over message.component.componentName", () => {
    const message = createMockMessage({
      component: {
        componentName: "OldComponentName",
        componentState: {},
        message: "",
        props: {},
      },
    });

    const interactableMetadata: InteractableMetadata = {
      id: "interactable-789",
      componentName: "NewComponentName",
      description: "New description",
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboMessageProvider
        message={message}
        interactableMetadata={interactableMetadata}
      >
        {children}
      </TamboMessageProvider>
    );

    const { result } = renderHook(() => useTamboCurrentComponent(), {
      wrapper,
    });

    expect(result.current?.componentName).toBe("NewComponentName");
  });

  it("should handle message with only interactable metadata (no component)", () => {
    const message = createMockMessage(); // No component field

    const interactableMetadata: InteractableMetadata = {
      id: "interactable-only",
      componentName: "InteractableComponent",
      description: "Interactable only",
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboMessageProvider
        message={message}
        interactableMetadata={interactableMetadata}
      >
        {children}
      </TamboMessageProvider>
    );

    const { result } = renderHook(() => useTamboCurrentComponent(), {
      wrapper,
    });

    expect(result.current).toEqual({
      componentName: "InteractableComponent",
      props: undefined,
      interactableId: "interactable-only",
      description: "Interactable only",
      threadId: "test-thread-id",
    });
  });

  it("should handle message with component but no interactable metadata", () => {
    const message = createMockMessage({
      component: {
        componentName: "SimpleComponent",
        componentState: {},
        message: "",
        props: {
          title: "Hello",
        },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboMessageProvider message={message}>{children}</TamboMessageProvider>
    );

    const { result } = renderHook(() => useTamboCurrentComponent(), {
      wrapper,
    });

    expect(result.current).toEqual({
      componentName: "SimpleComponent",
      props: {
        title: "Hello",
      },
      interactableId: undefined,
      description: undefined,
      threadId: "test-thread-id",
    });
  });

  it("should return undefined for all fields when message has neither component nor interactable metadata", () => {
    const message = createMockMessage(); // Minimal message with no component or interactable data

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboMessageProvider message={message}>{children}</TamboMessageProvider>
    );

    const { result } = renderHook(() => useTamboCurrentComponent(), {
      wrapper,
    });

    expect(result.current).toEqual({
      componentName: undefined,
      props: undefined,
      interactableId: undefined,
      description: undefined,
      threadId: "test-thread-id",
    });
  });
});
