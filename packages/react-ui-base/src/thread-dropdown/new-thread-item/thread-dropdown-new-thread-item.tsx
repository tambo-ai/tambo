import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useThreadDropdownContext } from "../root/thread-dropdown-context";

/**
 * Props passed to the render function of ThreadDropdownNewThreadItem.
 */
export interface ThreadDropdownNewThreadItemRenderProps {
  /** The modifier key label for the current platform. */
  modKey: string;
  /** The full keyboard shortcut label (e.g. "Option+Shift+N" or "Alt+Shift+N"). */
  shortcutLabel: string;
  /** Handler to invoke when the item is selected. */
  onSelect: () => void;
}

export type ThreadDropdownNewThreadItemProps =
  BasePropsWithChildrenOrRenderFunction<
    React.HTMLAttributes<HTMLDivElement>,
    ThreadDropdownNewThreadItemRenderProps
  >;

/**
 * Menu item primitive for creating a new thread.
 * Provides keyboard shortcut metadata via render props.
 * @returns The new thread menu item element
 */
export const ThreadDropdownNewThreadItem = React.forwardRef<
  HTMLDivElement,
  ThreadDropdownNewThreadItemProps
>(({ asChild, ...props }, ref) => {
  const { modKey, onNewThread } = useThreadDropdownContext();

  const shortcutLabel = `${modKey}+\u21E7+N`;

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    modKey,
    shortcutLabel,
    onSelect: onNewThread,
  });

  return (
    <Comp
      ref={ref}
      role="menuitem"
      data-slot="thread-dropdown-new-thread-item"
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
ThreadDropdownNewThreadItem.displayName = "ThreadDropdown.NewThreadItem";
