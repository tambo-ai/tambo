"use client";

import * as React from "react";
import { useCanvasDetection } from "../../utils/use-canvas-detection";
import { usePositioning } from "../../utils/use-positioning";
import {
  MessageThreadPanelContext,
  type MessageThreadPanelContextValue,
} from "./message-thread-panel-context";

/**
 * Props passed to the Root render function.
 */
export interface MessageThreadPanelRootRenderProps {
  /** Ref for the panel DOM element. */
  panelRef: React.RefObject<HTMLDivElement | null>;
  /** Current panel width in pixels. */
  width: number;
  /** Whether this panel is on the left side. */
  isLeftPanel: boolean;
  /** Which side the history sidebar should appear on. */
  historyPosition: "left" | "right";
  /** Whether a canvas space element is present. */
  hasCanvasSpace: boolean;
  /** Whether the canvas is positioned to the left. */
  canvasIsOnLeft: boolean;
}

export interface MessageThreadPanelRootProps {
  /** Optional className used for positioning detection (e.g., "right" class). */
  className?: string;
  /** Initial panel width in pixels. Defaults to 956. */
  defaultWidth?: number;
  /** Children as ReactNode or render function receiving layout state. */
  children?:
    | React.ReactNode
    | ((props: MessageThreadPanelRootRenderProps) => React.ReactNode);
}

/**
 * Root primitive for the message thread panel component.
 * Manages layout context: detects canvas presence, determines sidebar position,
 * and tracks panel width state for resizing.
 * Does NOT render DOM — purely provides context for child components.
 * @returns Context provider wrapping children with layout and resize state
 */
export function MessageThreadPanelRoot({
  className,
  defaultWidth = 956,
  children,
}: MessageThreadPanelRootProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(defaultWidth);
  const { hasCanvasSpace, canvasIsOnLeft } = useCanvasDetection(panelRef);
  const { isLeftPanel, historyPosition } = usePositioning(
    className,
    canvasIsOnLeft,
    hasCanvasSpace,
  );

  const contextValue = React.useMemo<MessageThreadPanelContextValue>(
    () => ({
      panelRef,
      width,
      setWidth,
      isLeftPanel,
      historyPosition,
      hasCanvasSpace,
      canvasIsOnLeft,
    }),
    [width, isLeftPanel, historyPosition, hasCanvasSpace, canvasIsOnLeft],
  );

  let content: React.ReactNode;
  if (typeof children === "function") {
    content = children({
      panelRef,
      width,
      isLeftPanel,
      historyPosition,
      hasCanvasSpace,
      canvasIsOnLeft,
    });
  } else {
    content = children;
  }

  return (
    <MessageThreadPanelContext.Provider value={contextValue}>
      {content}
    </MessageThreadPanelContext.Provider>
  );
}
