"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useMergeRefs } from "../../utils/use-merge-refs";
import { useMessageThreadPanelContext } from "../root/message-thread-panel-context";

/**
 * Props passed to the Resizable render function.
 */
export interface MessageThreadPanelResizableRenderProps {
  /** Current panel width in pixels. */
  width: number;
  /** Whether the panel is on the left side. */
  isLeftPanel: boolean;
  /** Whether the panel is currently being resized. */
  isResizing: boolean;
}

export interface MessageThreadPanelResizableProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /** Minimum width of the panel in pixels. Defaults to 300. */
  minWidth?: number;
  /** Children as ReactNode or render function receiving resize state. */
  children?:
    | React.ReactNode
    | ((props: MessageThreadPanelResizableRenderProps) => React.ReactNode);
}

/**
 * Resizable container primitive for the message thread panel.
 * Renders a div with a draggable resize handle that adjusts panel width.
 * The resize handle is positioned on the right for left panels and on the left
 * for right panels.
 * @returns The resizable container with drag handle
 */
export const MessageThreadPanelResizable = React.forwardRef<
  HTMLDivElement,
  MessageThreadPanelResizableProps
>(function MessageThreadPanelResizable(
  { children, asChild, minWidth = 300, style, ...props },
  ref,
) {
  const { panelRef, width, setWidth, isLeftPanel } =
    useMessageThreadPanelContext();
  const mergedRef = useMergeRefs<HTMLDivElement | null>(ref, panelRef);
  const isResizingRef = React.useRef(false);
  const lastUpdateRef = React.useRef(0);
  const [isResizing, setIsResizing] = React.useState(false);

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isResizingRef.current) return;

      const now = Date.now();
      if (now - lastUpdateRef.current < 16) return;
      lastUpdateRef.current = now;

      const windowWidth = window.innerWidth;

      requestAnimationFrame(() => {
        let newWidth;
        if (isLeftPanel) {
          newWidth = Math.round(e.clientX);
        } else {
          newWidth = Math.round(windowWidth - e.clientX);
        }

        const clampedWidth = Math.max(
          minWidth,
          Math.min(windowWidth - minWidth, newWidth),
        );
        setWidth(clampedWidth);

        if (isLeftPanel) {
          document.documentElement.style.setProperty(
            "--panel-left-width",
            `${clampedWidth}px`,
          );
        } else {
          document.documentElement.style.setProperty(
            "--panel-right-width",
            `${clampedWidth}px`,
          );
        }
      });
    },
    [isLeftPanel, minWidth, setWidth],
  );

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizingRef.current = true;
      setIsResizing(true);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener(
        "mouseup",
        () => {
          isResizingRef.current = false;
          setIsResizing(false);
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
          document.removeEventListener("mousemove", handleMouseMove);
        },
        { once: true },
      );
    },
    [handleMouseMove],
  );

  let content: React.ReactNode;
  if (typeof children === "function") {
    content = children({ width, isLeftPanel, isResizing });
  } else {
    content = children;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={mergedRef}
      data-slot="message-thread-panel-resizable"
      data-left-panel={isLeftPanel}
      data-resizing={isResizing}
      style={{ width: `${width}px`, flex: "0 0 auto", ...style }}
      {...props}
    >
      {/* Resize handle */}
      <div
        data-slot="message-thread-panel-resize-handle"
        data-position={isLeftPanel ? "right" : "left"}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "4px",
          cursor: "ew-resize",
          zIndex: 50,
          ...(isLeftPanel ? { right: 0 } : { left: 0 }),
        }}
        onMouseDown={handleMouseDown}
      />
      {content}
    </Comp>
  );
});
