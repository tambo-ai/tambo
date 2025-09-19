"use client";

import {
  MessageInput,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputSubmitButton,
  MessageInputError,
  // MessageInputMcpConfigButton,
} from "@/components/ui/message-input";
import { MessageInputFileButton } from "../message-input/message-input";
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
import * as Collapsible from "@radix-ui/react-collapsible";
import { XIcon } from "lucide-react";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
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
  /** Whether the panel should be fixed-positioned (default: true) */
  isFixed?: boolean;
  /** Corner placement when fixed */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Offset in pixels from the viewport edges when fixed (default: 16) */
  offset?: number;
  /** Visual size (container width/padding) */
  size?: "sm" | "md" | "lg";
  /** Surface appearance */
  appearance?: "default" | "elevated" | "bordered";
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
  isFixed?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  offset?: number;
  size?: "sm" | "md" | "lg";
  appearance?: "default" | "elevated" | "bordered";
}
const collapsibleSurfaceVariants = cva(
  "rounded-lg bg-background transition-all duration-300 ease-in-out",
  {
    variants: {
      size: {
        sm: "w-full max-w-sm",
        md: "w-full max-w-md",
        lg: "w-full md:max-w-lg",
      },
      appearance: {
        default: "border border-border shadow-sm",
        elevated: "shadow-lg border border-border",
        bordered: "border-2 border-border",
      },
    },
    defaultVariants: {
      size: "md",
      appearance: "default",
    },
  },
);


/**
 * Container component for the collapsible panel
 */
const CollapsibleContainer = React.forwardRef<
  HTMLDivElement,
  CollapsibleContainerProps
>(({ className, isOpen, onOpenChange, children, isFixed = true, position = "bottom-right", offset = 16, size = "md", appearance = "default", style, ...props }, ref) => {
  const placementStyle: React.CSSProperties = {};
  if (isFixed) {
    if (position.includes("bottom")) (placementStyle as any).bottom = offset;
    if (position.includes("top")) (placementStyle as any).top = offset;
    if (position.includes("right")) (placementStyle as any).right = offset;
    if (position.includes("left")) (placementStyle as any).left = offset;
  }

  return (
    <Collapsible.Root
      ref={ref}
      open={isOpen}
      onOpenChange={onOpenChange}
      className={cn(
        collapsibleSurfaceVariants({ size, appearance }),
        isFixed && "fixed",
        className,
      )}
      style={{ ...(isFixed ? placementStyle : {}), ...style }}
      {...props}
    >
      {children}
    </Collapsible.Root>
  );
});
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
>(({ className, contextKey, defaultOpen = false, variant, isFixed = true, position = "bottom-right", offset = 16, size = "md", appearance = "default", ...props }, ref) => {
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
      isFixed={isFixed}
      position={position}
      offset={offset}
      size={size}
      appearance={appearance}
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
              <MessageInputTextarea placeholder="Type your message or paste images..." />
              <MessageInputToolbar>
                <MessageInputFileButton />
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
  );
});
MessageThreadCollapsible.displayName = "MessageThreadCollapsible";
