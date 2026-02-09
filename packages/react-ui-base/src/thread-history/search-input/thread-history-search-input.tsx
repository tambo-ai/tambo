import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useThreadHistoryRootContext } from "../root/thread-history-root-context";

/**
 * Props passed to the SearchInput render function.
 */
export interface ThreadHistorySearchInputRenderProps {
  /** Whether the sidebar is collapsed. */
  isCollapsed: boolean;
  /** The current search query string. */
  searchQuery: string;
  /** Set the search query. */
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  /** Expand the sidebar and focus the search input. */
  expandOnSearch: () => void;
  /** Ref for the search input element. */
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export interface ThreadHistorySearchInputProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /** Children as ReactNode or render function receiving search state. */
  children?:
    | React.ReactNode
    | ((props: ThreadHistorySearchInputRenderProps) => React.ReactNode);
}

/**
 * Search input primitive for filtering threads in the thread history.
 * Manages input state and expands the sidebar when clicked while collapsed.
 * Accepts children as a render function to access search state and refs.
 * @returns A container with a search input for filtering threads
 */
export const ThreadHistorySearchInput = React.forwardRef<
  HTMLDivElement,
  ThreadHistorySearchInputProps
>(function ThreadHistorySearchInput({ children, asChild, ...props }, ref) {
  const { isCollapsed, setIsCollapsed, searchQuery, setSearchQuery } =
    useThreadHistoryRootContext();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const expandOnSearch = React.useCallback(() => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [isCollapsed, setIsCollapsed]);

  const Comp = asChild ? Slot : "div";

  const renderedChildren =
    typeof children === "function"
      ? children({
          isCollapsed,
          searchQuery,
          setSearchQuery,
          expandOnSearch,
          searchInputRef,
        })
      : children;

  return (
    <Comp
      ref={ref}
      data-slot="thread-history-search-input"
      data-collapsed={isCollapsed || undefined}
      {...props}
    >
      {renderedChildren}
    </Comp>
  );
});
