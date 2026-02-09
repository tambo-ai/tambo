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

export interface MessageThreadPanelResizableProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /** Minimum width of the panel in pixels. Defaults to 300. */
  minWidth?: number;
  /** Width increment for keyboard resizing in pixels. Defaults to 20. */
  keyboardStep?: number;
  /** Children as ReactNode or render function receiving resize state. */
  children?:
    | React.ReactNode
    | ((props: MessageThreadPanelResizableRenderProps) => React.ReactNode);
}

const KEYBOARD_STEP_DEFAULT = 20;

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
  {
    children,
    asChild,
    minWidth = 300,
    keyboardStep = KEYBOARD_STEP_DEFAULT,
    style,
    ...props
  },
  ref,
) {
  const { panelRef, width, setWidth, isLeftPanel } =
    useMessageThreadPanelContext();
  const mergedRef = useMergeRefs<HTMLDivElement | null>(ref, panelRef);
  const isResizingRef = React.useRef(false);
  const handleMouseMoveRef = React.useRef<((e: MouseEvent) => void) | null>(
    null,
  );
  const [isResizing, setIsResizing] = React.useState(false);

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      requestAnimationFrame(() => {
        if (!isResizingRef.current) return;

        const windowWidth = window.innerWidth;
        const newWidth = isLeftPanel
          ? Math.round(e.clientX)
          : Math.round(windowWidth - e.clientX);

        const clampedWidth = Math.max(
          minWidth,
          Math.min(windowWidth - minWidth, newWidth),
        );
        setWidth(clampedWidth);

        const prop = isLeftPanel ? "--panel-left-width" : "--panel-right-width";
        document.documentElement.style.setProperty(prop, `${clampedWidth}px`);
      });
    },
    [isLeftPanel, minWidth, setWidth],
  );

  // Store latest handleMouseMove in ref for cleanup
  handleMouseMoveRef.current = handleMouseMove;

  // Clean up drag listeners on unmount
  React.useEffect(() => {
    return () => {
      if (handleMouseMoveRef.current) {
        document.removeEventListener("mousemove", handleMouseMoveRef.current);
      }
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      isResizingRef.current = false;

      const prop = isLeftPanel ? "--panel-left-width" : "--panel-right-width";
      document.documentElement.style.removeProperty(prop);
    };
  }, [isLeftPanel]);

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

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const windowWidth = window.innerWidth;
      const grow = isLeftPanel ? "ArrowRight" : "ArrowLeft";
      const shrink = isLeftPanel ? "ArrowLeft" : "ArrowRight";

      if (e.key === grow || e.key === shrink) {
        e.preventDefault();
        const delta = e.key === grow ? keyboardStep : -keyboardStep;
        const newWidth = Math.max(
          minWidth,
          Math.min(windowWidth - minWidth, width + delta),
        );
        setWidth(newWidth);

        const prop = isLeftPanel ? "--panel-left-width" : "--panel-right-width";
        document.documentElement.style.setProperty(prop, `${newWidth}px`);
      }
    },
    [isLeftPanel, keyboardStep, minWidth, width, setWidth],
  );

  const content =
    typeof children === "function"
      ? children({ width, isLeftPanel, isResizing })
      : children;

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
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        aria-valuenow={width}
        tabIndex={0}
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
        onKeyDown={handleKeyDown}
      />
      {content}
    </Comp>
  );
});
MessageThreadPanelResizable.displayName = "MessageThreadPanel.Resizable";
