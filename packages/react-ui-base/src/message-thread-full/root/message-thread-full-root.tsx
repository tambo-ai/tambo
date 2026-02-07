"use client";

import * as React from "react";
import {
  MessageThreadFullContext,
  type MessageThreadFullContextValue,
} from "./message-thread-full-context";
import { useCanvasDetection } from "../../utils/use-canvas-detection";
import { usePositioning } from "../../utils/use-positioning";

/**
 * Props passed to the Root render function.
 */
export interface MessageThreadFullRootRenderProps {
  /** Ref for the container element used for canvas detection. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Whether canvas space is present in the layout. */
  hasCanvasSpace: boolean;
  /** Whether the canvas is positioned on the left side. */
  canvasIsOnLeft: boolean;
  /** Whether this thread is positioned as a left panel. */
  isLeftPanel: boolean;
  /** Which side the history sidebar is positioned on. */
  historyPosition: "left" | "right";
}

export interface MessageThreadFullRootProps {
  /** Optional className used for positioning detection (e.g., "right" class). */
  className?: string;
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
  className,
  children,
}: MessageThreadFullRootProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { hasCanvasSpace, canvasIsOnLeft } = useCanvasDetection(containerRef);
  const { isLeftPanel, historyPosition } = usePositioning(
    className,
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

  let content: React.ReactNode;
  if (typeof children === "function") {
    content = children({
      containerRef,
      hasCanvasSpace,
      canvasIsOnLeft,
      isLeftPanel,
      historyPosition,
    });
  } else {
    content = children;
  }

  return (
    <MessageThreadFullContext.Provider value={contextValue}>
      {content}
    </MessageThreadFullContext.Provider>
  );
}
