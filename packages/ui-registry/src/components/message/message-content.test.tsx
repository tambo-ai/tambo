/// <reference types="@testing-library/jest-dom" />
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { useTambo } from "@tambo-ai/react";
import { render } from "@testing-library/react";
import { Message, MessageContent } from "./message";

// @tambo-ai/react is mocked via moduleNameMapper in jest.config.ts

/**
 * Creates a minimal TamboThreadMessage for testing.
 */
function createMessage(
  overrides: Partial<TamboThreadMessage> = {},
): TamboThreadMessage {
  return {
    id: "test-message-id",
    role: "assistant",
    content: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  } as TamboThreadMessage;
}

function getMessageContentTextSlot(container: HTMLElement): HTMLElement {
  const contentElement = container.querySelector(
    '[data-slot="message-content-text"]',
  );

  if (!contentElement) {
    throw new Error(
      'Expected to find message content slot: [data-slot="message-content-text"]',
    );
  }

  return contentElement as HTMLElement;
}

describe("MessageContent rendering", () => {
  const mockUseTambo = jest.mocked(useTambo);

  beforeEach(() => {
    mockUseTambo.mockReturnValue({
      thread: {
        messages: [],
        generationStage: "IDLE",
      },
    } as never);
  });

  describe("text content parts", () => {
    it("renders a single text part", () => {
      const message = createMessage({
        content: [{ type: "text", text: "Hello, world!" }],
      });

      const { container } = render(
        <Message role="assistant" message={message}>
          <MessageContent />
        </Message>,
      );

      const contentElement = getMessageContentTextSlot(container);
      expect(contentElement.innerHTML).toMatchInlineSnapshot(`
        <div class="space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0">
          <p class="my-0">
            Hello, world!
          </p>
        </div>
      `);
    });

    it("renders multiple text parts joined with spaces", () => {
      const message = createMessage({
        content: [
          { type: "text", text: "First part." },
          { type: "text", text: "Second part." },
        ],
      });

      const { container } = render(
        <Message role="assistant" message={message}>
          <MessageContent />
        </Message>,
      );

      const contentElement = getMessageContentTextSlot(container);
      expect(contentElement.innerHTML).toMatchInlineSnapshot(`
        <div class="space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0">
          <p class="my-0">
            First part. Second part.
          </p>
        </div>
      `);
    });

    it("renders markdown formatting in text", () => {
      const message = createMessage({
        content: [
          { type: "text", text: "This is **bold** and *italic* text." },
        ],
      });

      const { container } = render(
        <Message role="assistant" message={message}>
          <MessageContent />
        </Message>,
      );

      const contentElement = getMessageContentTextSlot(container);
      expect(contentElement.innerHTML).toMatchInlineSnapshot(`
        <div class="space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0">
          <p class="my-0">
            This is
            <span
              class="font-semibold"
              data-streamdown="strong"
            >
              bold
            </span>
            and
            <em>
              italic
            </em>
            text.
          </p>
        </div>
      `);
    });
  });

  describe("resource content parts", () => {
    it("renders a single resource as a mention pill", () => {
      const message = createMessage({
        content: [
          {
            type: "resource",
            resource: {
              uri: "file:///path/to/document.txt",
              name: "document.txt",
            },
          },
        ],
      });

      const { container } = render(
        <Message role="assistant" message={message}>
          <MessageContent />
        </Message>,
      );

      const contentElement = getMessageContentTextSlot(container);
      expect(contentElement.innerHTML).toMatchInlineSnapshot(`
        <div class="space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0">
          <p class="my-0">
            <span
              title="Blocked URL: undefined"
              class="text-gray-500"
            >
              document.txt [blocked]
            </span>
          </p>
        </div>
      `);
    });

    it("renders resource using URI when name is missing", () => {
      const message = createMessage({
        content: [
          {
            type: "resource",
            resource: {
              uri: "file:///path/to/file.md",
            },
          },
        ],
      });

      const { container } = render(
        <Message role="assistant" message={message}>
          <MessageContent />
        </Message>,
      );

      const contentElement = getMessageContentTextSlot(container);
      expect(contentElement.innerHTML).toMatchInlineSnapshot(`
        <div class="space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0">
          <p class="my-0">
            <span
              title="Blocked URL: undefined"
              class="text-gray-500"
            >
              file:///path/to/file.md [blocked]
            </span>
          </p>
        </div>
      `);
    });

    it("renders resource with special characters in URI", () => {
      const message = createMessage({
        content: [
          {
            type: "resource",
            resource: {
              uri: "file:///path/with spaces/and#special&chars.txt",
              name: "special file",
            },
          },
        ],
      });

      const { container } = render(
        <Message role="assistant" message={message}>
          <MessageContent />
        </Message>,
      );

      const contentElement = getMessageContentTextSlot(container);
      expect(contentElement.innerHTML).toMatchInlineSnapshot(`
        <div class="space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0">
          <p class="my-0">
            <span
              title="Blocked URL: undefined"
              class="text-gray-500"
            >
              special file [blocked]
            </span>
          </p>
        </div>
      `);
    });
  });

  describe("mixed content parts", () => {
    it("renders text before a resource mention", () => {
      const message = createMessage({
        content: [
          { type: "text", text: "Check out this file:" },
          {
            type: "resource",
            resource: {
              uri: "file:///docs/readme.md",
              name: "readme.md",
            },
          },
        ],
      });

      const { container } = render(
        <Message role="assistant" message={message}>
          <MessageContent />
        </Message>,
      );

      const contentElement = getMessageContentTextSlot(container);
      expect(contentElement.innerHTML).toMatchInlineSnapshot(`
        <div class="space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0">
          <p class="my-0">
            Check out this file:
            <span
              title="Blocked URL: undefined"
              class="text-gray-500"
            >
              readme.md [blocked]
            </span>
          </p>
        </div>
      `);
    });

    it("renders resource mention followed by text", () => {
      const message = createMessage({
        content: [
          {
            type: "resource",
            resource: {
              uri: "file:///config.json",
              name: "config.json",
            },
          },
          { type: "text", text: "contains the settings you need." },
        ],
      });

      const { container } = render(
        <Message role="assistant" message={message}>
          <MessageContent />
        </Message>,
      );

      const contentElement = getMessageContentTextSlot(container);
      expect(contentElement.innerHTML).toMatchInlineSnapshot(`
        <div class="space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0">
          <p class="my-0">
            <span
              title="Blocked URL: undefined"
              class="text-gray-500"
            >
              config.json [blocked]
            </span>
            contains the settings you need.
          </p>
        </div>
      `);
    });

    it("renders multiple resources mixed with text", () => {
      const message = createMessage({
        content: [
          { type: "text", text: "Compare" },
          {
            type: "resource",
            resource: {
              uri: "file:///old.ts",
              name: "old.ts",
            },
          },
          { type: "text", text: "with" },
          {
            type: "resource",
            resource: {
              uri: "file:///new.ts",
              name: "new.ts",
            },
          },
          { type: "text", text: "for the differences." },
        ],
      });

      const { container } = render(
        <Message role="assistant" message={message}>
          <MessageContent />
        </Message>,
      );

      const contentElement = getMessageContentTextSlot(container);
      expect(contentElement.innerHTML).toMatchInlineSnapshot(`
        <div class="space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0">
          <p class="my-0">
            Compare
            <span
              title="Blocked URL: undefined"
              class="text-gray-500"
            >
              old.ts [blocked]
            </span>
            with
            <span
              title="Blocked URL: undefined"
              class="text-gray-500"
            >
              new.ts [blocked]
            </span>
            for the differences.
          </p>
        </div>
      `);
    });
  });

  describe("edge cases", () => {
    // Empty array content goes through Streamdown with empty string, not the "Empty message" placeholder
    // The placeholder only shows for truly falsy content (null/undefined)
    it("renders empty array content as empty paragraph", () => {
      const message = createMessage({
        content: [],
      });

      const { container } = render(
        <Message role="assistant" message={message}>
          <MessageContent />
        </Message>,
      );

      const contentElement = getMessageContentTextSlot(container);
      expect(contentElement.innerHTML).toMatchInlineSnapshot(`
        <div class="space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0">
        </div>
      `);
    });

    it("renders text part with empty string as empty paragraph", () => {
      const message = createMessage({
        content: [{ type: "text", text: "" }],
      });

      const { container } = render(
        <Message role="assistant" message={message}>
          <MessageContent />
        </Message>,
      );

      const contentElement = getMessageContentTextSlot(container);
      expect(contentElement.innerHTML).toMatchInlineSnapshot(`
        <div class="space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0">
        </div>
      `);
    });

    it("skips resource parts without URI", () => {
      const message = createMessage({
        content: [
          { type: "text", text: "Before" },
          {
            type: "resource",
            resource: {
              name: "no-uri-resource",
            },
          },
          { type: "text", text: "After" },
        ],
      });

      const { container } = render(
        <Message role="assistant" message={message}>
          <MessageContent />
        </Message>,
      );

      const contentElement = getMessageContentTextSlot(container);
      // Resource without URI should be skipped, text parts joined with space
      expect(contentElement.innerHTML).toMatchInlineSnapshot(`
        <div class="space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0">
          <p class="my-0">
            Before After
          </p>
        </div>
      `);
    });

    it("renders plain string content", () => {
      const message = createMessage({
        // The actual component handles string content even though the type is ChatCompletionContentPart[]
        content:
          "Plain string content" as unknown as TamboThreadMessage["content"],
      });

      const { container } = render(
        <Message role="assistant" message={message}>
          <MessageContent />
        </Message>,
      );

      const contentElement = getMessageContentTextSlot(container);
      expect(contentElement.innerHTML).toMatchInlineSnapshot(`
        <div class="space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0">
          <p class="my-0">
            Plain string content
          </p>
        </div>
      `);
    });
  });

  describe("regular links vs resource links", () => {
    it("renders regular markdown links with external icon", () => {
      const message = createMessage({
        content: [
          { type: "text", text: "Check out [Google](https://google.com)" },
        ],
      });

      const { container } = render(
        <Message role="assistant" message={message}>
          <MessageContent />
        </Message>,
      );

      const contentElement = getMessageContentTextSlot(container);
      // Regular links should render as <a> tags with external link icon
      expect(contentElement.innerHTML).toMatchInlineSnapshot(`
        <div class="space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0">
          <p class="my-0">
            Check out
            <a
              href="https://google.com/"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-foreground underline underline-offset-4 decoration-muted-foreground hover:text-foreground hover:decoration-foreground transition-colors"
            >
              <span>
                Google
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewbox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-external-link w-3 h-3"
                aria-hidden="true"
              >
                <path d="M15 3h6v6">
                </path>
                <path d="M10 14 21 3">
                </path>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6">
                </path>
              </svg>
            </a>
          </p>
        </div>
      `);
    });

    it("distinguishes between resource links and regular links in same message", () => {
      const message = createMessage({
        content: [
          { type: "text", text: "See [docs](https://example.com) and" },
          {
            type: "resource",
            resource: {
              uri: "file:///local.txt",
              name: "local.txt",
            },
          },
        ],
      });

      const { container } = render(
        <Message role="assistant" message={message}>
          <MessageContent />
        </Message>,
      );

      const contentElement = getMessageContentTextSlot(container);
      // Should have both regular link and resource mention
      // Note: URLs are normalized with trailing slashes by the markdown parser
      expect(contentElement.innerHTML).toContain('href="https://example.com/');
      expect(contentElement.innerHTML).toContain(
        'data-resource-uri="file:///local.txt"',
      );
      expect(contentElement.innerHTML).toContain("@local.txt");
    });
  });
});
