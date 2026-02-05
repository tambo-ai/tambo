import { Slot } from "@radix-ui/react-slot";
import { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { useOptionalMessageRootContext } from "../../message/root/message-root-context";
import { checkHasContent } from "../../utils/check-has-content";
import { ReasoningInfoRootContext } from "./reasoning-info-context";

/**
 * Formats the reasoning duration in a human-readable format.
 * Converts milliseconds to an appropriate time unit (seconds, minutes, or hours).
 *
 * @param durationMS - The duration in milliseconds
 * @returns The formatted duration string (e.g., "Thought for 5 seconds")
 */
export function formatReasoningDuration(durationMS: number): string {
  const seconds = Math.floor(Math.max(0, durationMS) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 1) return "Thought for less than 1 second";
  if (seconds < 60)
    return `Thought for ${seconds} ${seconds === 1 ? "second" : "seconds"}`;
  if (minutes < 60)
    return `Thought for ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  return `Thought for ${hours} ${hours === 1 ? "hour" : "hours"}`;
}

function getStatusText(
  isLoading: boolean | undefined,
  reasoningDurationMS: number | undefined,
): string {
  if (isLoading) {
    return "Thinking";
  }
  if (reasoningDurationMS) {
    return formatReasoningDuration(reasoningDurationMS);
  }
  return "Done Thinking";
}

export interface ReasoningInfoRootProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /** Default expanded state. Defaults to true. */
  defaultExpanded?: boolean;
  /** Whether to auto-collapse when content arrives. Defaults to true. */
  autoCollapse?: boolean;
  /**
   * The full Tambo thread message object.
   * If not provided, will be read from the parent Message.Root context.
   */
  message?: TamboThreadMessage;
  /** Optional flag to indicate if the reasoning info is in a loading state. */
  isLoading?: boolean;
}

/**
 * Root primitive for reasoning info.
 * Provides context for child components. Returns null if no reasoning data.
 */
export const ReasoningInfoRoot = React.forwardRef<
  HTMLDivElement,
  ReasoningInfoRootProps
>(
  (
    {
      asChild,
      message: messageProp,
      isLoading: isLoadingProp,
      defaultExpanded = true,
      autoCollapse = true,
      children,
      ...props
    },
    ref,
  ) => {
    const messageContext = useOptionalMessageRootContext();
    const message = messageProp ?? messageContext?.message;
    const isLoading = isLoadingProp ?? messageContext?.isLoading;

    if (!message) {
      throw new Error(
        "ReasoningInfo.Root requires a message prop or must be used within a Message.Root component",
      );
    }
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
    const detailsId = React.useId();
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const hasReasoning = !!message.reasoning?.length;
    const statusText = getStatusText(isLoading, message.reasoningDurationMS);

    const contextValue = React.useMemo(
      () => ({
        isExpanded,
        setIsExpanded,
        detailsId,
        isLoading,
        message,
        reasoning: message.reasoning ?? [],
        reasoningDurationMS: message.reasoningDurationMS,
        statusText,
        scrollContainerRef,
      }),
      [isExpanded, detailsId, isLoading, message, statusText],
    );

    // Auto-collapse when content arrives and reasoning is not loading
    React.useEffect(() => {
      if (autoCollapse && checkHasContent(message.content) && !isLoading) {
        setIsExpanded(false);
      }
    }, [message.content, isLoading, autoCollapse]);

    // Auto-scroll to bottom when reasoning content changes
    React.useEffect(() => {
      if (scrollContainerRef.current && isExpanded && message.reasoning) {
        const scroll = () => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        };

        if (isLoading) {
          requestAnimationFrame(scroll);
        } else {
          const timeoutId = setTimeout(scroll, 50);
          return () => clearTimeout(timeoutId);
        }
      }
    }, [message.reasoning, isExpanded, isLoading]);

    // Only show if there's reasoning data
    if (!hasReasoning) {
      return null;
    }

    const Comp = asChild ? Slot : "div";

    return (
      <ReasoningInfoRootContext.Provider value={contextValue}>
        <Comp ref={ref} data-slot="reasoning-info" {...props}>
          {children}
        </Comp>
      </ReasoningInfoRootContext.Provider>
    );
  },
);
ReasoningInfoRoot.displayName = "ReasoningInfo.Root";
