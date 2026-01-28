"use client";

import type { messageVariants } from "@/components/tambo/message";
import {
  MessageInput,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpPromptButton,
  MessageInputMcpResourceButton,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@/components/tambo/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsList,
  MessageSuggestionsStatus,
} from "@/components/tambo/message-suggestions";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import { ThreadDropdown } from "@/components/tambo/thread-dropdown";
import { cn } from "@/lib/utils";
import { type Suggestion, useTamboThread } from "@tambo-ai/react";
import { type VariantProps } from "class-variance-authority";
import { ArrowUp, XIcon } from "lucide-react";
import { Collapsible } from "radix-ui";
import * as React from "react";

/**
 * Props for the MessageThreadCollapsible component
 * @interface
 * @extends React.HTMLAttributes<HTMLDivElement>
 */
export interface MessageThreadCollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the collapsible should be open by default (default: false) */
  defaultOpen?: boolean;
  /**
   * Controls the visual styling of messages in the thread.
   * Possible values include: "default", "compact", etc.
   * These values are defined in messageVariants from "@/components/tambo/message".
   * @example variant="compact"
   */
  variant?: VariantProps<typeof messageVariants>["variant"];
  /** Optional override for height of the thread content. If not provided, defaults to 80vh. Supports any CSS height value (e.g., "700px", "80vh", "90%"). */
  height?: string;
  /** @deprecated Use height instead. This prop will be removed in a future version. */
  maxHeight?: string;
}

/**
 * A collapsible chat thread component with keyboard shortcuts and thread management
 * @component
 * @example
 * ```tsx
 * <MessageThreadCollapsible
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
  const [isHovered, setIsHovered] = React.useState(false);
  const isMac =
    typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");
  const shortcutText = isMac ? "⌘I" : "Ctrl+I";

  // Use ref to track isOpen state to avoid dependency array issues
  const isOpenRef = React.useRef(isOpen);
  React.useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle with Ctrl+I / Cmd+I
      if ((event.metaKey || event.ctrlKey) && event.key === "i") {
        event.preventDefault();
        const wasClosed = !isOpenRef.current;
        setIsOpen((prev) => {
          const newState = !prev;
          // If opening the panel, focus the input after a short delay
          if (wasClosed && newState) {
            setTimeout(() => {
              // Find the textarea/editor element and focus it
              const textareaElement = document.querySelector(
                '[data-slot="message-input-textarea"] textarea, [data-slot="message-input-textarea"] .ProseMirror',
              ) as HTMLElement;
              if (textareaElement) {
                textareaElement.focus();
              }
            }, 100);
          }
          return newState;
        });
      }
      // Close with Escape when open
      if (event.key === "Escape" && isOpenRef.current) {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen, shortcutText, isHovered, setIsHovered };
};

/**
 * Props for the CollapsibleContainer component
 */
interface CollapsibleContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * Container component for the collapsible panel
 */
const CollapsibleContainer = React.forwardRef<
  HTMLDivElement,
  CollapsibleContainerProps & { isHovered?: boolean }
>(
  (
    { className, isOpen, onOpenChange, isHovered = false, children, ...props },
    ref,
  ) => (
    <Collapsible.Root
      ref={ref}
      open={isOpen}
      onOpenChange={onOpenChange}
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2",
        "rounded-xl shadow-2xl bg-transparent border border-border/30",
        "backdrop-blur-md",
        "transition-all duration-300 ease-in-out",
        !isOpen && "w-[360px] max-w-[85vw]",
        !isOpen && isHovered && "w-[400px] scale-105",
        isOpen && "w-full max-w-sm md:max-w-md right-6 left-auto translate-x-0",
        isOpen && "ring-1 ring-border/20",
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
  onThreadChange: () => void;
  config: {
    labels: {
      openState: string;
      closedState: string;
    };
  };
}

/**
 * Compact input component for closed state
 */
const CompactInput = ({
  shortcutText,
  onOpen,
}: {
  shortcutText: string;
  onOpen: () => void;
}) => {
  const [value, setValue] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { sendThreadMessage } = useTamboThread();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isSubmitting || !sendThreadMessage) return;

    const messageText = value.trim();
    setValue("");
    setIsSubmitting(true);

    try {
      // Open the panel first, then send message
      onOpen();

      // Small delay to ensure panel is open before sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Send the message
      await sendThreadMessage(messageText, {
        streamResponse: true,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setValue(messageText); // Restore value on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "i") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center gap-1.5 px-3 py-2 bg-transparent rounded-xl border border-border/30 shadow-lg backdrop-blur-md">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          disabled={isSubmitting}
          className="flex-1 bg-transparent text-xs placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
        />
        <span className="text-[10px] text-muted-foreground font-mono select-none">
          {shortcutText}
        </span>
        <button
          type="submit"
          disabled={!value.trim() || isSubmitting}
          className="w-6 h-6 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowUp className="h-3 w-3" />
        </button>
      </div>
    </form>
  );
};

/**
 * Trigger component for the collapsible panel
 */
const CollapsibleTrigger = ({
  isOpen,
  shortcutText,
  onClose,
  onThreadChange,
  config,
  onOpen,
}: CollapsibleTriggerProps & { onOpen: () => void }) => (
  <>
    {!isOpen && (
      <div className="p-2">
        <CompactInput shortcutText={shortcutText} onOpen={onOpen} />
      </div>
    )}
    {isOpen && (
      <div className="flex items-center justify-between w-full p-2.5 border-b border-border/30 bg-transparent backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs">{config.labels.openState}</span>
          <ThreadDropdown onThreadChange={onThreadChange} />
        </div>
        <button
          className="p-1 rounded-lg hover:bg-muted/70 active:bg-muted transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    )}
  </>
);
CollapsibleTrigger.displayName = "CollapsibleTrigger";

export const MessageThreadCollapsible = React.forwardRef<
  HTMLDivElement,
  MessageThreadCollapsibleProps
>(
  (
    { className, defaultOpen = false, variant, height, maxHeight, ...props },
    ref,
  ) => {
    const { isOpen, setIsOpen, shortcutText, isHovered, setIsHovered } =
      useCollapsibleState(defaultOpen);

    // Backward compatibility: prefer height, fall back to maxHeight
    const effectiveHeight = height ?? maxHeight;

    const handleThreadChange = React.useCallback(() => {
      setIsOpen(true);
    }, [setIsOpen]);

    const handleOpen = React.useCallback(() => {
      setIsOpen(true);
    }, [setIsOpen]);

    // Focus the input when the panel opens
    React.useEffect(() => {
      if (isOpen) {
        // Small delay to ensure the panel and input are fully rendered
        const timer = setTimeout(() => {
          // Try to find and focus the textarea or editor element
          const textareaElement = document.querySelector(
            '[data-slot="message-input-textarea"] textarea, [data-slot="message-input-textarea"] .ProseMirror',
          ) as HTMLElement;
          if (textareaElement) {
            textareaElement.focus();
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }, [isOpen]);

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
      <div
        onMouseEnter={() => !isOpen && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CollapsibleContainer
          ref={ref}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          isHovered={isHovered}
          className={className}
          {...props}
        >
          <CollapsibleTrigger
            isOpen={isOpen}
            shortcutText={shortcutText}
            onClose={() => setIsOpen(false)}
            onThreadChange={handleThreadChange}
            onOpen={handleOpen}
            config={THREAD_CONFIG}
          />
          <Collapsible.Content className="overflow-hidden">
            <div
              className={cn(
                "flex flex-col bg-transparent backdrop-blur-md",
                effectiveHeight ? "" : "h-[80vh] max-h-[calc(100vh-8rem)]",
              )}
              style={effectiveHeight ? { height: effectiveHeight } : undefined}
            >
              {/* Message thread content */}
              <ScrollableMessageContainer className="p-2.5 flex-1">
                <ThreadContent variant={variant}>
                  <ThreadContentMessages />
                </ThreadContent>
              </ScrollableMessageContainer>

              {/* Message Suggestions Status */}
              <MessageSuggestions>
                <MessageSuggestionsStatus />
              </MessageSuggestions>

              {/* Message input - compact version */}
              <div className="p-2 border-t border-border/30 bg-transparent">
                <MessageInput>
                  <MessageInputTextarea
                    placeholder="Ask a question..."
                    className="min-h-[32px] max-h-[100px] text-xs py-1.5"
                  />
                  <MessageInputToolbar>
                    <MessageInputFileButton />
                    <MessageInputMcpPromptButton />
                    <MessageInputMcpResourceButton />
                    {/* Uncomment this to enable client-side MCP config modal button */}
                    {/* <MessageInputMcpConfigButton /> */}
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
      </div>
    );
  },
);
MessageThreadCollapsible.displayName = "MessageThreadCollapsible";
