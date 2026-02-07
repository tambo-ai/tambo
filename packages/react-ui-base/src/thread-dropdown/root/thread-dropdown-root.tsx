import { Slot } from "@radix-ui/react-slot";
import { useTamboThread, useTamboThreadList } from "@tambo-ai/react";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import {
  ThreadDropdownContext,
  type ThreadDropdownThread,
} from "./thread-dropdown-context";

export type ThreadDropdownRootProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    /** Optional callback function called when the current thread changes. */
    onThreadChange?: () => void;
  }
>;

/**
 * Root primitive for the thread dropdown component.
 * Provides context for child components including thread list data,
 * platform detection, and thread management handlers.
 * Registers the Alt+Shift+N keyboard shortcut for creating new threads.
 * @returns The root container element with thread dropdown context
 */
export const ThreadDropdownRoot = React.forwardRef<
  HTMLDivElement,
  ThreadDropdownRootProps
>(function ThreadDropdownRoot(
  { children, asChild, onThreadChange, ...props },
  ref,
) {
  const { data: threads, isLoading, error, refetch } = useTamboThreadList();
  const { switchCurrentThread, startNewThread } = useTamboThread();

  const isMac =
    typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");
  const modKey = isMac ? "\u2325" : "Alt";

  const handleNewThread = React.useCallback(async () => {
    try {
      await startNewThread();
      await refetch();
      onThreadChange?.();
    } catch (err) {
      console.error("Failed to create new thread:", err);
    }
  }, [onThreadChange, startNewThread, refetch]);

  const handleSwitchThread = React.useCallback(
    (threadId: string) => {
      try {
        switchCurrentThread(threadId);
        onThreadChange?.();
      } catch (err) {
        console.error("Failed to switch thread:", err);
      }
    },
    [switchCurrentThread, onThreadChange],
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.key === "n") {
        event.preventDefault();
        void handleNewThread();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNewThread]);

  const threadItems: ThreadDropdownThread[] = React.useMemo(
    () => threads?.items ?? [],
    [threads],
  );

  const contextValue = React.useMemo(
    () => ({
      threads: threadItems,
      isLoading,
      error,
      isMac,
      modKey,
      onNewThread: () => {
        void handleNewThread();
      },
      onSwitchThread: handleSwitchThread,
    }),
    [
      threadItems,
      isLoading,
      error,
      isMac,
      modKey,
      handleNewThread,
      handleSwitchThread,
    ],
  );

  const Comp = asChild ? Slot : "div";

  return (
    <ThreadDropdownContext.Provider value={contextValue}>
      <Comp ref={ref} data-slot="thread-dropdown" {...props}>
        {children}
      </Comp>
    </ThreadDropdownContext.Provider>
  );
});
ThreadDropdownRoot.displayName = "ThreadDropdown.Root";
