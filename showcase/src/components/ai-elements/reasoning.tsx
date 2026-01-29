"use client";

/**
 * AI Elements Reasoning Components (Pattern Demo)
 *
 * These components demonstrate the Vercel AI Elements Reasoning component API pattern.
 * They are simplified implementations for comparison purposes, showing how
 * AI Elements handles collapsible reasoning/thinking displays.
 *
 * @see https://ai-sdk.dev/elements
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface ReasoningContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isStreaming: boolean;
  startTime: number;
}

const ReasoningContext = React.createContext<ReasoningContextValue | null>(
  null,
);

function useReasoningContext() {
  const context = React.useContext(ReasoningContext);
  if (!context) {
    throw new Error(
      "Reasoning components must be used within a Reasoning provider",
    );
  }
  return context;
}

interface ReasoningProps extends React.HTMLAttributes<HTMLDivElement> {
  isStreaming?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * Root container for reasoning display. Manages open/closed state.
 */
const Reasoning = React.forwardRef<HTMLDivElement, ReasoningProps>(
  (
    {
      isStreaming = false,
      defaultOpen = false,
      onOpenChange,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpenState] = React.useState(defaultOpen);
    const startTime = React.useMemo(() => Date.now(), []);

    const setIsOpen = React.useCallback(
      (open: boolean) => {
        setIsOpenState(open);
        onOpenChange?.(open);
      },
      [onOpenChange],
    );

    const contextValue = React.useMemo(
      () => ({ isOpen, setIsOpen, isStreaming, startTime }),
      [isOpen, setIsOpen, isStreaming, startTime],
    );

    return (
      <ReasoningContext.Provider value={contextValue}>
        <div ref={ref} className={cn("flex flex-col", className)} {...props}>
          {children}
        </div>
      </ReasoningContext.Provider>
    );
  },
);
Reasoning.displayName = "Reasoning";

interface ReasoningTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  getThinkingMessage?: (isStreaming: boolean, duration: number) => string;
}

/**
 * Toggle button for expanding/collapsing reasoning content.
 */
const ReasoningTrigger = React.forwardRef<
  HTMLButtonElement,
  ReasoningTriggerProps
>(({ getThinkingMessage, className, ...props }, ref) => {
  const { isOpen, setIsOpen, isStreaming, startTime } = useReasoningContext();
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isStreaming, startTime]);

  let message: string;
  if (getThinkingMessage) {
    message = getThinkingMessage(isStreaming, duration);
  } else if (isStreaming) {
    message = "Thinking...";
  } else {
    message = `Thought for ${duration}s`;
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
        className,
      )}
      aria-expanded={isOpen}
      {...props}
    >
      <span className={cn(isStreaming && "animate-pulse")}>{message}</span>
      <ChevronDown
        className={cn(
          "h-3 w-3 transition-transform duration-200",
          isOpen && "rotate-180",
        )}
      />
    </button>
  );
});
ReasoningTrigger.displayName = "ReasoningTrigger";

interface ReasoningContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Collapsible content area for reasoning steps.
 */
const ReasoningContent = React.forwardRef<
  HTMLDivElement,
  ReasoningContentProps
>(({ children, className, ...props }, ref) => {
  const { isOpen } = useReasoningContext();

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden transition-all duration-200",
        isOpen ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0",
        className,
      )}
      aria-hidden={!isOpen}
      {...props}
    >
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3 space-y-2">
        {children}
      </div>
    </div>
  );
});
ReasoningContent.displayName = "ReasoningContent";

export { Reasoning, ReasoningTrigger, ReasoningContent, useReasoningContext };
export type { ReasoningProps, ReasoningTriggerProps, ReasoningContentProps };
