"use client";

import { ThreadDropdownMenu } from "./menu/thread-dropdown-menu";
import { ThreadDropdownNewThreadItem } from "./new-thread-item/thread-dropdown-new-thread-item";
import { ThreadDropdownRoot } from "./root/thread-dropdown-root";
import { ThreadDropdownThreadItem } from "./thread-item/thread-dropdown-thread-item";
import { ThreadDropdownTrigger } from "./trigger/thread-dropdown-trigger";

/**
 * ThreadDropdown namespace containing all thread dropdown base components.
 */
const ThreadDropdown = {
  Root: ThreadDropdownRoot,
  Trigger: ThreadDropdownTrigger,
  Menu: ThreadDropdownMenu,
  NewThreadItem: ThreadDropdownNewThreadItem,
  ThreadItem: ThreadDropdownThreadItem,
};

export type {
  ThreadDropdownMenuProps,
  ThreadDropdownMenuRenderProps,
} from "./menu/thread-dropdown-menu";
export type {
  ThreadDropdownNewThreadItemProps,
  ThreadDropdownNewThreadItemRenderProps,
} from "./new-thread-item/thread-dropdown-new-thread-item";
export type {
  ThreadDropdownContextValue,
  ThreadDropdownThread,
} from "./root/thread-dropdown-context";
export type { ThreadDropdownRootProps } from "./root/thread-dropdown-root";
export type {
  ThreadDropdownThreadItemProps,
  ThreadDropdownThreadItemRenderProps,
} from "./thread-item/thread-dropdown-thread-item";
export type { ThreadDropdownTriggerProps } from "./trigger/thread-dropdown-trigger";

export { ThreadDropdown };
