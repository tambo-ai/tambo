import { Slot } from "@radix-ui/react-slot";
import type { Suggestion } from "@tambo-ai/react";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useMessageSuggestionsContext } from "../root/message-suggestions-context";

/**
 * Props passed to the render callback for the suggestion list.
 */
export interface MessageSuggestionsListRenderProps {
  /** The array of current suggestions. */
  suggestions: Suggestion[];
  /** Whether suggestions are currently being generated. */
  isGenerating: boolean;
  /** The ID of the currently selected suggestion, or null. */
  selectedSuggestionId: string | null;
  /** Whether the user is on macOS. */
  isMac: boolean;
  /** The modifier key label (e.g. "Cmd" on Mac, "Ctrl" on other platforms). */
  modKey: string;
  /** The alt key label (e.g. "Option" on Mac, "Alt" on other platforms). */
  altKey: string;
}

export interface MessageSuggestionsListProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** Number of placeholder items to show when no suggestions are available. Defaults to 3. */
  placeholderCount?: number;
}

/**
 * List primitive for message suggestions.
 * Renders the list of suggestion items.
 *
 * Applies data attributes for styling:
 * - `data-generating` when suggestions are being generated
 * - `data-empty` when there are no suggestions
 *
 * When using the render prop, provides the suggestions array and related state.
 * When using children, renders them directly.
 *
 * @returns A container element for the suggestion list.
 */
export const MessageSuggestionsList = React.forwardRef<
  HTMLDivElement,
  BasePropsWithChildrenOrRenderFunction<
    MessageSuggestionsListProps,
    MessageSuggestionsListRenderProps
  >
>(function MessageSuggestionsList(
  { asChild, placeholderCount = 3, ...props },
  ref,
) {
  const { suggestions, selectedSuggestionId, isGenerating, isMac } =
    useMessageSuggestionsContext();

  const modKey = isMac ? "\u2318" : "Ctrl";
  const altKey = isMac ? "\u2325" : "Alt";

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    suggestions,
    isGenerating,
    selectedSuggestionId,
    isMac,
    modKey,
    altKey,
  });

  // When no render prop or children, render default placeholders if empty
  const defaultContent =
    content ??
    (suggestions.length === 0
      ? Array.from({ length: placeholderCount }, (_, index) => (
          <div
            key={`placeholder-${index}`}
            data-slot="message-suggestions-placeholder"
            data-placeholder-index={index}
          >
            <span />
          </div>
        ))
      : null);

  return (
    <Comp
      ref={ref}
      data-slot="message-suggestions-list"
      data-generating={isGenerating ? "" : undefined}
      data-empty={suggestions.length === 0 ? "" : undefined}
      {...componentProps}
    >
      {defaultContent}
    </Comp>
  );
});
