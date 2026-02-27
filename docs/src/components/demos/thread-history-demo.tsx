"use client";

import { ThreadHistory } from "@tambo-ai/react-ui-base/thread-history";
import { Plus, Search } from "lucide-react";

export function ThreadHistoryDemo() {
  return (
    <ThreadHistory.Root>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <ThreadHistory.Search className="w-full rounded-lg border border-neutral-200 bg-transparent py-1.5 pl-8 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600" />
          </div>
          <ThreadHistory.NewThreadButton className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300">
            <Plus className="h-4 w-4" />
          </ThreadHistory.NewThreadButton>
        </div>
        <ThreadHistory.List
          render={(props, state) => (
            <div {...props} className="flex flex-col gap-1">
              {state.isLoading && (
                <p className="py-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  Loading...
                </p>
              )}
              {state.isEmpty && !state.isLoading && (
                <p className="py-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  No threads found
                </p>
              )}
              {state.filteredThreads.map((thread) => (
                <ThreadHistory.Item
                  key={thread.id}
                  thread={thread}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 data-[active]:bg-neutral-100 data-[active]:font-medium dark:text-neutral-300 dark:hover:bg-neutral-800 dark:data-[active]:bg-neutral-800"
                >
                  {thread.id}
                </ThreadHistory.Item>
              ))}
            </div>
          )}
        />
      </div>
    </ThreadHistory.Root>
  );
}
