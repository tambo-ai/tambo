"use client";

import { ThreadContentMessage } from "./message/thread-content-message";
import { ThreadContentMessageList } from "./message-list/thread-content-message-list";
import { ThreadContentRoot } from "./root/thread-content-root";

/**
 * ThreadContent namespace containing all thread content base components.
 */
const ThreadContent = {
  Root: ThreadContentRoot,
  MessageList: ThreadContentMessageList,
  Message: ThreadContentMessage,
};

export type {
  ThreadContentMessageListProps,
  ThreadContentMessageListRenderProps,
} from "./message-list/thread-content-message-list";
export type { ThreadContentMessageProps } from "./message/thread-content-message";
export type { ThreadContentRootContextValue } from "./root/thread-content-root-context";
export type { ThreadContentRootProps } from "./root/thread-content-root";

export { getMessageKey } from "./message/thread-content-message";
export {
  useOptionalThreadContentRootContext,
  useThreadContentRootContext,
} from "./root/thread-content-root-context";
export { ThreadContent };
