"use client";

import * as React from "react";
import {
  MessageThreadFullContext,
  type MessageThreadFullContextValue,
} from "./message-thread-full-context";
import { useCanvasDetection } from "../../utils/use-canvas-detection";
import { getPositioning } from "../../utils/use-positioning";

/**
 * Props passed to the Root render function.
 */
export type MessageThreadFullRootRenderProps = MessageThreadFullContextValue;

export interface MessageThreadFullRootProps {
  /** Which side this panel is on. Defaults to "left". */
  position?: "left" | "right";
  /** Children as ReactNode or render function receiving layout state. */
  children?:
    | React.ReactNode
    | ((props: MessageThreadFullRootRenderProps) => React.ReactNode);
}

/**
 * Root primitive for the message thread full component.
 * Manages layout context: detects canvas presence and determines sidebar position.
 * Does NOT render DOM — purely provides context for child components.
 * @returns Context provider wrapping children with layout state
 */
export function MessageThreadFullRoot({
  position,
  children,
}: MessageThreadFullRootProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { hasCanvasSpace, canvasIsOnLeft } = useCanvasDetection(containerRef);
  const { isLeftPanel, historyPosition } = getPositioning(
    position,
    canvasIsOnLeft,
    hasCanvasSpace,
  );

  const contextValue = React.useMemo<MessageThreadFullContextValue>(
    () => ({
      containerRef,
      hasCanvasSpace,
      canvasIsOnLeft,
      isLeftPanel,
      historyPosition,
    }),
    [hasCanvasSpace, canvasIsOnLeft, isLeftPanel, historyPosition],
  );

  const content =
    typeof children === "function" ? children(contextValue) : children;

  return (
    <MessageThreadFullContext.Provider value={contextValue}>
      {content}
    </MessageThreadFullContext.Provider>
  );
}
MessageThreadFullRoot.displayName = "MessageThreadFull.Root";
