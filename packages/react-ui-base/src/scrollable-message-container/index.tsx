"use client";

import { ScrollableMessageContainerRoot } from "./root/scrollable-message-container-root";
import { ScrollableMessageContainerScrollToBottom } from "./scroll-to-bottom/scrollable-message-container-scroll-to-bottom";
import { ScrollableMessageContainerViewport } from "./viewport/scrollable-message-container-viewport";

/**
 * ScrollableMessageContainer namespace containing all scrollable message container base components.
 */
const ScrollableMessageContainer = {
  Root: ScrollableMessageContainerRoot,
  Viewport: ScrollableMessageContainerViewport,
  ScrollToBottom: ScrollableMessageContainerScrollToBottom,
};

export type { ScrollableMessageContainerRootContextValue } from "./root/scrollable-message-container-root-context";
export type { ScrollableMessageContainerRootProps } from "./root/scrollable-message-container-root";
export type {
  ScrollableMessageContainerScrollToBottomProps,
  ScrollableMessageContainerScrollToBottomRenderProps,
} from "./scroll-to-bottom/scrollable-message-container-scroll-to-bottom";
export type { ScrollableMessageContainerViewportProps } from "./viewport/scrollable-message-container-viewport";

export { ScrollableMessageContainer };
