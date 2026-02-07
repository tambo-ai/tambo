"use client";

import { MessageThreadFullContainer } from "./container/message-thread-full-container";
import { MessageThreadFullRoot } from "./root/message-thread-full-root";
import { MessageThreadFullSidebar } from "./sidebar/message-thread-full-sidebar";

/**
 * MessageThreadFull namespace containing all message thread full base components.
 */
const MessageThreadFull = {
  Root: MessageThreadFullRoot,
  Container: MessageThreadFullContainer,
  Sidebar: MessageThreadFullSidebar,
};

export type {
  MessageThreadFullContainerProps,
  MessageThreadFullContainerRenderProps,
} from "./container/message-thread-full-container";
export type {
  MessageThreadFullRootProps,
  MessageThreadFullRootRenderProps,
} from "./root/message-thread-full-root";
export type { MessageThreadFullContextValue } from "./root/message-thread-full-context";
export type { MessageThreadFullSidebarProps } from "./sidebar/message-thread-full-sidebar";

export { MessageThreadFull };
