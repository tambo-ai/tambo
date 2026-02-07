import { Slot } from "@radix-ui/react-slot";
import type { TamboThread } from "@tambo-ai/react";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useThreadHistoryRootContext } from "../root/thread-history-root-context";

/**
 * Props passed to the render function for the thread list.
 */
export interface ThreadHistoryListRenderProps {
  /** The filtered list of threads. */
  filteredThreads: TamboThread[];
  /** Whether threads are currently loading. */
  isLoading: boolean;
  /** Error from loading threads, if any. */
  error: Error | null;
  /** The current search query. */
  searchQuery: string;
  /** Whether the sidebar is collapsed. */
  isCollapsed: boolean;
}

export type ThreadHistoryListProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
>;

/**
 * List primitive for the thread history.
 * Provides the filtered thread list and loading/error state to children
 * via a render prop. Hides content when the sidebar is collapsed.
 * @returns A container for the thread list with data attributes for styling
 */
export const ThreadHistoryList = React.forwardRef<
  HTMLDivElement,
  BasePropsWithChildrenOrRenderFunction<
    ThreadHistoryListProps,
    ThreadHistoryListRenderProps
  >
>(function ThreadHistoryList(props, ref) {
  const { filteredThreads, isLoading, error, searchQuery, isCollapsed } =
    useThreadHistoryRootContext();

  const { asChild, ...restForRender } = props as typeof props & {
    asChild?: boolean;
  };

  const { content, componentProps } = useRender(restForRender, {
    filteredThreads,
    isLoading,
    error,
    searchQuery,
    isCollapsed,
  });

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref}
      data-slot="thread-history-list"
      data-collapsed={isCollapsed || undefined}
      data-loading={isLoading || undefined}
      data-error={!!error || undefined}
      data-empty={filteredThreads.length === 0 || undefined}
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
