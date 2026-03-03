"use client";

import { ThreadDropdownContent } from "./content/thread-dropdown-content";
import { ThreadDropdownNewThread } from "./new-thread/thread-dropdown-new-thread";
import { ThreadDropdownRoot } from "./root/thread-dropdown-root";
import { ThreadDropdownThreadItem } from "./thread-item/thread-dropdown-thread-item";
import { ThreadDropdownTrigger } from "./trigger/thread-dropdown-trigger";

/**
 * ThreadDropdown namespace containing all thread dropdown base components.
 */
const ThreadDropdown = {
  Root: ThreadDropdownRoot,
  Trigger: ThreadDropdownTrigger,
  Content: ThreadDropdownContent,
  NewThread: ThreadDropdownNewThread,
  ThreadItem: ThreadDropdownThreadItem,
};

export type { ThreadDropdownContextValue } from "./root/thread-dropdown-context";
export type {
  ThreadDropdownContentProps,
  ThreadDropdownContentState,
} from "./content/thread-dropdown-content";
export type {
  ThreadDropdownNewThreadProps,
  ThreadDropdownNewThreadState,
} from "./new-thread/thread-dropdown-new-thread";
export type {
  ThreadDropdownRootProps,
  ThreadDropdownRootState,
} from "./root/thread-dropdown-root";
export type {
  ThreadDropdownThreadItemProps,
  ThreadDropdownThreadItemState,
} from "./thread-item/thread-dropdown-thread-item";
export type {
  ThreadDropdownTriggerProps,
  ThreadDropdownTriggerState,
} from "./trigger/thread-dropdown-trigger";

export { ThreadDropdown };
