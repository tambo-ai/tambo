import { Slot } from "@radix-ui/react-slot";
import { GenerationStage } from "@tambo-ai/react";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useMessageSuggestionsContext } from "../root/message-suggestions-context";

/**
 * Props passed to the Status render function.
 */
export interface MessageSuggestionsStatusRenderProps {
  /** The error from loading suggestions, if any. */
  error: Error | null;
  /** Whether the AI is currently generating suggestions. */
  isGenerating: boolean;
  /** The current generation stage value, if any. */
  generationStage: string | undefined;
  /** Whether the status area is idle (nothing active to display). */
  isIdle: boolean;
}

export type MessageSuggestionsStatusProps =
  BasePropsWithChildrenOrRenderFunction<
    React.HTMLAttributes<HTMLDivElement>,
    MessageSuggestionsStatusRenderProps
  >;

/**
 * Status primitive for message suggestions.
 * Renders error and generation stage information.
 * Delegates visual rendering to children or a render function.
 *
 * Applies data attributes for styling:
 * - `data-error` when there is a generation error
 * - `data-generating` when suggestions are being generated
 * - `data-generation-stage` with the current generation stage value
 * - `data-idle` when there is no active status to display
 *
 * @returns A container element with data attributes reflecting the current suggestion status.
 */
export const MessageSuggestionsStatus = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsStatusProps
>(function MessageSuggestionsStatus({ asChild, ...props }, ref) {
  const { error, isGenerating, thread } = useMessageSuggestionsContext();

  const generationStage = thread?.generationStage;
  const hasActiveStage =
    generationStage && generationStage !== GenerationStage.COMPLETE;
  const isIdle = !error && !isGenerating && !hasActiveStage;

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    error,
    isGenerating,
    generationStage,
    isIdle,
  });

  return (
    <Comp
      ref={ref}
      data-slot="message-suggestions-status"
      data-error={error ? "" : undefined}
      data-generating={isGenerating ? "" : undefined}
      data-generation-stage={generationStage || undefined}
      data-idle={isIdle ? "" : undefined}
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
