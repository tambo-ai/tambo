"use client";

import { useTamboManagementTools } from "@/components/ui/tambo/chatwithtambo/tools";
import type { messageVariants } from "@/components/ui/tambo/message";
import { Message, MessageContent } from "@/components/ui/tambo/message";
import {
  MessageInput,
  MessageInputError,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@/components/ui/tambo/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsList,
  MessageSuggestionsStatus,
} from "@/components/ui/tambo/message-suggestions";
import { ScrollableMessageContainer } from "@/components/ui/tambo/scrollable-message-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/ui/tambo/thread-content";
import { cn } from "@/lib/utils";
import {
  useTambo,
  type Suggestion,
  type TamboThreadMessage,
} from "@tambo-ai/react";
import { type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Collapsible } from "radix-ui";
import * as React from "react";

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
            // Mobile: Full screen
            "inset-0 w-full h-full rounded-none",
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
            className="w-full h-full flex items-center justify-center rounded-full focus:outline-none"
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
>(({ className, contextKey, defaultOpen = false, variant, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  useTamboManagementTools();

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

  const { data: session } = useSession();
  const isUserLoggedIn = !!session;
  const { thread } = useTambo();

  // Starter message for when the thread is empty
  const starterMessage: TamboThreadMessage = {
    id: "starter-login-prompt",
    role: "assistant",
    content: [
      { type: "text", text: "Please log in to ask tambo about your projects." },
    ],
    createdAt: new Date().toISOString(),
    actionType: undefined,
    componentState: {},
    threadId: "",
  };

  const defaultSuggestions: Suggestion[] = [
    {
      id: "suggestion-1",
      title: "View Project Details",
      detailedSuggestion: "How can I see the details of one of my projects?",
      messageId: "view-project-details-query",
    },
    {
      id: "suggestion-2",
      title: "Generate API Key",
      detailedSuggestion:
        "How do I create a new API key for one of my projects?",
      messageId: "generate-apikey-query",
    },
    {
      id: "suggestion-3",
      title: "Modify Project Config",
      detailedSuggestion:
        "How can I change the configuration or settings for one of my projects?",
      messageId: "modify-project-config-query",
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
        contextKey={contextKey}
        onThreadChange={handleThreadChange}
        config={THREAD_CONFIG}
      />
      <Collapsible.Content>
        <div className="h-[calc(100vh-6rem)] sm:h-[600px] md:h-[650px] lg:h-[700px] xl:h-[750px] 2xl:h-[800px] max-h-[90vh] flex flex-col">
          {/* Message thread content */}
          <ScrollableMessageContainer className="p-2 sm:p-3 md:p-4">
            {/* Conditionally render the starter message */}
            {!isUserLoggedIn && thread.messages.length === 0 && (
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
