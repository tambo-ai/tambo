import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import {
  useThreadDropdownContext,
  type ThreadDropdownThread,
} from "../root/thread-dropdown-context";

/**
 * Props passed to the render function of ThreadDropdownThreadItem.
 */
export interface ThreadDropdownThreadItemRenderProps {
  /** The thread data for this item. */
  thread: ThreadDropdownThread;
  /** A truncated display label for the thread. */
  threadLabel: string;
  /** Handler to invoke when this thread item is selected. */
  onSelect: () => void;
}

export type ThreadDropdownThreadItemProps =
  BasePropsWithChildrenOrRenderFunction<
    React.HTMLAttributes<HTMLDivElement> & {
      /** The thread to render for this item. */
      thread: ThreadDropdownThread;
    },
    ThreadDropdownThreadItemRenderProps
  >;

/**
 * Menu item primitive for switching to an existing thread.
 * Provides thread data and a selection handler via render props.
 * @returns The thread menu item element
 */
export const ThreadDropdownThreadItem = React.forwardRef<
  HTMLDivElement,
  ThreadDropdownThreadItemProps
>(({ asChild, thread, ...props }, ref) => {
  const { onSwitchThread } = useThreadDropdownContext();

  const threadLabel = `Thread ${thread.id.substring(0, 8)}`;

  const handleSelect = React.useCallback(() => {
    onSwitchThread(thread.id);
  }, [onSwitchThread, thread.id]);

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    thread,
    threadLabel,
    onSelect: handleSelect,
  });

  return (
    <Comp
      ref={ref}
      role="menuitem"
      data-slot="thread-dropdown-thread-item"
      data-thread-id={thread.id}
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
ThreadDropdownThreadItem.displayName = "ThreadDropdown.ThreadItem";
