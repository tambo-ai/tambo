"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useGenerationStageContext } from "./generation-stage-context";

export interface GenerationStageWaitingState extends Record<string, unknown> {
  slot: string;
  isWaiting: boolean;
}

type GenerationStageWaitingComponentProps = useRender.ComponentProps<
  "div",
  GenerationStageWaitingState
>;

export interface GenerationStageWaitingProps extends GenerationStageWaitingComponentProps {
  /** Keeps the node mounted and toggles `data-hidden` when not waiting. */
  keepMounted?: boolean;
}

/**
 * Renders its children only when the thread is in the waiting state
 * (preparing a response, before streaming begins).
 * Use `keepMounted` to keep the node in the DOM and toggle `data-hidden` instead.
 */
export const GenerationStageWaiting = React.forwardRef<
  HTMLDivElement,
  GenerationStageWaitingProps
>((props, ref) => {
  const { isWaiting } = useGenerationStageContext();
  const { render, keepMounted, children, ...componentProps } = props;

  const state: GenerationStageWaitingState = {
    slot: "generation-stage-waiting",
    isWaiting,
  };

  if (!isWaiting && !keepMounted) {
    return null;
  }

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state,
    props: {
      ...componentProps,
      children: children ?? "Preparing response",
      "data-hidden": !isWaiting || undefined,
      "aria-hidden": !isWaiting || undefined,
    },
  });
});
GenerationStageWaiting.displayName = "GenerationStage.Waiting";
