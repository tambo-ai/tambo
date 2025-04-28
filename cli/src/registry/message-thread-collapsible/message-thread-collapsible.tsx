"use client";

import {
  MessageInput,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputSubmitButton,
  MessageInputError,
} from "@/components/ui/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsStatus,
  MessageSuggestionsList,
} from "@/components/ui/message-suggestions";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/ui/thread-content";
import type { messageVariants } from "@/components/ui/message";
import { ThreadDropdown } from "@/components/ui/thread-dropdown";
import { ScrollableMessageContainer } from "@/components/ui/scrollable-message-container";
import { cn } from "@/lib/utils";
import { Collapsible } from "radix-ui";
import { XIcon } from "lucide-react";
import * as React from "react";
import { type VariantProps } from "class-variance-authority";

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
  /**
   * Controls the visual styling of messages in the thread.
   * Possible values include: "default", "compact", etc.
   * These values are defined in messageVariants from "@/components/ui/message".
   * @example variant="compact"
   */
  variant?: VariantProps<typeof messageVariants>["variant"];
}

/**
 * A collapsible chat thread component with keyboard shortcuts and thread management
 * @component
 * @example
 * ```tsx
 * <MessageThreadCollapsible
 *   contextKey="my-thread"
 *   defaultOpen={false}
 *   className="left-4" // Position on the left instead of right
 *   variant="default"
 * />
 * ```
 */

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
  children: React.ReactNode;
}

/**
 * Container component for the collapsible panel
 */
const CollapsibleContainer = React.forwardRef<
  HTMLDivElement,
  CollapsibleContainerProps
>(({ className, isOpen, onOpenChange, children, ...props }, ref) => (
  <Collapsible.Root
    ref={ref}
    open={isOpen}
    onOpenChange={onOpenChange}
    className={cn(
      "fixed bottom-4 right-4 w-full max-w-sm sm:max-w-md md:max-w-lg rounded-lg shadow-lg transition-all duration-200 bg-background border border-gray-200",
      className,
    )}
    {...props}
  >
    {children}
  </Collapsible.Root>
));
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

export const MessageThreadCollapsible = React.forwardRef<
  HTMLDivElement,
  MessageThreadCollapsibleProps
>(({ className, contextKey, defaultOpen = false, variant, ...props }, ref) => {
  const { isOpen, setIsOpen, shortcutText } = useCollapsibleState(defaultOpen);

  const handleThreadChange = React.useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  return (
    <CollapsibleContainer
      ref={ref}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
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
            <ThreadContent variant={variant}>
              <ThreadContentMessages />
            </ThreadContent>
          </ScrollableMessageContainer>
          <div className="p-4">
            <MessageInput contextKey={contextKey}>
              <MessageInputTextarea />
              <MessageInputToolbar>
                <MessageInputSubmitButton />
              </MessageInputToolbar>
              <MessageInputError />
            </MessageInput>
          </div>
          <MessageSuggestions>
            <MessageSuggestionsStatus />
            <MessageSuggestionsList />
          </MessageSuggestions>
        </div>
      </Collapsible.Content>
    </CollapsibleContainer>
  );
});
MessageThreadCollapsible.displayName = "MessageThreadCollapsible";
