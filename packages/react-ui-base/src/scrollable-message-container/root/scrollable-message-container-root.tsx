import { Slot } from "@radix-ui/react-slot";
import { GenerationStage, useTambo } from "@tambo-ai/react";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { ScrollableMessageContainerRootContext } from "./scrollable-message-container-root-context";

export type ScrollableMessageContainerRootProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement>
>;

/**
 * Root primitive for the scrollable message container component.
 * Manages auto-scroll state, scroll position tracking, and thread message observation.
 * Provides context for child components (Viewport, ScrollToBottom).
 * @returns The root scrollable message container element with context provider
 */
export const ScrollableMessageContainerRoot = React.forwardRef<
  HTMLDivElement,
  ScrollableMessageContainerRootProps
>(function ScrollableMessageContainerRoot(
  { children, asChild, ...props },
  ref,
) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const { thread } = useTambo();
  const [shouldAutoscroll, setShouldAutoscroll] = React.useState(true);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const lastScrollTopRef = React.useRef(0);

  const messagesContent = React.useMemo(() => {
    if (!thread.messages) return null;

    return thread.messages.map((message) => ({
      id: message.id,
      content: message.content,
      tool_calls: message.tool_calls,
      component: message.component,
      reasoning: message.reasoning,
      componentState: message.componentState,
    }));
  }, [thread.messages]);

  const generationStage = React.useMemo(
    () => thread?.generationStage ?? GenerationStage.IDLE,
    [thread?.generationStage],
  );

  const scrollToBottom = React.useCallback(() => {
    if (!viewportRef.current) return;

    viewportRef.current.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const suspendAutoscroll = React.useCallback(() => {
    setShouldAutoscroll(false);
  }, []);

  const resumeAutoscroll = React.useCallback(() => {
    setShouldAutoscroll(true);
  }, []);

  /**
   * Handle scroll events from the viewport to detect user scrolling direction
   * and update isAtBottom state.
   */
  const handleViewportScroll = React.useCallback(() => {
    if (!viewportRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
    const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 8;

    setIsAtBottom(atBottom);

    if (scrollTop < lastScrollTopRef.current) {
      setShouldAutoscroll(false);
    } else if (atBottom) {
      setShouldAutoscroll(true);
    }

    lastScrollTopRef.current = scrollTop;
  }, []);

  /**
   * Attach scroll listener to the viewport element.
   */
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.addEventListener("scroll", handleViewportScroll);
    return () => {
      viewport.removeEventListener("scroll", handleViewportScroll);
    };
  }, [handleViewportScroll]);

  /**
   * Auto-scroll to bottom when message content changes and autoscroll is enabled.
   */
  React.useEffect(() => {
    if (viewportRef.current && messagesContent && shouldAutoscroll) {
      const scroll = () => {
        if (viewportRef.current) {
          viewportRef.current.scrollTo({
            top: viewportRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      };

      if (generationStage === GenerationStage.STREAMING_RESPONSE) {
        requestAnimationFrame(scroll);
      } else {
        const timeoutId = setTimeout(scroll, 50);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [messagesContent, generationStage, shouldAutoscroll]);

  const contextValue = React.useMemo(
    () => ({
      shouldAutoscroll,
      isAtBottom,
      scrollToBottom,
      suspendAutoscroll,
      resumeAutoscroll,
      viewportRef,
    }),
    [
      shouldAutoscroll,
      isAtBottom,
      scrollToBottom,
      suspendAutoscroll,
      resumeAutoscroll,
    ],
  );

  const Comp = asChild ? Slot : "div";

  return (
    <ScrollableMessageContainerRootContext.Provider value={contextValue}>
      <Comp ref={ref} data-slot="scrollable-message-container-root" {...props}>
        {children}
      </Comp>
    </ScrollableMessageContainerRootContext.Provider>
  );
});
