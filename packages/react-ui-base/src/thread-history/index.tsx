"use client";

import { ThreadHistoryCollapseToggle } from "./collapse-toggle/thread-history-collapse-toggle";
import { ThreadHistoryHeader } from "./header/thread-history-header";
import { ThreadHistoryItem } from "./item/thread-history-item";
import { ThreadHistoryList } from "./list/thread-history-list";
import { ThreadHistoryNewThreadButton } from "./new-thread-button/thread-history-new-thread-button";
import { ThreadHistoryRoot } from "./root/thread-history-root";
import { ThreadHistorySearchInput } from "./search-input/thread-history-search-input";

/**
 * ThreadHistory namespace containing all thread history base components.
 */
const ThreadHistory = {
  Root: ThreadHistoryRoot,
  Header: ThreadHistoryHeader,
  CollapseToggle: ThreadHistoryCollapseToggle,
  NewThreadButton: ThreadHistoryNewThreadButton,
  SearchInput: ThreadHistorySearchInput,
  List: ThreadHistoryList,
  Item: ThreadHistoryItem,
};

export type { ThreadHistoryCollapseToggleProps } from "./collapse-toggle/thread-history-collapse-toggle";
export type {
  ThreadHistoryHeaderProps,
  ThreadHistoryHeaderRenderProps,
} from "./header/thread-history-header";
export type {
  ThreadHistoryItemProps,
  ThreadHistoryItemRenderProps,
} from "./item/thread-history-item";
export type {
  ThreadHistoryListProps,
  ThreadHistoryListRenderProps,
} from "./list/thread-history-list";
export type {
  ThreadHistoryNewThreadButtonProps,
  ThreadHistoryNewThreadButtonRenderProps,
} from "./new-thread-button/thread-history-new-thread-button";
export type {
  ThreadHistoryRootProps,
  ThreadHistoryRootRenderProps,
} from "./root/thread-history-root";
export type { ThreadHistoryRootContextValue } from "./root/thread-history-root-context";
export type {
  ThreadHistorySearchInputProps,
  ThreadHistorySearchInputRenderProps,
} from "./search-input/thread-history-search-input";

export { ThreadHistory };
