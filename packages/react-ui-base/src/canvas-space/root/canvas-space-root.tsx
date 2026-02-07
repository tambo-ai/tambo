"use client";

import { Slot } from "@radix-ui/react-slot";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { useTamboThread } from "@tambo-ai/react";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { CanvasSpaceRootContext } from "./canvas-space-root-context";

export type CanvasSpaceRootProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement>
>;

/**
 * Root primitive for the canvas space component.
 * Manages thread tracking, custom event listeners, and component state.
 * Provides context for child components.
 * @returns The root canvas space element with context provider
 */
export const CanvasSpaceRoot = React.forwardRef<
  HTMLDivElement,
  CanvasSpaceRootProps
>(function CanvasSpaceRoot({ children, asChild, ...props }, ref) {
  const { thread } = useTamboThread();

  const [renderedComponent, setRenderedComponent] =
    React.useState<React.ReactNode | null>(null);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const previousThreadId = React.useRef<string | null>(null);

  /**
   * Clear the canvas when switching between threads.
   * Prevents components from previous threads being displayed in new threads.
   */
  React.useEffect(() => {
    if (
      !thread ||
      (previousThreadId.current && previousThreadId.current !== thread.id)
    ) {
      setRenderedComponent(null);
    }

    previousThreadId.current = thread?.id ?? null;
  }, [thread]);

  /**
   * Handle custom 'tambo:showComponent' events.
   * Allows external triggers to update the rendered component.
   */
  React.useEffect(() => {
    const handleShowComponent = (
      event: CustomEvent<{ messageId: string; component: React.ReactNode }>,
    ) => {
      try {
        setRenderedComponent(event.detail.component);
      } catch (error) {
        console.error("Failed to render component:", error);
        setRenderedComponent(null);
      }
    };

    window.addEventListener(
      "tambo:showComponent",
      handleShowComponent as EventListener,
    );

    return () => {
      window.removeEventListener(
        "tambo:showComponent",
        handleShowComponent as EventListener,
      );
    };
  }, []);

  /**
   * Automatically display the latest component from thread messages.
   * Updates when thread messages change or new components are added.
   */
  React.useEffect(() => {
    if (!thread?.messages) {
      setRenderedComponent(null);
      return;
    }

    const messagesWithComponents = thread.messages.filter(
      (msg: TamboThreadMessage) => msg.renderedComponent,
    );

    if (messagesWithComponents.length > 0) {
      const latestMessage =
        messagesWithComponents[messagesWithComponents.length - 1];
      setRenderedComponent(latestMessage.renderedComponent);
    }
  }, [thread?.messages]);

  const contextValue = React.useMemo(
    () => ({ renderedComponent, scrollContainerRef }),
    [renderedComponent],
  );

  const Comp = asChild ? Slot : "div";

  return (
    <CanvasSpaceRootContext.Provider value={contextValue}>
      <Comp
        ref={ref}
        data-slot="canvas-space-root"
        data-canvas-space="true"
        {...props}
      >
        {children}
      </Comp>
    </CanvasSpaceRootContext.Provider>
  );
});
