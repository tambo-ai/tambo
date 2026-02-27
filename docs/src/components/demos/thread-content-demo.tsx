"use client";

import { ThreadContent } from "@tambo-ai/react-ui-base/thread-content";

export function ThreadContentDemo() {
  return (
    <ThreadContent.Root className="flex flex-col gap-4">
      <ThreadContent.Loading className="flex items-center gap-2 p-4 text-sm text-neutral-500 dark:text-neutral-400">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600 dark:border-neutral-600 dark:border-t-neutral-300" />
        Generating...
      </ThreadContent.Loading>
      <ThreadContent.Empty className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
        No messages yet. Start a conversation!
      </ThreadContent.Empty>
      <ThreadContent.Messages
        render={(props, state) => (
          <div {...props} className="flex flex-col gap-2">
            {state.filteredMessages.map((message) => (
              <div
                key={message.id}
                className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-700"
              >
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {message.role}:
                </span>{" "}
                <span className="text-neutral-700 dark:text-neutral-300">
                  {message.content.map((block) =>
                    block.type === "text" ? block.text : null,
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      />
    </ThreadContent.Root>
  );
}
