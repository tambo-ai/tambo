"use client";

import { cn } from "@/lib/utils";
import {
  useTambo,
  type Suggestion,
  type TamboThreadMessage,
} from "@tambo-ai/react";
import type { messageVariants } from "@tambo-ai/ui-registry/components/message";
import {
  Message,
  MessageContent,
} from "@tambo-ai/ui-registry/components/message";
import {
  MessageInput,
  MessageInputError,
  MessageInputFileButton,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@tambo-ai/ui-registry/components/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsList,
  MessageSuggestionsStatus,
} from "@tambo-ai/ui-registry/components/message-suggestions";
import { ScrollableMessageContainer } from "@tambo-ai/ui-registry/components/scrollable-message-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@tambo-ai/ui-registry/components/thread-content";
import { type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
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
  /** Initial query to pre-fill the message input */
  initialQuery?: string;
  /**
   * Controls the visual styling of messages in the thread.
   * Possible values include: "default", "compact", etc.
   * These values are defined in messageVariants from "@tambo-ai/ui-registry/components/message".
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
 *   defaultOpen={false}
 *   className="left-4" // Position on the left instead of right
 *   variant="default"
 * />
 * ```
 */

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
            "sm:w-md md:w-lg lg:w-160 xl:w-3xl 2xl:w-4xl",
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
    { className, defaultOpen = false, initialQuery, variant, ...props },
    ref,
  ) => {
    const searchParams = useSearchParams();

    // Use initialQuery prop if provided, otherwise check search params
    const queryFromUrl = searchParams.get("q") || undefined;
    const finalInitialQuery = initialQuery || queryFromUrl;

    const [isOpen, setIsOpen] = React.useState(
      defaultOpen || !!finalInitialQuery,
    );

    // Open the collapsible when the initial query is set
    React.useEffect(() => {
      if (finalInitialQuery) setIsOpen(true);
    }, [finalInitialQuery]);

    const handleThreadChange = React.useCallback(() => {
      setIsOpen(true);
    }, [setIsOpen]);

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
      <CollapsibleContainer
        ref={ref}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        className={className}
        {...props}
      >
        <CollapsibleTrigger
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onThreadChange={handleThreadChange}
          config={THREAD_CONFIG}
        />
        <Collapsible.Content>
          <div className="h-[calc(100vh-8rem)] sm:h-150 md:h-162.5 lg:h-175 xl:h-187.5 2xl:h-200 max-h-[90vh] flex flex-col">
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
              <MessageInput defaultValue={finalInitialQuery}>
                <MessageInputTextarea placeholder="Type your message or paste images..." />
                <MessageInputToolbar>
                  <MessageInputFileButton />
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
  },
);
MessageThreadCollapsible.displayName = "MessageThreadCollapsible";
