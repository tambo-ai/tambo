import { Slot } from "@radix-ui/react-slot";
import { type GenerationStage, useTambo } from "@tambo-ai/react";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";

/**
 * Props passed to the render callback for generation stage.
 */
export interface MessageSuggestionsGenerationStageRenderProps {
  /** The current generation stage string value. */
  stage: string;
  /** A human-friendly label for the current generation stage. */
  label: string;
  /** Whether the thread is idle (not actively processing). */
  isIdle: boolean;
  /** Whether to show the label text. */
  showLabel: boolean;
}

export interface MessageSuggestionsGenerationStageProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** Whether to show the label text. Defaults to true. */
  showLabel?: boolean;
}

/** Map of generation stage values to human-friendly labels. */
const stageLabels: Record<GenerationStage, string> = {
  IDLE: "Idle",
  CHOOSING_COMPONENT: "Choosing component",
  FETCHING_CONTEXT: "Fetching context",
  HYDRATING_COMPONENT: "Preparing component",
  STREAMING_RESPONSE: "Generating response",
  COMPLETE: "Complete",
  ERROR: "Error",
  CANCELLED: "Cancelled",
};

/**
 * Generation stage primitive for message suggestions.
 * Displays the current generation stage of the thread.
 * Renders nothing if no stage is active or the thread is idle.
 *
 * Applies data attributes for styling:
 * - `data-stage` with the current generation stage value
 * - `data-idle` when the thread is idle
 *
 * @returns A container element with generation stage information, or null when inactive.
 */
export const MessageSuggestionsGenerationStage = React.forwardRef<
  HTMLDivElement,
  BasePropsWithChildrenOrRenderFunction<
    MessageSuggestionsGenerationStageProps,
    MessageSuggestionsGenerationStageRenderProps
  >
>(function MessageSuggestionsGenerationStage(
  { showLabel = true, asChild, ...props },
  ref,
) {
  const { thread, isIdle } = useTambo();
  const stage = thread?.generationStage;

  if (!stage || isIdle) {
    return null;
  }

  const label =
    stageLabels[stage] || stage.charAt(0).toUpperCase() + stage.slice(1);

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    stage,
    label,
    isIdle,
    showLabel,
  });

  return (
    <Comp
      ref={ref}
      data-slot="message-suggestions-generation-stage"
      data-stage={stage}
      data-idle={isIdle ? "" : undefined}
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
