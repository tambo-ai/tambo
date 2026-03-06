import { describe, expect, it, jest } from "@jest/globals";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { useTambo } from "@tambo-ai/react";
import { render } from "@testing-library/react";
import { Message } from "./index";

const mockUseTambo = jest.mocked(useTambo);

beforeEach(() => {
  mockUseTambo.mockReturnValue({
    messages: [],
    isStreaming: false,
    isIdle: true,
    currentThreadId: "mock-thread-id",
    switchThread: jest.fn(),
    startNewThread: jest.fn().mockReturnValue("new-thread-id"),
  } as never);
});

function createMessage(
  overrides: Partial<TamboThreadMessage> = {},
): TamboThreadMessage {
  return {
    id: "test-msg",
    role: "assistant",
    content: [{ type: "text", text: "Hello world" }],
    createdAt: new Date().toISOString(),
    ...overrides,
  } as TamboThreadMessage;
}

describe("Message.Content", () => {
  it("renders text content by default without a render prop", () => {
    const message = createMessage({
      content: [{ type: "text", text: "Some text content" }],
    });

    const { container } = render(
      <Message.Root message={message}>
        <Message.Content />
      </Message.Root>,
    );

    const contentEl = container.querySelector('[data-slot="message-content"]');
    expect(contentEl).toBeTruthy();
    expect(contentEl?.textContent).toBe("Some text content");
  });

  it("returns null when message has no content and keepMounted is false", () => {
    const message = createMessage({ content: [] });

    const { container } = render(
      <Message.Root message={message}>
        <Message.Content />
      </Message.Root>,
    );

    const contentEl = container.querySelector('[data-slot="message-content"]');
    expect(contentEl).toBeNull();
  });

  it("renders empty div when message has no content and keepMounted is true", () => {
    const message = createMessage({ content: [] });

    const { container } = render(
      <Message.Root message={message}>
        <Message.Content keepMounted />
      </Message.Root>,
    );

    const contentEl = container.querySelector('[data-slot="message-content"]');
    expect(contentEl).toBeTruthy();
  });

  it("renders custom children instead of default text", () => {
    const message = createMessage({
      content: [{ type: "text", text: "Original text" }],
    });

    const { container } = render(
      <Message.Root message={message}>
        <Message.Content>
          <span data-testid="custom">Custom child</span>
        </Message.Content>
      </Message.Root>,
    );

    const contentEl = container.querySelector('[data-slot="message-content"]');
    expect(contentEl).toBeTruthy();
    expect(contentEl?.textContent).toBe("Custom child");
  });

  it("uses render prop when provided", () => {
    const message = createMessage({
      content: [{ type: "text", text: "Render prop text" }],
    });

    const { container } = render(
      <Message.Root message={message}>
        <Message.Content
          render={(props, state) => (
            <div {...props}>Rendered: {state.contentAsMarkdownString}</div>
          )}
        />
      </Message.Root>,
    );

    const contentEl = container.querySelector('[data-slot="message-content"]');
    expect(contentEl?.textContent).toBe("Rendered: Render prop text");
  });

  it("uses messageContent override when provided", () => {
    const message = createMessage({
      content: [{ type: "text", text: "Original" }],
    });

    const { container } = render(
      <Message.Root message={message}>
        <Message.Content messageContent="Override text" />
      </Message.Root>,
    );

    const contentEl = container.querySelector('[data-slot="message-content"]');
    expect(contentEl?.textContent).toBe("Override text");
  });
});

describe("Message.Images", () => {
  it("renders images from message content", () => {
    const message = createMessage({
      content: [
        {
          type: "image_url",
          image_url: { url: "https://example.com/img.png" },
        },
      ] as unknown as TamboThreadMessage["content"],
    });

    const { container } = render(
      <Message.Root message={message}>
        <Message.Images />
      </Message.Root>,
    );

    const imagesEl = container.querySelector('[data-slot="message-images"]');
    expect(imagesEl).toBeTruthy();
    const img = imagesEl?.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("https://example.com/img.png");
  });

  it("returns null when message has no images and keepMounted is false", () => {
    const message = createMessage({
      content: [{ type: "text", text: "No images" }],
    });

    const { container } = render(
      <Message.Root message={message}>
        <Message.Images />
      </Message.Root>,
    );

    const imagesEl = container.querySelector('[data-slot="message-images"]');
    expect(imagesEl).toBeNull();
  });

  it("renders empty container when no images and keepMounted is true", () => {
    const message = createMessage({
      content: [{ type: "text", text: "No images" }],
    });

    const { container } = render(
      <Message.Root message={message}>
        <Message.Images keepMounted />
      </Message.Root>,
    );

    const imagesEl = container.querySelector('[data-slot="message-images"]');
    expect(imagesEl).toBeTruthy();
  });

  it("uses renderImage callback when provided", () => {
    const message = createMessage({
      content: [
        {
          type: "image_url",
          image_url: { url: "https://example.com/img.png" },
        },
      ] as unknown as TamboThreadMessage["content"],
    });

    const { container } = render(
      <Message.Root message={message}>
        <Message.Images
          renderImage={({ url, index }) => (
            <div data-testid={`custom-img-${index}`}>{url}</div>
          )}
        />
      </Message.Root>,
    );

    const customImg = container.querySelector('[data-testid="custom-img-0"]');
    expect(customImg).toBeTruthy();
    expect(customImg?.textContent).toBe("https://example.com/img.png");
  });
});

describe("Message.Root", () => {
  it("renders with data-slot and data-role attributes", () => {
    const message = createMessage();

    const { container } = render(
      <Message.Root message={message}>
        <span>child</span>
      </Message.Root>,
    );

    const root = container.querySelector('[data-slot="message-root"]');
    expect(root).toBeTruthy();
    expect(root?.getAttribute("data-role")).toBe("assistant");
  });

  it("renders user role correctly", () => {
    const message = createMessage({ role: "user" });

    const { container } = render(
      <Message.Root message={message}>
        <span>child</span>
      </Message.Root>,
    );

    const root = container.querySelector('[data-slot="message-root"]');
    expect(root?.getAttribute("data-role")).toBe("user");
  });

  it("sets data-has-text when message has text content", () => {
    const message = createMessage({
      content: [{ type: "text", text: "Hello" }],
    });

    const { container } = render(
      <Message.Root message={message}>
        <span>child</span>
      </Message.Root>,
    );

    const root = container.querySelector('[data-slot="message-root"]');
    expect(root?.hasAttribute("data-has-text")).toBe(true);
  });

  it("does not set data-has-text when message has no text content", () => {
    const message = createMessage({
      content: [
        {
          type: "component",
          id: "c1",
          name: "Foo",
          props: {},
        },
      ] as TamboThreadMessage["content"],
    });

    const { container } = render(
      <Message.Root message={message}>
        <span>child</span>
      </Message.Root>,
    );

    const root = container.querySelector('[data-slot="message-root"]');
    expect(root?.hasAttribute("data-has-text")).toBe(false);
  });

  it("sets data-has-component when message has component content", () => {
    const message = createMessage({
      content: [
        {
          type: "component",
          id: "c1",
          name: "Foo",
          props: {},
        },
      ] as TamboThreadMessage["content"],
    });

    const { container } = render(
      <Message.Root message={message}>
        <span>child</span>
      </Message.Root>,
    );

    const root = container.querySelector('[data-slot="message-root"]');
    expect(root?.hasAttribute("data-has-component")).toBe(true);
  });

  it("sets data-has-tool-result when message has tool result content", () => {
    const message = createMessage({
      content: [
        {
          type: "tool_result",
          toolUseId: "t1",
          content: [{ type: "text", text: "result" }],
        },
      ] as TamboThreadMessage["content"],
    });

    const { container } = render(
      <Message.Root message={message}>
        <span>child</span>
      </Message.Root>,
    );

    const root = container.querySelector('[data-slot="message-root"]');
    expect(root?.hasAttribute("data-has-tool-result")).toBe(true);
  });

  it("sets data-has-resource when message has resource content", () => {
    const message = createMessage({
      content: [
        {
          type: "resource",
          resource: { uri: "file:///test.txt" },
        },
      ] as TamboThreadMessage["content"],
    });

    const { container } = render(
      <Message.Root message={message}>
        <span>child</span>
      </Message.Root>,
    );

    const root = container.querySelector('[data-slot="message-root"]');
    expect(root?.hasAttribute("data-has-resource")).toBe(true);
  });

  it("sets data-reasoning when message has reasoning", () => {
    const message = createMessage({
      reasoning: ["thinking about it..."],
    });

    const { container } = render(
      <Message.Root message={message}>
        <span>child</span>
      </Message.Root>,
    );

    const root = container.querySelector('[data-slot="message-root"]');
    expect(root?.hasAttribute("data-reasoning")).toBe(true);
  });

  it("sets data-reasoning-ms when message has reasoning duration", () => {
    const message = createMessage({
      reasoningDurationMS: 1500,
    });

    const { container } = render(
      <Message.Root message={message}>
        <span>child</span>
      </Message.Root>,
    );

    const root = container.querySelector('[data-slot="message-root"]');
    expect(root?.getAttribute("data-reasoning-ms")).toBe("1500");
  });

  it("does not set data-reasoning-ms when no reasoning duration", () => {
    const message = createMessage();

    const { container } = render(
      <Message.Root message={message}>
        <span>child</span>
      </Message.Root>,
    );

    const root = container.querySelector('[data-slot="message-root"]');
    expect(root?.hasAttribute("data-reasoning-ms")).toBe(false);
  });

  it("looks up message by id from useTambo messages", () => {
    const message = createMessage({ id: "msg-123", role: "user" });
    mockUseTambo.mockReturnValue({
      messages: [message],
      isStreaming: false,
      isIdle: true,
      currentThreadId: "thread-1",
      switchThread: jest.fn(),
      startNewThread: jest.fn().mockReturnValue("new-thread-id"),
    } as never);

    const { container } = render(
      <Message.Root id="msg-123">
        <span>child</span>
      </Message.Root>,
    );

    const root = container.querySelector('[data-slot="message-root"]');
    expect(root).toBeTruthy();
    expect(root?.getAttribute("data-role")).toBe("user");
  });

  it("uses isLoading prop override", () => {
    const message = createMessage({ content: [] });

    const { container } = render(
      <Message.Root
        message={message}
        isLoading
        render={(props, state) => (
          <div {...props} data-test-loading={String(state.isLoading)}>
            child
          </div>
        )}
      />,
    );

    const root = container.querySelector('[data-slot="message-root"]');
    expect(root?.getAttribute("data-test-loading")).toBe("true");
  });

  it("exposes state via render prop", () => {
    const message = createMessage({
      content: [
        { type: "text", text: "hello" },
        {
          type: "resource",
          resource: { uri: "file:///test.txt" },
        },
      ] as TamboThreadMessage["content"],
    });

    const { container } = render(
      <Message.Root
        message={message}
        render={(props, state) => (
          <div {...props} data-testid="root">
            {state.hasText ? "has-text" : "no-text"},{" "}
            {state.hasResource ? "has-resource" : "no-resource"}
          </div>
        )}
      />,
    );

    const root = container.querySelector('[data-testid="root"]');
    expect(root?.textContent).toContain("has-text");
    expect(root?.textContent).toContain("has-resource");
  });
});
