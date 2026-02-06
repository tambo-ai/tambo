import { Slot } from "@radix-ui/react-slot";
import { GenerationStage } from "@tambo-ai/react";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useMessageSuggestionsContext } from "../root/message-suggestions-context";

export type MessageSuggestionsStatusProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement>
>;

/**
 * Status primitive for message suggestions.
 * Renders error and generation stage information.
 * Delegates visual rendering to children.
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
>(function MessageSuggestionsStatus({ asChild, children, ...props }, ref) {
  const { error, isGenerating, thread } = useMessageSuggestionsContext();

  const generationStage = thread?.generationStage;
  const hasActiveStage =
    generationStage && generationStage !== GenerationStage.COMPLETE;
  const isIdle = !error && !isGenerating && !hasActiveStage;

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref}
      data-slot="message-suggestions-status"
      data-error={error ? "" : undefined}
      data-generating={isGenerating ? "" : undefined}
      data-generation-stage={generationStage || undefined}
      data-idle={isIdle ? "" : undefined}
      {...props}
    >
      {children}
    </Comp>
  );
});
