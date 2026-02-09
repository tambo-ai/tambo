"use client";

import { MessageThreadPanelContent } from "./content/message-thread-panel-content";
import { MessageThreadPanelResizable } from "./resizable/message-thread-panel-resizable";
import { MessageThreadPanelRoot } from "./root/message-thread-panel-root";
import { MessageThreadPanelSidebar } from "./sidebar/message-thread-panel-sidebar";

/**
 * MessageThreadPanel namespace containing all message thread panel base components.
 */
const MessageThreadPanel = {
  Root: MessageThreadPanelRoot,
  Resizable: MessageThreadPanelResizable,
  Content: MessageThreadPanelContent,
  Sidebar: MessageThreadPanelSidebar,
};

export type { MessageThreadPanelContextValue } from "./root/message-thread-panel-context";
export type { MessageThreadPanelContentProps } from "./content/message-thread-panel-content";
export type {
  MessageThreadPanelResizableProps,
  MessageThreadPanelResizableRenderProps,
} from "./resizable/message-thread-panel-resizable";
export type {
  MessageThreadPanelRootProps,
  MessageThreadPanelRootRenderProps,
} from "./root/message-thread-panel-root";
export type { MessageThreadPanelSidebarProps } from "./sidebar/message-thread-panel-sidebar";

export { MessageThreadPanel };
