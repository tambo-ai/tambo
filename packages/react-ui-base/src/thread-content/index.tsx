"use client";

import { ThreadContentEmpty } from "./empty/thread-content-empty";
import { ThreadContentLoading } from "./loading/thread-content-loading";
import { ThreadContentMessages } from "./messages/thread-content-messages";
import { ThreadContentRoot } from "./root/thread-content-root";

/**
 * ThreadContent namespace containing all thread content base components.
 */
const ThreadContent = {
  Root: ThreadContentRoot,
  Messages: ThreadContentMessages,
  Empty: ThreadContentEmpty,
  Loading: ThreadContentLoading,
};

export type { ThreadContentContextValue } from "./root/thread-content-context";
export { useThreadContentContext } from "./root/thread-content-context";
export type {
  ThreadContentRootProps,
  ThreadContentRootState,
} from "./root/thread-content-root";
export type {
  ThreadContentMessagesProps,
  ThreadContentMessagesState,
} from "./messages/thread-content-messages";
export type {
  ThreadContentEmptyProps,
  ThreadContentEmptyState,
} from "./empty/thread-content-empty";
export type {
  ThreadContentLoadingProps,
  ThreadContentLoadingState,
} from "./loading/thread-content-loading";

export type { useRender } from "@base-ui/react/use-render";

export { ThreadContent };
