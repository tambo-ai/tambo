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
import { ScrollableMessageContainer } from "@/components/ui/scrollable-message-container";
import { useTambo, type Suggestion } from "@tambo-ai/react";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Mic } from "lucide-react";

// Lazy load DictationButton for code splitting (framework-agnostic alternative to next/dynamic)
const LazyDictationButton = React.lazy(() =>
  import("@/components/ui/dictation-button").then((mod) => ({
    default: mod.DictationButton,
  })),
);

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Wrapper component that includes Suspense boundary for the lazy-loaded DictationButton.
 * This ensures the component can be safely used without requiring consumers to add their own Suspense.
 * Also handles SSR by only rendering on the client (DictationButton uses Web Audio APIs).
 */
function DictationButtonWrapper() {
  const isClient = React.useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!isClient) {
    return (
      <div className="h-10 w-10 shrink-0 rounded-md flex items-center justify-center">
        <Mic className="h-4 w-4 opacity-50" />
      </div>
    );
  }

  return (
    <React.Suspense
      fallback={
        <div className="h-10 w-10 shrink-0 rounded-md flex items-center justify-center">
          <Mic className="h-4 w-4 opacity-50" />
        </div>
      }
    >
      <LazyDictationButton />
    </React.Suspense>
  );
}

/**
 * Props for the MessageThreadFull component
 */
export interface MessageThreadFullProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional context key for the thread */
  contextKey?: string;
  /**
   * Controls the visual styling of messages in the thread.
   * Possible values include: "default", "compact", etc.
   * These values are defined in messageVariants from "@/components/ui/message".
   * @example variant="compact"
   */
  variant?: VariantProps<typeof messageVariants>["variant"];
}

/**
 * A full-screen chat thread component with message history, input, and suggestions
 */
export const MessageThreadFull = React.forwardRef<
  HTMLDivElement,
  MessageThreadFullProps
>(({ className, contextKey, variant, ...props }, ref) => {
  const { thread } = useTambo();

  // Check if chat is new (no messages)
  const isNewChat = !thread?.messages || thread.messages.length === 0;

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
    <div ref={ref} className={cn("flex flex-col h-full", className)} {...props}>
      {/* Messages area - only show when there are messages */}
      {!isNewChat && (
        <ScrollableMessageContainer className="p-4 flex-1">
          <ThreadContent variant={variant}>
            <ThreadContentMessages />
          </ThreadContent>
        </ScrollableMessageContainer>
      )}

      {/* Centered container for new chat, bottom-aligned for existing chat */}
      <div
        className={cn(
          "w-full",
          isNewChat
            ? "flex-1 flex flex-col items-center justify-center"
            : "mt-auto",
        )}
      >
        {/* Message suggestions status */}
        <MessageSuggestions>
          <MessageSuggestionsStatus />
        </MessageSuggestions>

        {/* Message input */}
        <div className={cn("p-4 w-full", isNewChat && "max-w-2xl mx-auto")}>
          <MessageInput contextKey={contextKey}>
            <MessageInputTextarea />
            <MessageInputToolbar>
              <DictationButtonWrapper />
              <MessageInputSubmitButton />
            </MessageInputToolbar>
            <MessageInputError />
          </MessageInput>
        </div>

        {/* Message suggestions */}
        <div className={cn(isNewChat && "max-w-2xl mx-auto w-full px-4")}>
          <MessageSuggestions initialSuggestions={defaultSuggestions}>
            <MessageSuggestionsList />
          </MessageSuggestions>
        </div>
      </div>
    </div>
  );
});
MessageThreadFull.displayName = "MessageThreadFull";
