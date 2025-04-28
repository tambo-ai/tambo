"use client";

import { MessageGenerationStage } from "@/components/ui/message-generation-stage";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTambo, useTamboSuggestions } from "@tambo-ai/react";
import { Loader2Icon } from "lucide-react";
import * as React from "react";
import { useEffect, useRef } from "react";

/**
 * @typedef MessageSuggestionsContextValue
 * @property {Array} suggestions - Array of suggestion objects
 * @property {string|null} selectedSuggestionId - ID of the currently selected suggestion
 * @property {function} accept - Function to accept a suggestion
 * @property {boolean} isGenerating - Whether suggestions are being generated
 * @property {Error|null} error - Any error from generation
 * @property {object} thread - The current Tambo thread
 */
interface MessageSuggestionsContextValue {
  suggestions: any[];
  selectedSuggestionId: string | null;
  accept: (options: { suggestion: any }) => void;
  isGenerating: boolean;
  error: Error | null;
  thread: any;
  isMac: boolean;
}

/**
 * React Context for sharing suggestion data and functions among sub-components.
 * @internal
 */
const MessageSuggestionsContext =
  React.createContext<MessageSuggestionsContextValue | null>(null);

/**
 * Hook to access the message suggestions context.
 * @returns {MessageSuggestionsContextValue} The message suggestions context value.
 * @throws {Error} If used outside of MessageSuggestions.
 * @internal
 */
const useMessageSuggestionsContext = () => {
  const context = React.useContext(MessageSuggestionsContext);
  if (!context) {
    throw new Error(
      "MessageSuggestions sub-components must be used within a MessageSuggestions",
    );
  }
  return context;
};

/**
 * Props for the MessageSuggestions component.
 * Extends standard HTMLDivElement attributes.
 */
export interface MessageSuggestionsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum number of suggestions to display (default: 3) */
  maxSuggestions?: number;
  /** The child elements to render within the container. */
  children?: React.ReactNode;
}

/**
 * The root container for message suggestions.
 * It establishes the context for its children and handles overall state management.
 * @component MessageSuggestions
 * @example
 * ```tsx
 * <MessageSuggestions maxSuggestions={3}>
 *   <MessageSuggestions.Status />
 *   <MessageSuggestions.List />
 * </MessageSuggestions>
 * ```
 */
const MessageSuggestions = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsProps
>(({ children, className, maxSuggestions = 3, ...props }, ref) => {
  const { thread } = useTambo();
  const {
    suggestions,
    selectedSuggestionId,
    accept,
    generateResult: { isPending: isGenerating, error },
  } = useTamboSuggestions({ maxSuggestions });

  const isMac =
    typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");

  // Track the last AI message ID to detect new messages
  const lastAiMessageIdRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const contextValue = React.useMemo(
    () => ({
      suggestions,
      selectedSuggestionId,
      accept,
      isGenerating,
      error,
      thread,
      isMac,
    }),
    [
      suggestions,
      selectedSuggestionId,
      accept,
      isGenerating,
      error,
      thread,
      isMac,
    ],
  );

  // Find the last AI message
  const lastAiMessage = thread?.messages
    ? [...thread.messages].reverse().find((msg) => msg.role === "assistant")
    : null;

  // When a new AI message appears, update the reference
  useEffect(() => {
    if (lastAiMessage && lastAiMessage.id !== lastAiMessageIdRef.current) {
      lastAiMessageIdRef.current = lastAiMessage.id;

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      loadingTimeoutRef.current = setTimeout(() => {}, 5000);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [lastAiMessage, suggestions.length]);

  // Handle keyboard shortcuts for selecting suggestions
  useEffect(() => {
    if (!suggestions || suggestions.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const modifierPressed = isMac
        ? event.metaKey && event.altKey
        : event.ctrlKey && event.altKey;

      if (modifierPressed) {
        const keyNum = parseInt(event.key);
        if (!isNaN(keyNum) && keyNum > 0 && keyNum <= suggestions.length) {
          event.preventDefault();
          const suggestionIndex = keyNum - 1;
          accept({ suggestion: suggestions[suggestionIndex] });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [suggestions, accept, isMac]);

  // If we have no messages yet, render nothing
  if (!thread?.messages?.length) {
    return null;
  }

  return (
    <MessageSuggestionsContext.Provider value={contextValue}>
      <TooltipProvider>
        <div
          ref={ref}
          className={cn("px-4 pb-2", className)}
          data-slot="message-suggestions-container"
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </MessageSuggestionsContext.Provider>
  );
});
MessageSuggestions.displayName = "MessageSuggestions";

/**
 * Props for the MessageSuggestionsStatus component.
 * Extends standard HTMLDivElement attributes.
 */
export type MessageSuggestionsStatusProps =
  React.HTMLAttributes<HTMLDivElement>;

/**
 * Displays loading, error, or generation stage information.
 * Automatically connects to the context to show the appropriate status.
 * @component MessageSuggestions.Status
 * @example
 * ```tsx
 * <MessageSuggestions>
 *   <MessageSuggestions.Status />
 *   <MessageSuggestions.List />
 * </MessageSuggestions>
 * ```
 */
const MessageSuggestionsStatus = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsStatusProps
>(({ className, ...props }, ref) => {
  const { error, isGenerating, thread } = useMessageSuggestionsContext();

  // No status to display
  if (!error && !isGenerating && !thread?.generationStage) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn("p-2 rounded-md text-sm bg-muted/30", className)}
      data-slot="message-suggestions-status"
      {...props}
    >
      {/* Error state */}
      {error && (
        <div className="p-2 rounded-md text-sm bg-red-50 text-red-500">
          <p>{error.message}</p>
        </div>
      )}

      {/* First show generation stage until complete, then show loading state if generating suggestions */}
      {thread?.generationStage && thread.generationStage !== "COMPLETE" ? (
        <MessageGenerationStage />
      ) : (
        isGenerating && (
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <p>Generating suggestions...</p>
          </div>
        )
      )}
    </div>
  );
});
MessageSuggestionsStatus.displayName = "MessageSuggestions.Status";

/**
 * Props for the MessageSuggestionsList component.
 * Extends standard HTMLDivElement attributes.
 */
export type MessageSuggestionsListProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Displays the list of suggestion buttons.
 * Automatically connects to the context to show the suggestions.
 * @component MessageSuggestions.List
 * @example
 * ```tsx
 * <MessageSuggestions>
 *   <MessageSuggestions.Status />
 *   <MessageSuggestions.List />
 * </MessageSuggestions>
 * ```
 */
const MessageSuggestionsList = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsListProps
>(({ className, ...props }, ref) => {
  const { suggestions, selectedSuggestionId, accept, isGenerating, isMac } =
    useMessageSuggestionsContext();

  if (suggestions.length === 0) {
    return null;
  }

  const modKey = isMac ? "⌘" : "Ctrl";
  const altKey = isMac ? "⌥" : "Alt";

  return (
    <div
      ref={ref}
      className={cn(
        "flex space-x-2 overflow-x-auto pb-2 rounded-md bg-muted/30",
        isGenerating ? "opacity-70" : "",
        className,
      )}
      data-slot="message-suggestions-list"
      {...props}
    >
      {suggestions.map((suggestion, index) => (
        <Tooltip
          key={suggestion.id}
          content={
            <span suppressHydrationWarning>
              {modKey}+{altKey}+{index + 1}
            </span>
          }
          side="top"
        >
          <button
            className={cn(
              "py-2 px-2.5 rounded-2xl text-xs transition-colors",
              "border border-flat",
              isGenerating
                ? "bg-muted/50 text-muted-foreground"
                : selectedSuggestionId === suggestion.id
                  ? "bg-accent text-accent-foreground"
                  : "bg-background hover:bg-accent hover:text-accent-foreground",
            )}
            onClick={async () =>
              !isGenerating && (await accept({ suggestion }))
            }
            disabled={isGenerating}
            data-suggestion-id={suggestion.id}
            data-suggestion-index={index}
          >
            <span className="font-medium">{suggestion.title}</span>
          </button>
        </Tooltip>
      ))}
    </div>
  );
});
MessageSuggestionsList.displayName = "MessageSuggestions.List";

export { MessageSuggestions, MessageSuggestionsStatus, MessageSuggestionsList };
