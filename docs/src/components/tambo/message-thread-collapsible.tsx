"use client";

import type { messageVariants } from "@/components/tambo/message";
import { Message, MessageContent } from "@/components/tambo/message";
import {
  MessageInput,
  MessageInputError,
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
import { cn } from "@/lib/utils";
import {
  useTambo,
  type Suggestion,
  type TamboThreadMessage,
} from "@tambo-ai/react";
import { type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Collapsible } from "radix-ui";
import * as React from "react";
import { ProductHuntThoughtBubble } from "@/components/product-hunt-bubble";
import { PRODUCT_HUNT_BUBBLE_DISMISS_KEY } from "@/lib/product-hunt";

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
  /** Initial query to pre-fill the message input */
  initialQuery?: string;
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
      "fixed shadow-lg bg-background border border-gray-200 z-50",
      "transition-[width,height] duration-300 ease-in-out",
      isOpen
        ? cn(
            // Mobile: Full screen below header
            "top-14 left-0 right-0 bottom-0 w-full rounded-none",
            // Tablet and up: Floating panel
            "sm:inset-auto sm:bottom-4 sm:right-4 sm:rounded-lg",
            "sm:w-[448px] md:w-[512px] lg:w-[640px] xl:w-[768px] 2xl:w-[896px]",
            "sm:h-auto sm:max-w-[90vw]",
          )
        : "bottom-4 right-4 rounded-full w-16 h-16 p-0 flex items-center justify-center",
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
  onClose: () => void;
  contextKey?: string;
  onThreadChange: () => void;
  config: {
    labels: {
      openState: string;
    };
  };
}

/**
 * Trigger component for the collapsible panel
 */
const CollapsibleTrigger = ({
  isOpen,
  onClose,
  config,
}: CollapsibleTriggerProps) => {
  if (!isOpen) {
    return (
      <div className="relative flex items-center justify-center w-full h-full">
        <Collapsible.Trigger asChild>
          <button
            className="w-full h-full flex items-center justify-center rounded-full focus:outline-none cursor-pointer"
            aria-expanded={isOpen}
            aria-controls="message-thread-content"
            tabIndex={0}
          >
            <Image
              src="/logo/icon/Octo-Icon.svg"
              width={32}
              height={32}
              alt="Octo Icon"
              className="w-8 h-8"
            />
          </button>
        </Collapsible.Trigger>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between w-full p-4 border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <Image
            src="/logo/icon/Octo-Icon.svg"
            width={24}
            height={24}
            alt="Octo Icon"
            className="w-4 h-4"
          />
          <span>{config.labels.openState}</span>
        </div>
        <div
          role="button"
          className="p-1 rounded-full hover:bg-muted/70 transition-colors cursor-pointer"
          onClick={onClose}
          aria-label="Close"
        >
          <XIcon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};
CollapsibleTrigger.displayName = "CollapsibleTrigger";

export const MessageThreadCollapsible = React.forwardRef<
  HTMLDivElement,
  MessageThreadCollapsibleProps
>(
  (
    {
      className,
      contextKey,
      defaultOpen = false,
      initialQuery,
      variant,
      ...props
    },
    ref,
  ) => {
    const searchParams = useSearchParams();

    // Use initialQuery prop if provided, otherwise check search params
    const queryFromUrl = searchParams.get("q") || undefined;
    const finalInitialQuery = initialQuery || queryFromUrl;

    const [isOpen, setIsOpen] = React.useState(
      defaultOpen || !!finalInitialQuery,
    );

    // Product Hunt bubble state
    const [showProductHunt, setShowProductHunt] = React.useState(false);
    const reopenBubbleTimeoutRef = React.useRef<number | null>(null);

    // Open the collapsible when the initial query is set
    React.useEffect(() => {
      if (finalInitialQuery) setIsOpen(true);
    }, [finalInitialQuery]);

    // Show Product Hunt bubble a bit after load when closed (and not dismissed)
    React.useEffect(() => {
      if (typeof window === "undefined") return;

      let timer: number | undefined;
      try {
        const dismissed =
          window.sessionStorage.getItem(PRODUCT_HUNT_BUBBLE_DISMISS_KEY) ===
          "1";

        timer = window.setTimeout(() => {
          if (!dismissed && !isOpen) setShowProductHunt(true);
        }, 3000);
      } catch {
        // If sessionStorage is unavailable, still show after delay if closed
        timer = window.setTimeout(() => {
          if (!isOpen) setShowProductHunt(true);
        }, 3000);
      }

      return () => {
        if (timer) window.clearTimeout(timer);
      };
    }, [isOpen]);

    const handleDismissProductHunt = React.useCallback(() => {
      try {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(PRODUCT_HUNT_BUBBLE_DISMISS_KEY, "1");
        }
      } catch {
        // SessionStorage might be blocked
      }
      setShowProductHunt(false);
    }, []);

    const handleThreadChange = React.useCallback(() => {
      setIsOpen(true);
      setShowProductHunt(false); // Hide bubble when opening chat
    }, [setIsOpen]);

    React.useEffect(() => {
      if (reopenBubbleTimeoutRef.current) {
        window.clearTimeout(reopenBubbleTimeoutRef.current);
        reopenBubbleTimeoutRef.current = null;
      }
    }, []);

    /**
     * Configuration for the MessageThreadCollapsible component
     */
    const THREAD_CONFIG = {
      labels: {
        openState: "ask tambo",
      },
    };

    const { thread } = useTambo();

    // Starter message for when the thread is empty
    const starterMessage: TamboThreadMessage = {
      id: "starter-login-prompt",
      role: "assistant",
      content: [{ type: "text", text: "Ask me anything about tambo." }],
      createdAt: new Date().toISOString(),
      actionType: undefined,
      componentState: {},
      threadId: "",
    };

    const defaultSuggestions: Suggestion[] = [
      {
        id: "suggestion-1",
        title: "Create an account",
        detailedSuggestion: "How do I create an account?",
        messageId: "create-account-query",
      },
      {
        id: "suggestion-2",
        title: "Join the Discord",
        detailedSuggestion: "How do I join the tambo Discord?",
        messageId: "join-discord-query",
      },
      {
        id: "suggestion-3",
        title: "Open an issue on GitHub",
        detailedSuggestion: "How do I open an issue on GitHub?",
        messageId: "open-issue-query",
      },
    ];

    return (
      <>
        <CollapsibleContainer
          ref={ref}
          isOpen={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (open) {
              setShowProductHunt(false);
              if (reopenBubbleTimeoutRef.current) {
                window.clearTimeout(reopenBubbleTimeoutRef.current);
                reopenBubbleTimeoutRef.current = null;
              }
            }
          }}
          className={className}
          {...props}
        >
          <CollapsibleTrigger
            isOpen={isOpen}
            onClose={() => {
              setIsOpen(false);
              // Clear existing timer if any
              if (reopenBubbleTimeoutRef.current) {
                window.clearTimeout(reopenBubbleTimeoutRef.current);
                reopenBubbleTimeoutRef.current = null;
              }
              // Reopen bubble after a short delay, unless dismissed
              reopenBubbleTimeoutRef.current = window.setTimeout(() => {
                try {
                  if (typeof window !== "undefined") {
                    const dismissed =
                      window.sessionStorage.getItem(
                        PRODUCT_HUNT_BUBBLE_DISMISS_KEY,
                      ) === "1";
                    if (!dismissed) setShowProductHunt(true);
                  }
                } catch {
                  setShowProductHunt(true);
                }
              }, 5000);
            }}
            contextKey={contextKey}
            onThreadChange={handleThreadChange}
            config={THREAD_CONFIG}
          />
          <Collapsible.Content>
            <div className="h-[calc(100vh-8rem)] sm:h-[600px] md:h-[650px] lg:h-[700px] xl:h-[750px] 2xl:h-[800px] max-h-[90vh] flex flex-col">
              {/* Message thread content */}
              <ScrollableMessageContainer className="p-2 sm:p-3 md:p-4">
                {/* Conditionally render the starter message */}
                {thread.messages.length === 0 && (
                  <Message role="assistant" message={starterMessage}>
                    <MessageContent />
                  </Message>
                )}

                <ThreadContent variant={variant}>
                  <ThreadContentMessages />
                </ThreadContent>
              </ScrollableMessageContainer>

              {/* Message Suggestions Status */}
              <MessageSuggestions>
                <MessageSuggestionsStatus />
              </MessageSuggestions>

              {/* Message input */}
              <div className="p-2 sm:p-3 md:p-4">
                <MessageInput
                  contextKey={contextKey}
                  initialQuery={finalInitialQuery}
                >
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

        {/* Product Hunt Thought Bubble - only show when chat is closed */}
        {showProductHunt && !isOpen && (
          <ProductHuntThoughtBubble
            isOpen={isOpen}
            onDismiss={handleDismissProductHunt}
          />
        )}
      </>
    );
  },
);
MessageThreadCollapsible.displayName = "MessageThreadCollapsible";
