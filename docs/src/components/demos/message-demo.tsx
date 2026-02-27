"use client";

import { Message } from "@tambo-ai/react-ui-base/message";
import type { TamboThreadMessage } from "@tambo-ai/react";

const mockMessage = {
  id: "demo-msg-1",
  role: "assistant" as const,
  content: [
    {
      type: "text" as const,
      text: "Here is an example assistant message rendered with the Message primitive. It supports text blocks, images, and rendered components.",
    },
  ],
  createdAt: new Date().toISOString(),
  metadata: {},
} satisfies TamboThreadMessage;

export function MessageDemo() {
  return (
    <Message.Root
      message={mockMessage}
      role={mockMessage.role}
      className="flex flex-col gap-2"
    >
      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {mockMessage.role}
      </div>
      <Message.Content className="text-sm text-neutral-900 dark:text-neutral-100" />
      <Message.Images />
      <Message.RenderedComponent>
        <Message.RenderedComponentCanvasButton />
        <Message.RenderedComponentContent />
      </Message.RenderedComponent>
    </Message.Root>
  );
}
