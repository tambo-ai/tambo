"use client";

import { ThreadDropdown } from "@tambo-ai/react-ui-base/thread-dropdown";
import { ChevronDown, Plus } from "lucide-react";

export function ThreadDropdownDemo() {
  return (
    <ThreadDropdown.Root>
      <ThreadDropdown.Trigger className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
        Threads
        <ChevronDown className="h-3.5 w-3.5" />
      </ThreadDropdown.Trigger>
      <ThreadDropdown.Content
        render={(props, state) => (
          <div
            {...props}
            className="mt-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
          >
            <ThreadDropdown.NewThread className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700">
              <Plus className="h-3.5 w-3.5" />
              New Thread
            </ThreadDropdown.NewThread>
            {state.threads.map((thread) => (
              <ThreadDropdown.ThreadItem
                key={thread.id}
                thread={thread}
                className="w-full rounded-md px-3 py-1.5 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                {thread.id}
              </ThreadDropdown.ThreadItem>
            ))}
          </div>
        )}
      />
    </ThreadDropdown.Root>
  );
}
