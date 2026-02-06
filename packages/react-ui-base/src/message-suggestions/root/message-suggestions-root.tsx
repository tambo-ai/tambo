import { Slot } from "@radix-ui/react-slot";
import type { Suggestion } from "@tambo-ai/react";
import { useTambo, useTamboSuggestions } from "@tambo-ai/react";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { MessageSuggestionsContext } from "./message-suggestions-context";

export type MessageSuggestionsRootProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    /** Maximum number of suggestions to display. Defaults to 3. */
    maxSuggestions?: number;
    /** Pre-seeded suggestions to display when the thread is empty. */
    initialSuggestions?: Suggestion[];
  }
>;

/**
 * Root primitive for the message suggestions compound component.
 * Provides context with suggestion state, generation progress, and keyboard shortcuts.
 * Renders nothing if the thread has no messages and no initial suggestions are provided.
 * @returns A context provider wrapping child components, or null if there is nothing to display.
 */
export const MessageSuggestionsRoot = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsRootProps
>(function MessageSuggestionsRoot(
  { children, asChild, maxSuggestions = 3, initialSuggestions = [], ...props },
  ref,
) {
  const { thread } = useTambo();
  const {
    suggestions: generatedSuggestions,
    selectedSuggestionId,
    accept,
    generateResult: { isPending: isGenerating, error },
  } = useTamboSuggestions({ maxSuggestions });

  // Combine initial and generated suggestions.
  // Only use pre-seeded suggestions if the thread is empty.
  const suggestions = React.useMemo(() => {
    if (!thread?.messages?.length && initialSuggestions.length > 0) {
      return initialSuggestions.slice(0, maxSuggestions);
    }
    return generatedSuggestions;
  }, [
    thread?.messages?.length,
    generatedSuggestions,
    initialSuggestions,
    maxSuggestions,
  ]);

  const isMac =
    typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");

  // Track the last AI message ID to detect new messages
  const lastAiMessageIdRef = React.useRef<string | null>(null);
  const loadingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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
  React.useEffect(() => {
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
  React.useEffect(() => {
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
          void accept({ suggestion: suggestions[suggestionIndex] });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [suggestions, accept, isMac]);

  // If we have no messages yet and no initial suggestions, render nothing
  if (!thread?.messages?.length && initialSuggestions.length === 0) {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <MessageSuggestionsContext.Provider value={contextValue}>
      <Comp ref={ref} data-slot="message-suggestions" {...props}>
        {children}
      </Comp>
    </MessageSuggestionsContext.Provider>
  );
});
