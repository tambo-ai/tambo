import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import {
  useThreadDropdownContext,
  type ThreadDropdownThread,
} from "../root/thread-dropdown-context";

/**
 * Props passed to the render function of ThreadDropdownMenu.
 */
export interface ThreadDropdownMenuRenderProps {
  /** The list of threads available in the dropdown. */
  threads: ThreadDropdownThread[];
  /** Whether the thread list is currently loading. */
  isLoading: boolean;
  /** Error from loading threads, if any. */
  error: Error | null;
  /** Handler to switch to an existing thread by ID. */
  onSwitchThread: (threadId: string) => void;
}

export type ThreadDropdownMenuProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLDivElement>,
  ThreadDropdownMenuRenderProps
>;

/**
 * Menu container primitive for the thread dropdown.
 * Wraps the dropdown content area where menu items are rendered.
 * Provides thread data and handlers via render props.
 * @returns The menu container element
 */
export const ThreadDropdownMenu = React.forwardRef<
  HTMLDivElement,
  ThreadDropdownMenuProps
>(({ asChild, ...props }, ref) => {
  const { threads, isLoading, error, onSwitchThread } =
    useThreadDropdownContext();

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    threads,
    isLoading,
    error,
    onSwitchThread,
  });

  return (
    <Comp
      ref={ref}
      data-slot="thread-dropdown-menu"
      role="menu"
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
ThreadDropdownMenu.displayName = "ThreadDropdown.Menu";
