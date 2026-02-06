import type { Suggestion, TamboThread } from "@tambo-ai/react";
import * as React from "react";

/**
 * Context value shared among MessageSuggestions primitive sub-components.
 */
export interface MessageSuggestionsContextValue {
  /** Array of suggestion objects. */
  suggestions: Suggestion[];
  /** ID of the currently selected suggestion, or null if none selected. */
  selectedSuggestionId: string | null;
  /** Function to accept a suggestion. */
  accept: (options: { suggestion: Suggestion }) => Promise<void>;
  /** Whether suggestions are currently being generated. */
  isGenerating: boolean;
  /** Any error from suggestion generation. */
  error: Error | null;
  /** The current Tambo thread. */
  thread: TamboThread;
  /** Whether the user is on macOS (affects keyboard shortcut display). */
  isMac: boolean;
}

export const MessageSuggestionsContext =
  React.createContext<MessageSuggestionsContextValue | null>(null);

/**
 * Hook to access the message suggestions context.
 * @internal This hook is for internal use by base components only.
 * @returns The message suggestions context value
 * @throws Error if used outside of MessageSuggestions.Root
 */
export function useMessageSuggestionsContext(): MessageSuggestionsContextValue {
  const context = React.useContext(MessageSuggestionsContext);
  if (!context) {
    throw new Error(
      "React UI Base: MessageSuggestionsContext is missing. MessageSuggestions parts must be used within <MessageSuggestions.Root>",
    );
  }
  return context;
}

/**
 * Hook to optionally access the message suggestions context.
 * Returns null if not within a MessageSuggestions.Root component.
 * @internal This hook is for internal use by base components only.
 * @returns The message suggestions context value or null
 */
export function useOptionalMessageSuggestionsContext(): MessageSuggestionsContextValue | null {
  return React.useContext(MessageSuggestionsContext);
}
