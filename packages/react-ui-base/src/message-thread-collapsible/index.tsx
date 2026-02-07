"use client";

import { MessageThreadCollapsibleContent } from "./content/message-thread-collapsible-content";
import { MessageThreadCollapsibleHeader } from "./header/message-thread-collapsible-header";
import { MessageThreadCollapsibleRoot } from "./root/message-thread-collapsible-root";
import { MessageThreadCollapsibleTrigger } from "./trigger/message-thread-collapsible-trigger";

/**
 * MessageThreadCollapsible namespace containing all message thread collapsible base components.
 */
const MessageThreadCollapsible = {
  Root: MessageThreadCollapsibleRoot,
  Trigger: MessageThreadCollapsibleTrigger,
  Header: MessageThreadCollapsibleHeader,
  Content: MessageThreadCollapsibleContent,
};

export type {
  MessageThreadCollapsibleContentProps,
  MessageThreadCollapsibleContentRenderProps,
} from "./content/message-thread-collapsible-content";
export type {
  MessageThreadCollapsibleHeaderProps,
  MessageThreadCollapsibleHeaderRenderProps,
} from "./header/message-thread-collapsible-header";
export type { MessageThreadCollapsibleContextValue } from "./root/message-thread-collapsible-context";
export type {
  MessageThreadCollapsibleRootProps,
  MessageThreadCollapsibleRootRenderProps,
} from "./root/message-thread-collapsible-root";
export type {
  MessageThreadCollapsibleTriggerProps,
  MessageThreadCollapsibleTriggerRenderProps,
} from "./trigger/message-thread-collapsible-trigger";

export { MessageThreadCollapsible };
