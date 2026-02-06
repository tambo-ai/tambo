import { Slot } from "@radix-ui/react-slot";
import type { Suggestion } from "@tambo-ai/react";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useMessageSuggestionsContext } from "../root/message-suggestions-context";

export type MessageSuggestionsItemProps = BaseProps<
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
    /** The suggestion to display and handle acceptance for. */
    suggestion: Suggestion;
    /** The index of this suggestion in the list. */
    index: number;
  }
>;

/**
 * Item primitive for an individual message suggestion.
 * Renders a button that accepts the suggestion when clicked.
 *
 * Applies data attributes for styling:
 * - `data-suggestion-id` with the suggestion's ID
 * - `data-suggestion-index` with the suggestion's position in the list
 * - `data-selected` when this suggestion is currently selected
 * - `data-generating` when suggestions are being generated (button is disabled)
 *
 * @returns A button element representing a single suggestion.
 */
export const MessageSuggestionsItem = React.forwardRef<
  HTMLButtonElement,
  MessageSuggestionsItemProps
>(function MessageSuggestionsItem(
  { suggestion, index, asChild, children, ...props },
  ref,
) {
  const { selectedSuggestionId, accept, isGenerating } =
    useMessageSuggestionsContext();

  const isSelected = selectedSuggestionId === suggestion.id;

  const handleClick = async () => {
    if (!isGenerating) {
      await accept({ suggestion });
    }
  };

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-slot="message-suggestions-item"
      data-suggestion-id={suggestion.id}
      data-suggestion-index={index}
      data-selected={isSelected ? "" : undefined}
      data-generating={isGenerating ? "" : undefined}
      onClick={handleClick}
      disabled={isGenerating}
      {...props}
    >
      {children ?? <span>{suggestion.title}</span>}
    </Comp>
  );
});
