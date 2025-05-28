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
import type { messageVariants } from "@/components/ui/message";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/ui/thread-content";
import { ThreadDropdown } from "@/components/ui/thread-dropdown";
import { ScrollableMessageContainer } from "@/components/ui/scrollable-message-container";
import { cn } from "@/lib/utils";
import { Collapsible } from "radix-ui";
import { XIcon } from "lucide-react";
import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import type { Suggestion } from "@tambo-ai/react";

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
      "fixed bottom-4 right-4 w-full max-w-sm sm:max-w-md md:max-w-lg rounded-lg shadow-lg bg-background border border-gray-200",
      "transition-all duration-300 ease-in-out",
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
  config: {
    labels: {
      openState: string;
      closedState: string;
    };
  };
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
  config,
}: CollapsibleTriggerProps) => (
  <>
    {!isOpen && (
      <Collapsible.Trigger asChild>
        <button
          className={cn(
            "flex items-center justify-between w-full p-4",
            "hover:bg-muted/50 transition-colors",
          )}
          aria-expanded={isOpen}
          aria-controls="message-thread-content"
        >
          <span>{config.labels.closedState}</span>
          <span
            className="text-xs text-muted-foreground pl-8"
            suppressHydrationWarning
          >
            {`(${shortcutText})`}
          </span>
        </button>
      </Collapsible.Trigger>
    )}
    {isOpen && (
      <div className="flex items-center justify-between w-full p-4">
        <div className="flex items-center gap-2">
          <span>{config.labels.openState}</span>
          <ThreadDropdown
            contextKey={contextKey}
            onThreadChange={onThreadChange}
          />
        </div>
        <button
          className="p-1 rounded-full hover:bg-muted/70 transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    )}
  </>
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

  /**
   * Configuration for the MessageThreadCollapsible component
   */
  const THREAD_CONFIG = {
    labels: {
      openState: "Conversations",
      closedState: "Start chatting with tambo",
    },
  };

  const defaultSuggestions: Suggestion[] = [
    {
      id: "suggestion-1",
      title: "Get started",
      detailedSuggestion: "What can you help me with?",
      messageId: "welcome-query",
    },
    {
      id: "suggestion-2",
      title: "Learn more",
      detailedSuggestion: "Tell me about your capabilities.",
      messageId: "capabilities-query",
    },
    {
      id: "suggestion-3",
      title: "Examples",
      detailedSuggestion: "Show me some example queries I can try.",
      messageId: "examples-query",
    },
  ];

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
        config={THREAD_CONFIG}
      />
      <Collapsible.Content>
        <div className="h-[700px] flex flex-col">
          {/* Message thread content */}
          <ScrollableMessageContainer className="p-4">
            <ThreadContent variant={variant}>
              <ThreadContentMessages />
            </ThreadContent>
          </ScrollableMessageContainer>

          {/* Message Suggestions Status */}
          <MessageSuggestions>
            <MessageSuggestionsStatus />
          </MessageSuggestions>

          {/* Message input */}
          <div className="p-4">
            <MessageInput contextKey={contextKey}>
              <MessageInputTextarea />
              <MessageInputToolbar>
                <MessageInputSubmitButton />
              </MessageInputToolbar>
              <MessageInputError />
            </MessageInput>
          </div>

          {/* Message suggestions */}
          <MessageSuggestions initialSuggestions={defaultSuggestions}>
            <MessageSuggestionsList />
          </MessageSuggestions>
        </div>
      </Collapsible.Content>
    </CollapsibleContainer>
  );
});
MessageThreadCollapsible.displayName = "MessageThreadCollapsible";
