import { describe, expect, it } from "@jest/globals";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { render } from "@testing-library/react";
import { Message } from "./index";

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
      <Message.Root message={message} role="assistant">
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
      <Message.Root message={message} role="assistant">
        <Message.Content />
      </Message.Root>,
    );

    const contentEl = container.querySelector('[data-slot="message-content"]');
    expect(contentEl).toBeNull();
  });

  it("renders empty div when message has no content and keepMounted is true", () => {
    const message = createMessage({ content: [] });

    const { container } = render(
      <Message.Root message={message} role="assistant">
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
      <Message.Root message={message} role="assistant">
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
      <Message.Root message={message} role="assistant">
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
      <Message.Root message={message} role="assistant">
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
      <Message.Root message={message} role="assistant">
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
      <Message.Root message={message} role="assistant">
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
      <Message.Root message={message} role="assistant">
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
      <Message.Root message={message} role="assistant">
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
      <Message.Root message={message} role="assistant">
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
      <Message.Root message={message} role="user">
        <span>child</span>
      </Message.Root>,
    );

    const root = container.querySelector('[data-slot="message-root"]');
    expect(root?.getAttribute("data-role")).toBe("user");
  });
});
