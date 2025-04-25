"use client";

import {
  MessageInputRoot,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputSubmitButton,
  MessageInputError,
} from "@/components/ui/message-input";
import {
  MessageSuggestionsRoot,
  MessageSuggestionsStatus,
  MessageSuggestionsList,
} from "@/components/ui/message-suggestions";
import {
  ThreadContentRoot,
  ThreadContentMessages,
} from "@/components/ui/thread-content";
import type { messageVariants } from "@/components/ui/message";
import { ThreadDropdown } from "@/components/ui/thread-dropdown";
import { cn } from "@/lib/utils";
import { Collapsible } from "radix-ui";
import { useTambo } from "@tambo-ai/react";
import { XIcon } from "lucide-react";
import * as React from "react";
import { useEffect, useRef } from "react";
import { type VariantProps } from "class-variance-authority";

/**
 * Custom hook for managing collapsible state with keyboard shortcuts
 */
const useCollapsibleState = (defaultOpen = false) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const isMac =
    typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");
  const shortcutText = isMac ? "⌘K" : "Ctrl+K";

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen, shortcutText };
};

/**
 * Props for the CollapsibleContainer component
 */
interface CollapsibleContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  position?: "left" | "right";
  children: React.ReactNode;
}

/**
 * Container component for the collapsible panel
 */
const CollapsibleContainer = React.forwardRef<
  HTMLDivElement,
  CollapsibleContainerProps
>(
  (
    { className, isOpen, onOpenChange, position = "right", children, ...props },
    ref,
  ) => (
    <Collapsible.Root
      ref={ref}
      open={isOpen}
      onOpenChange={onOpenChange}
      className={cn(
        "fixed bottom-4 right-4 w-full max-w-sm sm:max-w-md md:max-w-lg rounded-lg shadow-lg transition-all duration-200 bg-background border border-gray-200",
        position === "left" && "left-4",
        className,
      )}
      {...props}
    >
      {children}
    </Collapsible.Root>
  ),
);
CollapsibleContainer.displayName = "CollapsibleContainer";

/**
 * Props for the CollapsibleTrigger component
 */
interface CollapsibleTriggerProps {
  isOpen: boolean;
  shortcutText: string;
  onClose: () => void;
  contextKey?: string;
  onThreadChange: () => void;
}

/**
 * Trigger component for the collapsible panel
 */
const CollapsibleTrigger = ({
  isOpen,
  shortcutText,
  onClose,
  contextKey,
  onThreadChange,
}: CollapsibleTriggerProps) => (
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
          <ThreadDropdown
            contextKey={contextKey}
            onThreadChange={onThreadChange}
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
              onClose();
            }}
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </div>
        )}
      </div>
    </button>
  </Collapsible.Trigger>
);
CollapsibleTrigger.displayName = "CollapsibleTrigger";

/**
 * Scrollable message container with auto-scroll functionality
 */
const ScrollableMessageContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { thread } = useTambo();

  React.useImperativeHandle(ref, () => scrollContainerRef.current!, []);

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
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar:horizontal]:h-[4px]"
      {...props}
    >
      {children}
    </div>
  );
});
ScrollableMessageContainer.displayName = "ScrollableMessageContainer";

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
    const { isOpen, setIsOpen, shortcutText } =
      useCollapsibleState(defaultOpen);

    const handleThreadChange = React.useCallback(() => {
      setIsOpen(true);
    }, [setIsOpen]);

    return (
      <CollapsibleContainer
        ref={ref}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        position={position}
        className={className}
        {...props}
      >
        <CollapsibleTrigger
          isOpen={isOpen}
          shortcutText={shortcutText}
          onClose={() => setIsOpen(false)}
          contextKey={contextKey}
          onThreadChange={handleThreadChange}
        />
        <Collapsible.Content>
          <div className="h-[600px] flex flex-col">
            <ScrollableMessageContainer>
              <ThreadContentRoot
                enableCanvasSpace={enableCanvasSpace}
                variant={variant}
              >
                <ThreadContentMessages />
              </ThreadContentRoot>
            </ScrollableMessageContainer>
            <div className="p-4">
              <MessageInputRoot contextKey={contextKey}>
                <MessageInputTextarea />
                <MessageInputToolbar>
                  <MessageInputSubmitButton />
                </MessageInputToolbar>
                <MessageInputError />
              </MessageInputRoot>
            </div>
            <MessageSuggestionsRoot>
              <MessageSuggestionsStatus />
              <MessageSuggestionsList />
            </MessageSuggestionsRoot>
          </div>
        </Collapsible.Content>
      </CollapsibleContainer>
    );
  },
);
MessageThreadCollapsible.displayName = "MessageThreadCollapsible";
