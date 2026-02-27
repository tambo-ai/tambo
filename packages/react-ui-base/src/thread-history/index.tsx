"use client";

import { ThreadHistoryItem } from "./item/thread-history-item";
import { ThreadHistoryList } from "./list/thread-history-list";
import { ThreadHistoryNewThreadButton } from "./new-thread-button/thread-history-new-thread-button";
import { ThreadHistoryRoot } from "./root/thread-history-root";
import { ThreadHistorySearch } from "./search/thread-history-search";

/**
 * ThreadHistory namespace containing all thread history base components.
 */
const ThreadHistory = {
  Root: ThreadHistoryRoot,
  Search: ThreadHistorySearch,
  List: ThreadHistoryList,
  Item: ThreadHistoryItem,
  NewThreadButton: ThreadHistoryNewThreadButton,
};

export type { ThreadListItem } from "./root/thread-history-context";
export type { ThreadHistoryContextValue } from "./root/thread-history-context";
export type {
  ThreadHistoryItemProps,
  ThreadHistoryItemState,
} from "./item/thread-history-item";
export type {
  ThreadHistoryListProps,
  ThreadHistoryListState,
} from "./list/thread-history-list";
export type {
  ThreadHistoryNewThreadButtonProps,
  ThreadHistoryNewThreadButtonState,
} from "./new-thread-button/thread-history-new-thread-button";
export type {
  ThreadHistoryRootProps,
  ThreadHistoryRootState,
} from "./root/thread-history-root";
export type {
  ThreadHistorySearchProps,
  ThreadHistorySearchState,
} from "./search/thread-history-search";

export { ThreadHistory };
