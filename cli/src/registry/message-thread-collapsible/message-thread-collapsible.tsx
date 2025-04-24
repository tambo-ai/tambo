"use client";

import { MessageInput } from "@/components/ui/message-input";
import { MessageSuggestions } from "@/components/ui/message-suggestions";
import { ThreadContent } from "@/components/ui/thread-content";
import { ThreadHistory } from "@/components/ui/thread-history";
import { cn } from "@/lib/utils";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useTambo } from "@tambo-ai/react";
import { XIcon } from "lucide-react";
import * as React from "react";
import { useEffect, useRef } from "react";
import type { messageVariants } from "@/components/ui/message";
import type { VariantProps } from "class-variance-authority";

/**
 * Props for the MessageThreadCollapsible component
 * @interface
 * @extends React.HTMLAttributes<HTMLDivElement>
 */
export interface MessageThreadCollapsibleProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional context key for the thread */
  contextKey?: string;
  /** Whether the collapsible should be open by default (default: false) */
  defaultOpen?: boolean;
  /** Whether to enable the canvas space */
  enableCanvasSpace?: boolean;
  /** Optional styling variant for the message container */
  variant?: VariantProps<typeof messageVariants>["variant"];
  /** position of the panel */
  position?: "left" | "right";
}

/**
 * A collapsible chat thread component with keyboard shortcuts and thread management
 * @component
 * @example
 * ```tsx
 * <MessageThreadCollapsible
 *   contextKey="my-thread"
 *   defaultOpen={false}
 *   className="custom-styles"
 *   enableCanvasSpace={true}
 *   position="left"
 *   variant="default"
 * />
 * ```
 */
export const MessageThreadCollapsible = React.forwardRef<
  HTMLDivElement,
  MessageThreadCollapsibleProps
>(
  (
    {
      className,
      contextKey,
      defaultOpen = false,
      enableCanvasSpace = false,
      variant,
      position = "right",
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    const isMac =
      typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { thread } = useTambo();

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "k") {
          event.preventDefault();
          setIsOpen((prev) => !prev);
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, []);

    const shortcutText = isMac ? "⌘K" : "Ctrl+K";

    const handleThreadChange = React.useCallback(() => {
      setIsOpen(true);
    }, []);

    useEffect(() => {
      if (scrollContainerRef.current && thread?.messages?.length) {
        const timeoutId = setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    }, [thread?.messages]);

    return (
      <Collapsible.Root
        ref={ref}
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn(
          "fixed bottom-4 right-4 w-full max-w-sm sm:max-w-md md:max-w-lg rounded-lg shadow-lg transition-all duration-200 bg-background border border-gray-200",
          position === "left" && "left-4",
          className,
        )}
        {...props}
      >
        <Collapsible.Trigger asChild>
          <button
            className={cn(
              "flex items-center justify-between w-full p-4",
              "hover:bg-muted/50 transition-colors",
              isOpen,
            )}
            aria-expanded={isOpen}
            aria-controls="message-thread-content"
          >
            <div className="flex items-center gap-2">
              <span>{isOpen ? "Conversations" : "Use AI"}</span>
              {isOpen && (
                <ThreadHistory
                  contextKey={contextKey}
                  onThreadChange={handleThreadChange}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs text-muted-foreground pl-8"
                suppressHydrationWarning
              >
                {isOpen ? "" : `(${shortcutText})`}
              </span>
              {isOpen && (
                <div
                  role="button"
                  className="p-1 rounded-full hover:bg-muted/70 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  aria-label="Close"
                >
                  <XIcon className="h-4 w-4" />
                </div>
              )}
            </div>
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div className="h-[600px] flex flex-col">
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar:horizontal]:h-[4px]"
            >
              <ThreadContent
                enableCanvasSpace={enableCanvasSpace}
                variant={variant}
              />
            </div>
            <div className="p-4">
              <MessageInput contextKey={contextKey} />
            </div>
            <MessageSuggestions />
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    );
  },
);
MessageThreadCollapsible.displayName = "MessageThreadCollapsible";
